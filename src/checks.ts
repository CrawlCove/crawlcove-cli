import type { CrawlResult, FailOnCheck } from './types.js'

/** Per-category issue count for one crawl. */
export interface CheckSummary {
  brokenLinks: number
  missingTitles: number
  noindex: number
  redirectChains: number
}

/** A redirect chain is 2+ hops — a single redirect (old URL -> canonical new URL) is normal and not flagged. */
const REDIRECT_CHAIN_MIN_HOPS = 2

/** Count each category's issues across a crawl. */
export function summarizeChecks(result: CrawlResult): CheckSummary {
  let brokenLinks = 0
  let missingTitles = 0
  let noindex = 0
  let redirectChains = 0

  for (const page of result.pages) {
    brokenLinks += page.brokenInternalLinks.length
    if (page.fetchError !== null || (page.statusCode !== null && page.statusCode >= 400)) {
      brokenLinks += 1
    }
    if (!page.title || page.title.trim() === '') missingTitles += 1
    if (page.robotsMeta !== null && /noindex/.test(page.robotsMeta)) noindex += 1
    if (page.redirectHops >= REDIRECT_CHAIN_MIN_HOPS) redirectChains += 1
  }

  return { brokenLinks, missingTitles, noindex, redirectChains }
}

const CHECK_TO_SUMMARY_KEY: Record<FailOnCheck, keyof CheckSummary> = {
  'broken-links': 'brokenLinks',
  'missing-titles': 'missingTitles',
  noindex: 'noindex',
  'redirect-chains': 'redirectChains'
}

/**
 * Whether the crawl should exit non-zero: true when the total count across
 * every selected `failOn` category is >= threshold.
 */
export function shouldFail(
  summary: CheckSummary,
  failOn: readonly FailOnCheck[],
  threshold: number
): boolean {
  const total = failOn.reduce((sum, check) => sum + summary[CHECK_TO_SUMMARY_KEY[check]], 0)
  return total >= threshold
}
