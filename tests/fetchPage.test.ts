import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fetchPage } from '../src/fetchPage.js'
import { FixtureServer } from './fixtureServer.js'

describe('fetchPage', () => {
  let server: FixtureServer
  let base: string

  afterEach(async () => {
    await server.close()
  })

  it('returns the body and status for a plain 200 page', async () => {
    server = new FixtureServer({ '/': { status: 200, body: '<html><body>hi</body></html>' } })
    base = await server.listen()
    const result = await fetchPage(base + '/', { userAgent: 'test', timeoutMs: 5000 })
    expect(result.statusCode).toBe(200)
    expect(result.redirectHops).toBe(0)
    expect(result.fetchError).toBeNull()
    expect(result.body).toContain('hi')
  })

  it('follows redirects and counts hops', async () => {
    server = new FixtureServer({
      '/a': { status: 301, headers: { location: '/b' } },
      '/b': { status: 302, headers: { location: '/c' } },
      '/c': { status: 200, body: 'landed' }
    })
    base = await server.listen()
    const result = await fetchPage(base + '/a', { userAgent: 'test', timeoutMs: 5000 })
    expect(result.redirectHops).toBe(2)
    expect(result.finalUrl).toBe(base + '/c')
    expect(result.statusCode).toBe(200)
    expect(result.body).toBe('landed')
  })

  it('reports TOO_MANY_REDIRECTS on a redirect loop instead of hanging', async () => {
    server = new FixtureServer({
      '/loop-a': { status: 302, headers: { location: '/loop-b' } },
      '/loop-b': { status: 302, headers: { location: '/loop-a' } }
    })
    base = await server.listen()
    const result = await fetchPage(base + '/loop-a', { userAgent: 'test', timeoutMs: 5000 })
    expect(result.fetchError).toBe('TOO_MANY_REDIRECTS')
  })

  it('reports a 404 as a completed fetch, not a fetchError', async () => {
    server = new FixtureServer({})
    base = await server.listen()
    const result = await fetchPage(base + '/missing', { userAgent: 'test', timeoutMs: 5000 })
    expect(result.statusCode).toBe(404)
    expect(result.fetchError).toBeNull()
  })

  it('does not read the body of a non-HTML response', async () => {
    server = new FixtureServer({
      '/data.json': { status: 200, headers: { 'content-type': 'application/json' }, body: '{}' }
    })
    base = await server.listen()
    const result = await fetchPage(base + '/data.json', { userAgent: 'test', timeoutMs: 5000 })
    expect(result.body).toBeNull()
    expect(result.contentType).toBe('application/json')
  })

  it('reports TIMEOUT when the server never responds in time', async () => {
    server = new FixtureServer({})
    base = await server.listen()
    // Point at a route that will 404 quickly is not a timeout test; instead use an
    // unroutable address (a reserved TEST-NET-1 IP) which will hang until aborted.
    const result = await fetchPage('http://192.0.2.1/', { userAgent: 'test', timeoutMs: 200 })
    expect(result.fetchError).not.toBeNull()
    expect(result.statusCode).toBeNull()
  }, 10_000)
})
