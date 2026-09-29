import { fetchPage } from './fetchPage.js'
import { parseHtml } from './parseHtml.js'
import { loadRobots, ROBOTS_IGNORED, type RobotsRules } from './robots.js'
import type { CrawlResult, PageResult } from './types.js'

export interface CrawlOptions {
  maxPages: number
  concurrency: number
  timeoutMs: number
  userAgent: string
  /** Skip robots.txt entirely. Off by default — only for sites you own or are authorised to crawl. */
  ignoreRobots: boolean
  now: () => Date
}

/** Thrown when robots.txt disallows the seed URL itself, so there is nothing the crawl may fetch. */
export class SeedBlockedByRobotsError extends Error {
  constructor(public readonly seedUrl: string) {
    super(`robots.txt disallows ${seedUrl} for this crawler`)
    this.name = 'SeedBlockedByRobotsError'
  }
}

export const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxPages: 100,
  concurrency: 4,
  timeoutMs: 15_000,
  userAgent: 'crawlcove-cli/1.0 (+https://github.com/CrawlCove/crawlcove-cli)',
  ignoreRobots: false,
  now: () => new Date()
}

interface FetchedRecord {
  page: PageResult
  internalLinks: string[]
}

/**
 * Crawl `seedUrl`, following only same-origin links, breadth-first, up to
 * `opts.maxPages`. robots.txt is fetched first and a disallowed URL is never
 * fetched (it is listed in `robotsBlocked` instead) unless `opts.ignoreRobots`.
 * Throws SeedBlockedByRobotsError when the seed itself is disallowed.
 */
export async function crawlSite(seedUrl: string, opts: CrawlOptions): Promise<CrawlResult> {
  const origin = new URL(seedUrl).origin
  const robots: RobotsRules = opts.ignoreRobots ? ROBOTS_IGNORED : await loadRobots(origin, opts)
  if (!robots.isAllowed(seedUrl)) throw new SeedBlockedByRobotsError(seedUrl)

  const visited = new Set<string>([seedUrl])
  const queue: string[] = [seedUrl]
  const records: FetchedRecord[] = []
  const robotsBlocked: string[] = []
  let truncated = false

  while (queue.length > 0 && records.length < opts.maxPages) {
    const batchSize = Math.min(opts.concurrency, opts.maxPages - records.length)
    const batch = queue.splice(0, batchSize)
    const results = await Promise.all(batch.map((url) => fetchOne(url, opts)))

    for (const record of results) {
      records.push(record)
      for (const link of record.internalLinks) {
        if (records.length + queue.length >= opts.maxPages) {
          truncated = true
          break
        }
        if (isSameOrigin(link, origin) && !visited.has(link)) {
          visited.add(link)
          if (robots.isAllowed(link)) queue.push(link)
          else robotsBlocked.push(link)
        }
      }
    }
  }
  if (queue.length > 0) truncated = true

  const brokenUrls = new Set(
    records.filter((r) => isBroken(r.page)).map((r) => r.page.url)
  )
  const pages: PageResult[] = records.map((r) => ({
    ...r.page,
    brokenInternalLinks: r.internalLinks.filter((link) => brokenUrls.has(link))
  }))

  return {
    seedUrl,
    crawledAt: opts.now().toISOString(),
    maxPages: opts.maxPages,
    pageCount: pages.length,
    truncated,
    robotsIgnored: opts.ignoreRobots,
    robotsBlocked,
    pages
  }
}

function isBroken(page: PageResult): boolean {
  return page.fetchError !== null || (page.statusCode !== null && page.statusCode >= 400)
}

function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin
  } catch {
    return false
  }
}

async function fetchOne(url: string, opts: CrawlOptions): Promise<FetchedRecord> {
  const raw = await fetchPage(url, opts)
  if (raw.body === null) {
    return {
      page: {
        url,
        finalUrl: raw.finalUrl,
        statusCode: raw.statusCode,
        redirectHops: raw.redirectHops,
        fetchError: raw.fetchError,
        title: null,
        titleLength: null,
        metaDescription: null,
        metaLength: null,
        h1Count: null,
        canonical: null,
        robotsMeta: null,
        indexable: false,
        brokenInternalLinks: []
      },
      internalLinks: []
    }
  }

  const parsed = parseHtml(raw.body, raw.finalUrl)
  const isNoindex = parsed.robotsMeta !== null && /noindex/.test(parsed.robotsMeta)
  return {
    page: {
      url,
      finalUrl: raw.finalUrl,
      statusCode: raw.statusCode,
      redirectHops: raw.redirectHops,
      fetchError: raw.fetchError,
      title: parsed.title,
      titleLength: parsed.title?.length ?? null,
      metaDescription: parsed.metaDescription,
      metaLength: parsed.metaDescription?.length ?? null,
      h1Count: parsed.h1Count,
      canonical: parsed.canonical,
      robotsMeta: parsed.robotsMeta,
      indexable: raw.statusCode === 200 && !isNoindex,
      brokenInternalLinks: []
    },
    internalLinks: parsed.links
  }
}
