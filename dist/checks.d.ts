import type { CheckSummary, FailOnCheck, PageResult } from './types.js';
export type { CheckSummary } from './types.js';
/** Count each category's issues across a crawl's pages. */
export declare function summarizeChecks(result: {
    pages: readonly PageResult[];
}): CheckSummary;
/**
 * Whether the crawl should exit non-zero: true when the total count across
 * every selected `failOn` category is >= threshold.
 */
export declare function shouldFail(summary: CheckSummary, failOn: readonly FailOnCheck[], threshold: number): boolean;
