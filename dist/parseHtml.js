import * as cheerio from 'cheerio';
/** Parse a page's HTML for the fields the CLI's checks need. Malformed HTML is tolerated (cheerio, like a browser, does best-effort parsing). */
export function parseHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const title = $('title').first().text().trim() || null;
    const metaDescription = $('meta[name="description" i]').first().attr('content')?.trim() || null;
    const h1Count = $('h1').length;
    const canonicalHref = $('link[rel="canonical" i]').first().attr('href');
    const canonical = canonicalHref ? resolveUrl(canonicalHref, baseUrl) : null;
    const robotsMeta = $('meta[name="robots" i]').first().attr('content')?.trim().toLowerCase() || null;
    const links = new Set();
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href)
            return;
        const resolved = resolveUrl(href, baseUrl);
        if (resolved)
            links.add(resolved);
    });
    return { title, metaDescription, h1Count, canonical, robotsMeta, links: [...links] };
}
function resolveUrl(href, baseUrl) {
    const trimmed = href.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return null;
    }
    try {
        const resolved = new URL(trimmed, baseUrl);
        resolved.hash = '';
        return resolved.toString();
    }
    catch {
        return null;
    }
}
