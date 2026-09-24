import { describe, expect, it } from 'vitest'
import { parseHtml } from '../src/parseHtml.js'

describe('parseHtml', () => {
  it('extracts title, meta description, h1 count, canonical, and robots meta', () => {
    const html = `<html><head>
      <title>  Fresh Bread | Acme  </title>
      <meta name="Description" content="Baked fresh every day.">
      <link rel="Canonical" href="/bread">
      <meta name="robots" content="NOINDEX, follow">
    </head><body><h1>One</h1><h1>Two</h1></body></html>`
    const parsed = parseHtml(html, 'https://acme.test/bread/')
    expect(parsed.title).toBe('Fresh Bread | Acme')
    expect(parsed.metaDescription).toBe('Baked fresh every day.')
    expect(parsed.h1Count).toBe(2)
    expect(parsed.canonical).toBe('https://acme.test/bread')
    expect(parsed.robotsMeta).toBe('noindex, follow')
  })

  it('returns null for absent fields rather than throwing', () => {
    const parsed = parseHtml('<html><body>No head at all</body></html>', 'https://acme.test/')
    expect(parsed.title).toBeNull()
    expect(parsed.metaDescription).toBeNull()
    expect(parsed.canonical).toBeNull()
    expect(parsed.robotsMeta).toBeNull()
    expect(parsed.h1Count).toBe(0)
  })

  it('resolves relative links to absolute URLs, dedupes, and drops anchors/mailto/tel', () => {
    const html = `<html><body>
      <a href="/about">About</a>
      <a href="/about">About again</a>
      <a href="contact.html">Contact</a>
      <a href="#section">Jump</a>
      <a href="mailto:hi@acme.test">Email</a>
      <a href="tel:+441234567">Call</a>
      <a href="https://other.test/">Other site</a>
    </body></html>`
    const parsed = parseHtml(html, 'https://acme.test/menu/')
    expect(parsed.links.sort()).toEqual(
      ['https://acme.test/about', 'https://acme.test/menu/contact.html', 'https://other.test/'].sort()
    )
  })

  it('strips the hash fragment from resolved links', () => {
    const parsed = parseHtml('<a href="/page#section">x</a>', 'https://acme.test/')
    expect(parsed.links).toEqual(['https://acme.test/page'])
  })
})
