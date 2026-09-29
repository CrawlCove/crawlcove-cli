import robotsParserModule from 'robots-parser'

/** robots-parser ships a CommonJS default export; its .d.ts does not resolve to a callable under Node16 ESM resolution, so type the call ourselves. */
interface RobotsTxtParser {
  isAllowed(url: string, ua?: string): boolean | undefined
}
const robotsParser = robotsParserModule as unknown as (url: string, body: string) => RobotsTxtParser

/** The parsed robots.txt rules for one origin. */
export interface RobotsRules {
  /** True when `url` (same origin as the rules) may be fetched. */
  isAllowed: (url: string) => boolean
  /** HTTP status of the robots.txt fetch, or null on a transport error. */
  status: number | null
  /** Why the rules are what they are — surfaced on stderr so a surprising result is explainable. */
  source: 'parsed' | 'not-found-allow-all' | 'no-rules-allow-all' | 'server-error-disallow-all' | 'fetch-error-disallow-all' | 'ignored'
}

/** What `--ignore-robots` produces: every URL allowed, nothing fetched. */
export const ROBOTS_IGNORED: RobotsRules = { isAllowed: () => true, status: null, source: 'ignored' }

const ROBOTS_REDIRECT_LIMIT = 5

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
export async function loadRobots(
  origin: string,
  opts: { userAgent: string; timeoutMs: number }
): Promise<RobotsRules> {
  const robotsUrl = `${origin}/robots.txt`
  let res: Response
  try {
    res = await fetchFollowingRedirects(robotsUrl, opts)
  } catch {
    return { isAllowed: () => false, status: null, source: 'fetch-error-disallow-all' }
  }

  if (res.status === 404 || res.status === 410) {
    return { isAllowed: () => true, status: res.status, source: 'not-found-allow-all' }
  }
  if (res.status >= 500) {
    return { isAllowed: () => false, status: res.status, source: 'server-error-disallow-all' }
  }
  const body = res.ok ? await res.text() : ''
  if (body.trim() === '') {
    return { isAllowed: () => true, status: res.status, source: 'no-rules-allow-all' }
  }

  const parser = robotsParser(robotsUrl, body)
  return {
    // `?? true`: the parser has no opinion on a URL off its own origin; the
    // crawler only asks about same-origin URLs, so this is a defensive default.
    isAllowed: (url) => parser.isAllowed(url, opts.userAgent) ?? true,
    status: res.status,
    source: 'parsed'
  }
}

async function fetchFollowingRedirects(
  url: string,
  opts: { userAgent: string; timeoutMs: number }
): Promise<Response> {
  let current = url
  for (let hop = 0; ; hop++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
    let res: Response
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'user-agent': opts.userAgent },
        signal: controller.signal
      })
    } finally {
      clearTimeout(timer)
    }
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location && hop < ROBOTS_REDIRECT_LIMIT) {
      current = new URL(location, current).toString()
      continue
    }
    return res
  }
}
