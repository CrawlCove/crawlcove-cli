# Changelog

## 1.0.0 — 2026-09-24

Initial release.

- `crawlcove crawl <url>` (breadth-first, same-origin, `--max-pages`,
  `--concurrency`, `--timeout`).
- Checks: status codes, redirect chains (2+ hops), titles, meta descriptions,
  H1 counts, canonicals, noindex (robots meta), broken internal links.
- `--output json|csv`, `--file <path>`.
- `--fail-on <checks>` and `--threshold <n>` for a configurable non-zero exit
  code — built for CI (see the upcoming `crawlcove-action`, which wraps this
  CLI).
- Output field names match [crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec)
  where the CLI checks the same thing, so a consumer of the desktop app's
  export needs no translation layer to also consume this CLI's output.

Known gaps for a later release: robots.txt is not yet respected, and X-Robots-Tag
response headers are not read (only the `<meta name="robots">` tag) — see the
README's Limitations section.
