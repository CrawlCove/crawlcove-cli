import type { CrawlResult } from './types.js';
export interface CrawlOptions {
    maxPages: number;
    concurrency: number;
    timeoutMs: number;
    userAgent: string;
    /** Skip robots.txt entirely. Off by default — only for sites you own or are authorised to crawl. */
    ignoreRobots: boolean;
    now: () => Date;
}
/** Thrown when robots.txt disallows the seed URL itself, so there is nothing the crawl may fetch. */
export declare class SeedBlockedByRobotsError extends Error {
    readonly seedUrl: string;
    constructor(seedUrl: string);
}
export declare const DEFAULT_CRAWL_OPTIONS: CrawlOptions;
/**
 * Crawl `seedUrl`, following only same-origin links, breadth-first, up to
 * `opts.maxPages`. robots.txt is fetched first and a disallowed URL is never
 * fetched (it is listed in `robotsBlocked` instead) unless `opts.ignoreRobots`.
 * Throws SeedBlockedByRobotsError when the seed itself is disallowed.
 */
export declare function crawlSite(seedUrl: string, opts: CrawlOptions): Promise<CrawlResult>;
