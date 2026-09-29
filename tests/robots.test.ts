import { afterEach, describe, expect, it } from 'vitest'
import { loadRobots } from '../src/robots.js'
import { FixtureServer } from './fixtureServer.js'

const OPTS = { userAgent: 'crawlcove-cli/1.0 (+https://github.com/CrawlCove/crawlcove-cli)', timeoutMs: 2000 }

describe('loadRobots', () => {
  let server: FixtureServer

  afterEach(async () => {
    await server.close()
  })

  it('applies Disallow rules from the * group, longest match wins', async () => {
    server = new FixtureServer({
      '/robots.txt': {
        headers: { 'content-type': 'text/plain' },
        body: 'User-agent: *\nDisallow: /private/\nAllow: /private/public-page\n'
      }
    })
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('parsed')
    expect(rules.isAllowed(base + '/')).toBe(true)
    expect(rules.isAllowed(base + '/private/secret')).toBe(false)
    expect(rules.isAllowed(base + '/private/public-page')).toBe(true)
  })

  it('prefers a group addressed to crawlcove-cli over the * group', async () => {
    server = new FixtureServer({
      '/robots.txt': {
        headers: { 'content-type': 'text/plain' },
        body: 'User-agent: *\nDisallow: /\n\nUser-agent: crawlcove-cli\nDisallow: /admin/\n'
      }
    })
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.isAllowed(base + '/')).toBe(true)
    expect(rules.isAllowed(base + '/admin/users')).toBe(false)
  })

  it('treats a 404 robots.txt as allow-all', async () => {
    server = new FixtureServer({})
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('not-found-allow-all')
    expect(rules.status).toBe(404)
    expect(rules.isAllowed(base + '/anything')).toBe(true)
  })

  it('treats a 5xx robots.txt as disallow-all', async () => {
    server = new FixtureServer({ '/robots.txt': { status: 503, body: 'down' } })
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('server-error-disallow-all')
    expect(rules.isAllowed(base + '/')).toBe(false)
  })

  it('treats an empty 200 robots.txt as allow-all', async () => {
    server = new FixtureServer({ '/robots.txt': { headers: { 'content-type': 'text/plain' }, body: '\n' } })
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('no-rules-allow-all')
    expect(rules.isAllowed(base + '/')).toBe(true)
  })

  it('follows a redirect to the real robots.txt', async () => {
    server = new FixtureServer({
      '/robots.txt': { status: 301, headers: { location: '/real-robots.txt' } },
      '/real-robots.txt': { headers: { 'content-type': 'text/plain' }, body: 'User-agent: *\nDisallow: /x\n' }
    })
    const base = await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('parsed')
    expect(rules.isAllowed(base + '/x')).toBe(false)
  })

  it('treats an unreachable origin as disallow-all', async () => {
    server = new FixtureServer({})
    const base = await server.listen()
    await server.close()
    server = new FixtureServer({}) // so afterEach has something to close
    await server.listen()
    const rules = await loadRobots(base, OPTS)
    expect(rules.source).toBe('fetch-error-disallow-all')
    expect(rules.isAllowed(base + '/')).toBe(false)
  })
})
