import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FixtureRoute {
  status?: number
  headers?: Record<string, string>
  body?: string
}

/** A tiny in-process HTTP server for crawler tests — no real network calls. */
export class FixtureServer {
  private server: Server
  private routes = new Map<string, FixtureRoute>()

  constructor(routes: Record<string, FixtureRoute>) {
    for (const [path, route] of Object.entries(routes)) this.routes.set(path, route)
    this.server = createServer((req, res) => {
      const route = this.routes.get(req.url ?? '/')
      if (!route) {
        res.writeHead(404, { 'content-type': 'text/html' })
        res.end('<html><body>not found</body></html>')
        return
      }
      res.writeHead(route.status ?? 200, {
        'content-type': 'text/html',
        ...route.headers
      })
      res.end(route.body ?? '')
    })
  }

  async listen(): Promise<string> {
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve))
    const { port } = this.server.address() as AddressInfo
    return `http://127.0.0.1:${port}`
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) =>
      this.server.close((err) => (err ? reject(err) : resolve()))
    )
  }
}
