import type { CrawlResult } from './types.js'

/** Serialize a crawl result to pretty-printed JSON (2-space indent, trailing newline). */
export function toJson(result: CrawlResult): string {
  return `${JSON.stringify(result, null, 2)}\n`
}

const CSV_HEADERS = [
  'URL',
  'Final URL',
  'Status',
  'Redirect hops',
  'Fetch error',
  'Title',
  'Title length',
  'Meta description',
  'Meta length',
  'H1 count',
  'Canonical',
  'Robots meta',
  'Indexable',
  'Broken internal links'
] as const

const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

function csvCell(value: string | number | boolean | null): string {
  if (value === null) return ''
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') return String(value)
  const s = FORMULA_PREFIX_RE.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize a crawl result to RFC-4180 CSV (CRLF line endings, no trailing newline). */
export function toCsv(result: CrawlResult): string {
  const lines = [CSV_HEADERS.map(csvCell).join(',')]
  for (const p of result.pages) {
    lines.push(
      [
        p.url,
        p.finalUrl,
        p.statusCode,
        p.redirectHops,
        p.fetchError,
        p.title,
        p.titleLength,
        p.metaDescription,
        p.metaLength,
        p.h1Count,
        p.canonical,
        p.robotsMeta,
        p.indexable,
        p.brokenInternalLinks.join('; ') || null
      ]
        .map(csvCell)
        .join(',')
    )
  }
  return lines.join('\r\n')
}
