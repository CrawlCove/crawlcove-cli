import { afterEach, describe, expect, it } from 'vitest'
import { crawlSite, DEFAULT_CRAWL_OPTIONS } from '../src/crawl.js'
import { FixtureServer } from './fixtureServer.js'

const NOW = () => new Date('2026-09-24T09:00:00.000Z')

describe('crawlSite', () => {
  let server: FixtureServer

  afterEach(async () => {
    await server.close()
  })

  it('follows same-origin links breadth-first and stops discovering new ones past max-pages', async () => {
    server = new FixtureServer({
      '/': { body: '<html><head><title>Home</title></head><body><a href="/about">About</a></body></html>' },
      '/about': {
        body: '<html><head><title>About</title></head><body><a href="/contact">Contact</a></body></html>'
      },
      '/contact': { body: '<html><head><title>Contact</title></head><body></body></html>' }
    })
    const base = await server.listen()
    const result = await crawlSite(base + '/', { ...DEFAULT_CRAWL_OPTIONS, maxPages: 100, now: NOW })
    expect(result.pageCount).toBe(3)
    expect(result.truncated).toBe(false)
    expect(result.pages.map((p) => p.url).sort()).toEqual(
      [base + '/', base + '/about', base + '/contact'].sort()
    )
  })

  it('never follows a link to another origin', async () => {
    server = new FixtureServer({
      '/': {
        body: '<html><body><a href="https://elsewhere.test/page">Away</a></body></html>'
      }
    })
    const base = await server.listen()
    const result = await crawlSite(base + '/', { ...DEFAULT_CRAWL_OPTIONS, now: NOW })
    expect(result.pageCount).toBe(1)
    expect(result.pages[0].url).toBe(base + '/')
  })

  it('caps the crawl at maxPages and reports truncated', async () => {
    server = new FixtureServer({
      '/': { body: '<html><body><a href="/p1">1</a><a href="/p2">2</a><a href="/p3">3</a></body></html>' },
      '/p1': { body: '<html><body></body></html>' },
      '/p2': { body: '<html><body></body></html>' },
      '/p3': { body: '<html><body></body></html>' }
    })
    const base = await server.listen()
    const result = await crawlSite(base + '/', { ...DEFAULT_CRAWL_OPTIONS, maxPages: 2, now: NOW })
    expect(result.pageCount).toBe(2)
    expect(result.truncated).toBe(true)
  })

  it('marks a page as noindex-aware indexable=false, and flags links pointing at broken pages', async () => {
    server = new FixtureServer({
      '/': {
        body: '<html><body><a href="/broken">Broken</a><a href="/noindexed">Noindexed</a></body></html>'
      },
      '/noindexed': { body: '<html><head><meta name="robots" content="noindex"></head><body></body></html>' }
      // '/broken' deliberately not registered -> 404
    })
    const base = await server.listen()
    const result = await crawlSite(base + '/', { ...DEFAULT_CRAWL_OPTIONS, now: NOW })
    const home = result.pages.find((p) => p.url === base + '/')!
    const broken = result.pages.find((p) => p.url === base + '/broken')!
    const noindexed = result.pages.find((p) => p.url === base + '/noindexed')!

    expect(home.brokenInternalLinks).toEqual([base + '/broken'])
    expect(broken.statusCode).toBe(404)
    expect(broken.indexable).toBe(false)
    expect(noindexed.robotsMeta).toBe('noindex')
    expect(noindexed.indexable).toBe(false)
  })

  it('records redirect hops on a page reached via a redirect', async () => {
    server = new FixtureServer({
      '/': { body: '<html><body><a href="/old">Old</a></body></html>' },
      '/old': { status: 301, headers: { location: '/new' } },
      '/new': { body: '<html><head><title>New</title></head><body></body></html>' }
    })
    const base = await server.listen()
    const result = await crawlSite(base + '/', { ...DEFAULT_CRAWL_OPTIONS, now: NOW })
    const old = result.pages.find((p) => p.url === base + '/old')!
    expect(old.redirectHops).toBe(1)
    expect(old.finalUrl).toBe(base + '/new')
  })
})
