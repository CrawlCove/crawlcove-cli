import type { CrawlResult } from './types.js';
/** Serialize a crawl result to pretty-printed JSON (2-space indent, trailing newline). */
export declare function toJson(result: CrawlResult): string;
/** Serialize a crawl result to RFC-4180 CSV (CRLF line endings, no trailing newline). */
export declare function toCsv(result: CrawlResult): string;
