# crawlcove

A command line SEO crawler for scripts and CI — crawl a site headlessly and check status codes, redirect chains, titles, meta descriptions, H1s, canonicals, noindex and broken internal links, with a configurable non-zero exit code for pipelines.

## Install

```sh
npm install -g crawlcove
```

Or run it without installing:

```sh
npx crawlcove crawl https://example.com
```

## Usage

```sh
crawlcove <url> [options]

Options:
  -o, --output <format>   json or csv (default: json)
  --file <path>           write output to a file instead of stdout
  --max-pages <n>         stop after crawling this many pages (default: 100)
  --concurrency <n>       simultaneous requests (default: 4)
  --timeout <ms>          per-request timeout in milliseconds (default: 15000)
  --fail-on <checks>      comma-separated: broken-links, missing-titles, noindex, redirect-chains, or "none"
                          (default: all four)
  --threshold <n>         exit non-zero once the selected checks total this many issues (default: 1)
```

Example — fail a CI build only on broken links, tolerating everything else:

```sh
crawlcove https://staging.example.com --fail-on broken-links --threshold 1
```

## Output

JSON output is one object per crawled page (see
[crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec) for
the full field reference — this CLI's field names match it where it checks the
same thing). CSV output is the same data as RFC 4180 CSV.

## Limitations (v1)

- **robots.txt is not yet respected.** Point this at sites you're authorised
  to crawl, and prefer a low `--max-pages` / `--concurrency` on anything you
  don't control.
- Noindex detection reads only the `<meta name="robots">` tag, not the
  `X-Robots-Tag` response header.
- Follows same-origin links only — no scoping to a URL prefix yet.

## Works with CrawlCove

This CLI shares its checks and output shape with [Crawl Cove](https://crawlcove.com/?utm_source=github&utm_medium=crawlcove-cli), a desktop SEO crawler for Windows and Mac. Use this CLI for scripted, scheduled, or CI crawls; open the same site in the desktop app for the full visual report, historical tracking, and Search Console integration.

## Related tools

- [crawlcove-export-spec](https://github.com/CrawlCove/crawlcove-export-spec) — the JSON Schema and CSV column reference this CLI's output follows.

## License

MIT — see [LICENSE](LICENSE).
