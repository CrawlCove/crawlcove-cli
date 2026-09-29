#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';
import { crawlSite, DEFAULT_CRAWL_OPTIONS, SeedBlockedByRobotsError } from './crawl.js';
import { shouldFail } from './checks.js';
import { toCsv, toJson } from './output.js';
import { ALL_FAIL_ON_CHECKS } from './types.js';
const program = new Command();
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
program
    .name('crawlcove')
    .description('Headless SEO crawler for scripts and CI — crawl a site, check it, exit non-zero on regressions.')
    .version(version);
program
    .command('crawl', { isDefault: true })
    .description('Crawl a site from <url> and report every page (default command: `crawlcove <url>` works too)')
    .argument('<url>', 'URL to start crawling from')
    .option('-o, --output <format>', 'json or csv', 'json')
    .option('--file <path>', 'write output to a file instead of stdout')
    .option('--max-pages <n>', 'stop after crawling this many pages', '100')
    .option('--concurrency <n>', 'simultaneous requests', '4')
    .option('--timeout <ms>', 'per-request timeout in milliseconds', '15000')
    .option('--ignore-robots', 'crawl URLs that robots.txt disallows (only for sites you own or are authorised to crawl)', false)
    .option('--fail-on <checks>', `comma-separated: ${ALL_FAIL_ON_CHECKS.join(', ')}, or "none"`, ALL_FAIL_ON_CHECKS.join(','))
    .option('--threshold <n>', 'exit non-zero once the selected checks total this many issues', '1')
    .action(async (url, opts) => {
    const failOn = opts.failOn === 'none'
        ? []
        : opts.failOn.split(',').map((s) => s.trim());
    for (const check of failOn) {
        if (!ALL_FAIL_ON_CHECKS.includes(check)) {
            console.error(`Unknown --fail-on check "${check}". Valid: ${ALL_FAIL_ON_CHECKS.join(', ')}`);
            process.exitCode = 2;
            return;
        }
    }
    let result;
    try {
        result = await crawlSite(url, {
            ...DEFAULT_CRAWL_OPTIONS,
            maxPages: Number(opts.maxPages),
            concurrency: Number(opts.concurrency),
            timeoutMs: Number(opts.timeout),
            ignoreRobots: Boolean(opts.ignoreRobots)
        });
    }
    catch (err) {
        if (err instanceof SeedBlockedByRobotsError) {
            console.error(`crawlcove: ${err.message}. Nothing was fetched. ` +
                `If you own this site, re-run with --ignore-robots.`);
            process.exitCode = 2;
            return;
        }
        throw err;
    }
    const text = opts.output === 'csv' ? toCsv(result) : toJson(result);
    if (opts.file) {
        writeFileSync(opts.file, text, 'utf8');
    }
    else {
        process.stdout.write(text);
    }
    const summary = result.summary;
    const robotsNote = result.robotsIgnored
        ? ' robots.txt ignored (--ignore-robots).'
        : result.robotsBlocked.length > 0
            ? ` ${result.robotsBlocked.length} URL(s) skipped because robots.txt disallows them.`
            : '';
    console.error(`\ncrawlcove: ${result.pageCount} page(s) crawled${result.truncated ? ' (truncated at --max-pages)' : ''}. ` +
        `broken links: ${summary.brokenLinks}, missing titles: ${summary.missingTitles}, ` +
        `noindex: ${summary.noindex}, redirect chains: ${summary.redirectChains}.${robotsNote}`);
    if (shouldFail(summary, failOn, Number(opts.threshold))) {
        process.exitCode = 1;
    }
});
program.parseAsync(process.argv);
