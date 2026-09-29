import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CRAWL_OPTIONS, DEFAULT_USER_AGENT } from '../src/index.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string
}

describe('default user agent', () => {
  it('keeps the crawlcove-cli product token, carries the package version and points at the site page', () => {
    expect(DEFAULT_USER_AGENT).toBe(
      `crawlcove-cli/${version} (+https://crawlcove.com/open-source/crawlcove-cli)`
    )
    // robots.txt parsers match on the token before the first "/", so a
    // `User-agent: crawlcove-cli` group must keep applying across releases.
    expect(DEFAULT_USER_AGENT.split('/')[0]).toBe('crawlcove-cli')
    expect(DEFAULT_CRAWL_OPTIONS.userAgent).toBe(DEFAULT_USER_AGENT)
  })
})
