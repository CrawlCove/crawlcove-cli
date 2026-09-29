# crawlcove

A command line SEO crawler for scripts and CI — crawl a site headlessly and check status codes, redirect chains, titles, meta descriptions, H1s, canonicals, noindex and broken internal links, with a configurable non-zero exit code for pipelines.

## Install

Straight from GitHub (Node 18+):

```sh
# one-off, nothing installed:
npx github:CrawlCove/crawlcove-cli crawl https://example.com

# global command, from a release tarball:
npm install -g https://github.com/CrawlCove/crawlcove-cli/archive/refs/tags/v1.1.3.tar.gz
crawlcove --version
```

The tarball form is deliberate: `npm install -g github:CrawlCove/crawlcove-cli`
looks like it works on npm 10 but leaves a dangling symlink into npm's cache
(a non-global `npm install github:CrawlCove/crawlcove-cli` is fine). The npm
package `crawlcove` is coming — once it is published, `npm install -g crawlcove`
and `npx crawlcove crawl https://example.com` will work too.

## Usage

```sh
crawlcove crawl <url> [options]     # `crawl` is the default command, so `crawlcove <url>` works too

Options:
  -o, --output <format>   json or csv (default: json)
  --file <path>           write output to a file instead of stdout
  --max-pages <n>         stop after crawling this many pages (default: 100)
  --concurrency <n>       simultaneous requests (default: 4)
  --timeout <ms>          per-request timeout in milliseconds (default: 15000)
  --ignore-robots         crawl URLs that robots.txt disallows (only for sites you own or are authorised to crawl)
  --fail-on <checks>      comma-separated: broken-links, missing-titles, noindex, redirect-chains, or "none"
                          (default: all four)
  --threshold <n>         exit non-zero once the selected checks total this many issues (default: 1)
```

Exit codes: `0` clean, `1` the selected `--fail-on` checks reached `--threshold`,
`2` usage error or robots.txt disallowed the start URL itself (nothing was fetched).

Example — fail a CI build only on broken links, tolerating everything else:

```sh
crawlcove crawl https://staging.example.com --fail-on broken-links --threshold 1
```

## robots.txt

The crawler fetches `/robots.txt` before anything else and never requests a
URL it disallows — skipped URLs are listed under `robotsBlocked` in the output
and counted on stderr. It honours a `User-agent: crawlcove-cli` group if you
publish one, otherwise the `*` group. A missing robots.txt (404) allows
everything; a server error (5xx) or unreachable origin allows nothing — the
same defaults as the Crawl Cove desktop app. `--ignore-robots` turns this off
for sites you own (a staging host behind a blanket `Disallow: /`, for example).

Requests identify themselves as `crawlcove-cli/<version> (+https://crawlcove.com/open-source/crawlcove-cli)`,
so a site owner who finds the string in an access log can read what it does.

## Output

JSON output is one object per crawled page (see
[crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec) for
the full field reference — this CLI's field names match it where it checks the
same thing). CSV output is the same data as RFC 4180 CSV.

## Limitations (v1)

- Noindex detection reads only the `<meta name="robots">` tag, not the
  `X-Robots-Tag` response header.
- Follows same-origin links only — no scoping to a URL prefix yet.
- Ignores `Crawl-delay`; use `--concurrency 1` on sites that ask for one.

## Works with CrawlCove

This CLI shares its checks and output shape with [Crawl Cove](https://crawlcove.com/?utm_source=github&utm_medium=crawlcove-cli), a desktop SEO crawler for Windows and Mac. Use this CLI for scripted, scheduled, or CI crawls; open the same site in the desktop app for the full visual report, historical tracking, and Search Console integration.

This repo has its own page on crawlcove.com: [Crawl Cove CLI](https://crawlcove.com/open-source/crawlcove-cli?utm_source=github&utm_medium=crawlcove-cli), with the guide to running an SEO audit from the terminal at [https://crawlcove.com/blog/seo-audit-from-the-terminal](https://crawlcove.com/blog/seo-audit-from-the-terminal?utm_source=github&utm_medium=crawlcove-cli).

## Related tools

- [crawlcove-sf-import](https://github.com/CrawlCove/crawlcove-sf-import) — convert a Screaming Frog export into the Crawl Cove export format, with a report of what carried over.
- [crawlcove-schema-validator](https://github.com/CrawlCove/crawlcove-schema-validator) — validate a page's JSON-LD against Google's required and recommended rich-result properties.
- [crawlcove-hreflang-checker](https://github.com/CrawlCove/crawlcove-hreflang-checker) — check a page's or a sitemap's hreflang tags: codes, self-reference, x-default and return tags.
- [crawlcove-mcp](https://github.com/CrawlCove/crawlcove-mcp) — MCP server that gives Claude, Cursor and other AI assistants the crawl data: crawl a site, list issues, find broken links.
- [crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec) — the JSON Schema and CSV column reference this CLI's output follows.
- [crawlcove-redirect-chain-checker](https://github.com/CrawlCove/crawlcove-redirect-chain-checker) — follow every hop of a URL’s redirects; flags chains, loops, HTTPS downgrades and meta refreshes.
- [crawlcove-sitemap-validator](https://github.com/CrawlCove/crawlcove-sitemap-validator) — validate an XML sitemap or sitemap index against the protocol and search-engine limits.
- [crawlcove-robots-txt-tester](https://github.com/CrawlCove/crawlcove-robots-txt-tester) — lint a robots.txt and test which URLs each crawler may fetch, with the deciding line.

## License

MIT — see [LICENSE](LICENSE).
