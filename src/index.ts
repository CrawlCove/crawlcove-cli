/** Library entry point — for scripting against the crawler directly instead of the CLI. */
export { crawlSite, DEFAULT_CRAWL_OPTIONS, type CrawlOptions } from './crawl.js'
export { summarizeChecks, shouldFail, type CheckSummary } from './checks.js'
export { toJson, toCsv } from './output.js'
export type { CrawlResult, PageResult, FailOnCheck } from './types.js'
export { ALL_FAIL_ON_CHECKS } from './types.js'
