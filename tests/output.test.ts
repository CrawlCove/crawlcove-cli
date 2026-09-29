import { describe, expect, it } from 'vitest'
import { toCsv, toJson } from '../src/output.js'
import type { CrawlResult, PageResult } from '../src/types.js'

function page(overrides: Partial<PageResult> & { url: string }): PageResult {
  return {
    url: overrides.url,
    finalUrl: overrides.finalUrl ?? overrides.url,
    statusCode: overrides.statusCode ?? 200,
    redirectHops: overrides.redirectHops ?? 0,
    fetchError: overrides.fetchError ?? null,
    title: overrides.title ?? 'Title',
    titleLength: overrides.titleLength ?? 5,
    metaDescription: overrides.metaDescription ?? null,
    metaLength: overrides.metaLength ?? null,
    h1Count: overrides.h1Count ?? 1,
    canonical: overrides.canonical ?? null,
    robotsMeta: overrides.robotsMeta ?? null,
    indexable: overrides.indexable ?? true,
    brokenInternalLinks: overrides.brokenInternalLinks ?? []
  }
}

function result(pages: PageResult[]): CrawlResult {
  return {
    seedUrl: 'https://acme.test/',
    crawledAt: '2026-09-24T09:00:00.000Z',
    maxPages: 100,
    pageCount: pages.length,
    truncated: false,
    robotsIgnored: false,
    robotsBlocked: [],
    pages
  }
}

describe('toJson', () => {
  it('round-trips via JSON.parse and ends with a trailing newline', () => {
    const r = result([page({ url: 'https://acme.test/' })])
    const json = toJson(r)
    expect(json.endsWith('\n')).toBe(true)
    expect(JSON.parse(json)).toEqual(r)
  })
})

describe('toCsv', () => {
  it('renders booleans as yes/no and nulls as empty cells', () => {
    const r = result([page({ url: 'https://acme.test/', indexable: false, metaDescription: null })])
    const csv = toCsv(r)
    const [, row] = csv.split('\r\n')
    const cells = row.split(',')
    expect(cells[0]).toBe('https://acme.test/')
    expect(cells.includes('no')).toBe(true)
  })

  it('quotes a cell containing a comma and escapes embedded quotes', () => {
    const r = result([page({ url: 'https://acme.test/', title: 'Bread, "Fresh" Daily' })])
    const csv = toCsv(r)
    expect(csv).toContain('"Bread, ""Fresh"" Daily"')
  })

  it('neutralizes a formula-prefixed title with a leading apostrophe', () => {
    const r = result([page({ url: 'https://acme.test/', title: '=HYPERLINK("evil")' })])
    const csv = toCsv(r)
    expect(csv).toContain("'=HYPERLINK")
  })

  it('joins multiple broken internal links with "; "', () => {
    const r = result([
      page({
        url: 'https://acme.test/',
        brokenInternalLinks: ['https://acme.test/a', 'https://acme.test/b']
      })
    ])
    const csv = toCsv(r)
    expect(csv).toContain('https://acme.test/a; https://acme.test/b')
  })
})
