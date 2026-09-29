/** Library entry point — for scripting against the crawler directly instead of the CLI. */
export { crawlSite, DEFAULT_CRAWL_OPTIONS, DEFAULT_USER_AGENT, SeedBlockedByRobotsError } from './crawl.js';
export { loadRobots } from './robots.js';
export { summarizeChecks, shouldFail } from './checks.js';
export { toJson, toCsv } from './output.js';
export { ALL_FAIL_ON_CHECKS } from './types.js';
