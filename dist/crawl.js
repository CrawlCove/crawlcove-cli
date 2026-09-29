import { summarizeChecks } from './checks.js';
import { fetchPage } from './fetchPage.js';
import { parseHtml } from './parseHtml.js';
import { loadRobots, ROBOTS_IGNORED } from './robots.js';
/** Thrown when robots.txt disallows the seed URL itself, so there is nothing the crawl may fetch. */
export class SeedBlockedByRobotsError extends Error {
    seedUrl;
    constructor(seedUrl) {
        super(`robots.txt disallows ${seedUrl} for this crawler`);
        this.seedUrl = seedUrl;
        this.name = 'SeedBlockedByRobotsError';
    }
}
export const DEFAULT_CRAWL_OPTIONS = {
    maxPages: 100,
    concurrency: 4,
    timeoutMs: 15_000,
    userAgent: 'crawlcove-cli/1.0 (+https://github.com/CrawlCove/crawlcove-cli)',
    ignoreRobots: false,
    now: () => new Date()
};
/**
 * Crawl `seedUrl`, following only same-origin links, breadth-first, up to
 * `opts.maxPages`. robots.txt is fetched first and a disallowed URL is never
 * fetched (it is listed in `robotsBlocked` instead) unless `opts.ignoreRobots`.
 * Throws SeedBlockedByRobotsError when the seed itself is disallowed.
 */
export async function crawlSite(seedUrl, opts) {
    const origin = new URL(seedUrl).origin;
    const robots = opts.ignoreRobots ? ROBOTS_IGNORED : await loadRobots(origin, opts);
    if (!robots.isAllowed(seedUrl))
        throw new SeedBlockedByRobotsError(seedUrl);
    const visited = new Set([seedUrl]);
    const queue = [seedUrl];
    const records = [];
    const robotsBlocked = [];
    let truncated = false;
    while (queue.length > 0 && records.length < opts.maxPages) {
        const batchSize = Math.min(opts.concurrency, opts.maxPages - records.length);
        const batch = queue.splice(0, batchSize);
        const results = await Promise.all(batch.map((url) => fetchOne(url, opts)));
        for (const record of results) {
            records.push(record);
            for (const link of record.internalLinks) {
                if (records.length + queue.length >= opts.maxPages) {
                    truncated = true;
                    break;
                }
                if (isSameOrigin(link, origin) && !visited.has(link)) {
                    visited.add(link);
                    if (robots.isAllowed(link))
                        queue.push(link);
                    else
                        robotsBlocked.push(link);
                }
            }
        }
    }
    if (queue.length > 0)
        truncated = true;
    const brokenUrls = new Set(records.filter((r) => isBroken(r.page)).map((r) => r.page.url));
    const pages = records.map((r) => ({
        ...r.page,
        brokenInternalLinks: r.internalLinks.filter((link) => brokenUrls.has(link))
    }));
    return {
        seedUrl,
        crawledAt: opts.now().toISOString(),
        maxPages: opts.maxPages,
        pageCount: pages.length,
        truncated,
        robotsIgnored: opts.ignoreRobots,
        robotsBlocked,
        summary: summarizeChecks({ pages }),
        pages
    };
}
function isBroken(page) {
    return page.fetchError !== null || (page.statusCode !== null && page.statusCode >= 400);
}
function isSameOrigin(url, origin) {
    try {
        return new URL(url).origin === origin;
    }
    catch {
        return false;
    }
}
async function fetchOne(url, opts) {
    const raw = await fetchPage(url, opts);
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
        };
    }
    const parsed = parseHtml(raw.body, raw.finalUrl);
    const isNoindex = parsed.robotsMeta !== null && /noindex/.test(parsed.robotsMeta);
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
    };
}
