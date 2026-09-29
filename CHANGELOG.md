# Changelog

## 1.1.2 — 2026-09-29

- `crawlcove --version`.
- README: install globally from the release tarball URL; on npm 10 a global
  `github:` install silently leaves a dangling symlink into npm's cache.

## 1.1.1 — 2026-09-29

- The built `dist/` is now committed, so `npm install -g github:CrawlCove/crawlcove-cli`
  and `npx github:CrawlCove/crawlcove-cli` work on every npm version. (npm 10's
  global git install skips dev dependencies before running `prepare`, so the
  previous build-on-install approach failed with `tsc: not found` on Node 20.)
  CI now fails if `dist/` is stale.

## 1.1.0 — 2026-09-29

- The JSON result now carries `summary` (`brokenLinks`, `missingTitles`,
  `noindex`, `redirectChains`) — the same counts the exit code is decided on —
  so consumers such as `crawlcove-action` no longer re-derive them.
- Library: `summarizeChecks()` accepts anything with a `pages` array;
  `CheckSummary` is exported from the package root.

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
