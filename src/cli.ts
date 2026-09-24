#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { Command } from 'commander'
import { crawlSite, DEFAULT_CRAWL_OPTIONS } from './crawl.js'
import { summarizeChecks, shouldFail } from './checks.js'
import { toCsv, toJson } from './output.js'
import { ALL_FAIL_ON_CHECKS, type FailOnCheck } from './types.js'

const program = new Command()

program
  .name('crawlcove')
  .description('Headless SEO crawler for scripts and CI — crawl a site, check it, exit non-zero on regressions.')
  .argument('<url>', 'URL to start crawling from')
  .option('-o, --output <format>', 'json or csv', 'json')
  .option('--file <path>', 'write output to a file instead of stdout')
  .option('--max-pages <n>', 'stop after crawling this many pages', '100')
  .option('--concurrency <n>', 'simultaneous requests', '4')
  .option('--timeout <ms>', 'per-request timeout in milliseconds', '15000')
  .option(
    '--fail-on <checks>',
    `comma-separated: ${ALL_FAIL_ON_CHECKS.join(', ')}, or "none"`,
    ALL_FAIL_ON_CHECKS.join(',')
  )
  .option('--threshold <n>', 'exit non-zero once the selected checks total this many issues', '1')
  .action(async (url: string, opts) => {
    const failOn: FailOnCheck[] =
      opts.failOn === 'none'
        ? []
        : (opts.failOn.split(',').map((s: string) => s.trim()) as FailOnCheck[])
    for (const check of failOn) {
      if (!ALL_FAIL_ON_CHECKS.includes(check)) {
        console.error(`Unknown --fail-on check "${check}". Valid: ${ALL_FAIL_ON_CHECKS.join(', ')}`)
        process.exitCode = 2
        return
      }
    }

    const result = await crawlSite(url, {
      ...DEFAULT_CRAWL_OPTIONS,
      maxPages: Number(opts.maxPages),
      concurrency: Number(opts.concurrency),
      timeoutMs: Number(opts.timeout)
    })

    const text = opts.output === 'csv' ? toCsv(result) : toJson(result)
    if (opts.file) {
      writeFileSync(opts.file, text, 'utf8')
    } else {
      process.stdout.write(text)
    }

    const summary = summarizeChecks(result)
    console.error(
      `\ncrawlcove: ${result.pageCount} page(s) crawled${result.truncated ? ' (truncated at --max-pages)' : ''}. ` +
        `broken links: ${summary.brokenLinks}, missing titles: ${summary.missingTitles}, ` +
        `noindex: ${summary.noindex}, redirect chains: ${summary.redirectChains}.`
    )

    if (shouldFail(summary, failOn, Number(opts.threshold))) {
      process.exitCode = 1
    }
  })

program.parseAsync(process.argv)
