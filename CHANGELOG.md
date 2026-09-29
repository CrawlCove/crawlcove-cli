# Changelog

## 1.0.0 — 2026-09-29

Initial release.

- `crawlcove crawl <url>` (breadth-first, same-origin, `--max-pages`,
  `--concurrency`, `--timeout`); `crawl` is the default command so
  `crawlcove <url>` works too.
- Respects robots.txt (`User-agent: crawlcove-cli` group, else `*`): disallowed
  URLs are never fetched and are listed under `robotsBlocked`; a disallowed
  start URL exits 2 without fetching anything. `--ignore-robots` opts out for
  sites you own.
- Checks: status codes, redirect chains (2+ hops), titles, meta descriptions,
  H1 counts, canonicals, noindex (robots meta), broken internal links.
- `--output json|csv`, `--file <path>`.
- `--fail-on <checks>` and `--threshold <n>` for a configurable non-zero exit
  code — built for CI (see the upcoming `crawlcove-action`, which wraps this
  CLI).
- Output field names match [crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec)
  where the CLI checks the same thing, so a consumer of the desktop app's
  export needs no translation layer to also consume this CLI's output.

Known gaps for a later release: X-Robots-Tag response headers are not read
(only the `<meta name="robots">` tag) and `Crawl-delay` is ignored — see the
README's Limitations section.
