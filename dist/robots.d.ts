/** The parsed robots.txt rules for one origin. */
export interface RobotsRules {
    /** True when `url` (same origin as the rules) may be fetched. */
    isAllowed: (url: string) => boolean;
    /** HTTP status of the robots.txt fetch, or null on a transport error. */
    status: number | null;
    /** Why the rules are what they are — surfaced on stderr so a surprising result is explainable. */
    source: 'parsed' | 'not-found-allow-all' | 'no-rules-allow-all' | 'server-error-disallow-all' | 'fetch-error-disallow-all' | 'ignored';
}
/** What `--ignore-robots` produces: every URL allowed, nothing fetched. */
export declare const ROBOTS_IGNORED: RobotsRules;
/**
 * Fetch and parse `${origin}/robots.txt` with the same defaults the Crawl Cove
 * desktop app uses, so the CLI and the app agree on what a site permits:
 *   - 404 / 410              -> allow all (no robots.txt published)
 *   - 5xx                    -> disallow all (an unhealthy origin is off-limits)
 *   - transport error        -> disallow all
 *   - other 4xx / empty body -> allow all (no rules to apply)
 *
 * User-agent groups are matched on the product token before the `/`
 * (`crawlcove-cli/1.0 (...)` matches `User-agent: crawlcove-cli`), falling
 * back to the `*` group — RFC 9309 §2.2.1.
 */
export declare function loadRobots(origin: string, opts: {
    userAgent: string;
    timeoutMs: number;
}): Promise<RobotsRules>;
