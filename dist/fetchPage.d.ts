export interface RawFetchResult {
    finalUrl: string;
    statusCode: number | null;
    redirectHops: number;
    fetchError: string | null;
    contentType: string | null;
    body: string | null;
}
/**
 * Fetch a URL, following redirects manually so the hop count is observable
 * (the fetch spec's automatic redirect following discards it). Stops and
 * reports an error after MAX_REDIRECT_HOPS rather than looping forever on a
 * redirect cycle.
 */
export declare function fetchPage(url: string, opts: {
    userAgent: string;
    timeoutMs: number;
}): Promise<RawFetchResult>;
