/** One crawled page's result. Field names mirror crawlcove-export-spec's page shape where the CLI checks the same thing, so a consumer already parsing the desktop app's export needs no translation layer. */
export interface PageResult {
  url: string
  finalUrl: string
  statusCode: number | null
  /** Number of redirect hops the URL went through (0 = none). */
  redirectHops: number
  /** True when this page's own request could not be completed at all (DNS/timeout/connection reset). */
  fetchError: string | null
  title: string | null
  titleLength: number | null
  metaDescription: string | null
  metaLength: number | null
  h1Count: number | null
  canonical: string | null
  robotsMeta: string | null
  /** Derived: HTTP 200 and not noindex (robots meta only — the CLI does not read response headers for X-Robots-Tag yet). */
  indexable: boolean
  /** Same-origin links found on the page that this crawl also visited and got a 4xx/5xx or fetch error for. */
  brokenInternalLinks: string[]
}

/** One crawl's full result set. */
export interface CrawlResult {
  seedUrl: string
  crawledAt: string
  maxPages: number
  pageCount: number
  truncated: boolean
  pages: PageResult[]
}

/** Which failure categories can trip a non-zero exit code. */
export type FailOnCheck = 'broken-links' | 'missing-titles' | 'noindex' | 'redirect-chains'

export const ALL_FAIL_ON_CHECKS: readonly FailOnCheck[] = [
  'broken-links',
  'missing-titles',
  'noindex',
  'redirect-chains'
]
