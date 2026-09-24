import { describe, expect, it } from 'vitest'
import { shouldFail, summarizeChecks } from '../src/checks.js'
import type { CrawlResult, PageResult } from '../src/types.js'

function page(overrides: Partial<PageResult> & { url: string }): PageResult {
  return {
    url: overrides.url,
    finalUrl: overrides.finalUrl ?? overrides.url,
    statusCode: overrides.statusCode ?? 200,
    redirectHops: overrides.redirectHops ?? 0,
    fetchError: overrides.fetchError ?? null,
    title: 'title' in overrides ? (overrides.title ?? null) : 'A title',
    titleLength: null,
    metaDescription: overrides.metaDescription ?? 'A description',
    metaLength: null,
    h1Count: overrides.h1Count ?? 1,
    canonical: overrides.canonical ?? overrides.url,
    robotsMeta: overrides.robotsMeta ?? null,
    indexable: overrides.indexable ?? true,
    brokenInternalLinks: overrides.brokenInternalLinks ?? []
  }
}

function result(pages: PageResult[]): CrawlResult {
  return {
    seedUrl: pages[0]?.url ?? 'https://acme.test/',
    crawledAt: '2026-09-24T09:00:00.000Z',
    maxPages: 100,
    pageCount: pages.length,
    truncated: false,
    pages
  }
}

describe('summarizeChecks', () => {
  it('counts a broken page itself, plus any page linking to a broken page', () => {
    const summary = summarizeChecks(
      result([
        page({ url: 'https://acme.test/', brokenInternalLinks: ['https://acme.test/gone'] }),
        page({ url: 'https://acme.test/gone', statusCode: 404 })
      ])
    )
    // 1 (the broken page itself) + 1 (the link to it from the home page) = 2
    expect(summary.brokenLinks).toBe(2)
  })

  it('counts a page whose own request failed as broken', () => {
    const summary = summarizeChecks(result([page({ url: 'https://acme.test/', statusCode: null, fetchError: 'ETIMEDOUT' })]))
    expect(summary.brokenLinks).toBe(1)
  })

  it('counts empty and missing titles as missing', () => {
    const summary = summarizeChecks(
      result([
        page({ url: 'https://acme.test/a', title: null }),
        page({ url: 'https://acme.test/b', title: '   ' }),
        page({ url: 'https://acme.test/c', title: 'Fine' })
      ])
    )
    expect(summary.missingTitles).toBe(2)
  })

  it('counts noindex pages by robots meta', () => {
    const summary = summarizeChecks(result([page({ url: 'https://acme.test/', robotsMeta: 'noindex, follow' })]))
    expect(summary.noindex).toBe(1)
  })

  it('only counts a redirect as a "chain" at 2+ hops, not a single redirect', () => {
    const summary = summarizeChecks(
      result([
        page({ url: 'https://acme.test/single', redirectHops: 1 }),
        page({ url: 'https://acme.test/chain', redirectHops: 2 })
      ])
    )
    expect(summary.redirectChains).toBe(1)
  })
})

describe('shouldFail', () => {
  it('fails once the total across the selected checks meets the threshold', () => {
    const summary = { brokenLinks: 2, missingTitles: 0, noindex: 0, redirectChains: 0 }
    expect(shouldFail(summary, ['broken-links'], 2)).toBe(true)
    expect(shouldFail(summary, ['broken-links'], 3)).toBe(false)
  })

  it('ignores categories not selected in failOn', () => {
    const summary = { brokenLinks: 0, missingTitles: 5, noindex: 0, redirectChains: 0 }
    expect(shouldFail(summary, ['broken-links'], 1)).toBe(false)
  })

  it('never fails when failOn is empty, regardless of issue counts', () => {
    const summary = { brokenLinks: 99, missingTitles: 99, noindex: 99, redirectChains: 99 }
    expect(shouldFail(summary, [], 1)).toBe(false)
  })
})
