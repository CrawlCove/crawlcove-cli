export interface ParsedHtml {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    canonical: string | null;
    robotsMeta: string | null;
    /** Absolute URLs, deduped, resolved against baseUrl. */
    links: string[];
}
/** Parse a page's HTML for the fields the CLI's checks need. Malformed HTML is tolerated (cheerio, like a browser, does best-effort parsing). */
export declare function parseHtml(html: string, baseUrl: string): ParsedHtml;
