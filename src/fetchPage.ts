const MAX_REDIRECT_HOPS = 20

export interface RawFetchResult {
  finalUrl: string
  statusCode: number | null
  redirectHops: number
  fetchError: string | null
  contentType: string | null
  body: string | null
}

/**
 * Fetch a URL, following redirects manually so the hop count is observable
 * (the fetch spec's automatic redirect following discards it). Stops and
 * reports an error after MAX_REDIRECT_HOPS rather than looping forever on a
 * redirect cycle.
 */
export async function fetchPage(
  url: string,
  opts: { userAgent: string; timeoutMs: number }
): Promise<RawFetchResult> {
  let currentUrl = url
  let hops = 0

  for (;;) {
    let res: Response
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
      try {
        res = await fetch(currentUrl, {
          redirect: 'manual',
          headers: { 'user-agent': opts.userAgent },
          signal: controller.signal
        })
      } finally {
        clearTimeout(timer)
      }
    } catch (err) {
      const message = err instanceof Error ? err.name : String(err)
      return {
        finalUrl: currentUrl,
        statusCode: null,
        redirectHops: hops,
        fetchError: message === 'AbortError' ? 'TIMEOUT' : message,
        contentType: null,
        body: null
      }
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      hops += 1
      if (hops > MAX_REDIRECT_HOPS) {
        return {
          finalUrl: currentUrl,
          statusCode: res.status,
          redirectHops: hops,
          fetchError: 'TOO_MANY_REDIRECTS',
          contentType: null,
          body: null
        }
      }
      currentUrl = new URL(res.headers.get('location') as string, currentUrl).toString()
      continue
    }

    const contentType = res.headers.get('content-type')
    const isHtml = contentType === null || /text\/html|application\/xhtml\+xml/i.test(contentType)
    const body = isHtml ? await res.text() : null
    return {
      finalUrl: currentUrl,
      statusCode: res.status,
      redirectHops: hops,
      fetchError: null,
      contentType,
      body
    }
  }
}
