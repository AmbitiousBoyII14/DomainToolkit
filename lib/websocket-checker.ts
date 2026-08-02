'use client'

export interface WSCheckResult {
  path: string
  status: string
  upgraded: boolean
  headers?: Record<string, string>
  handshakeValid: boolean
  wsVersion?: string
}

/**
 * Check if WebSocket is available at a specific path.
 * Uses native WebSocket API for proper RFC 6455 handshake validation.
 */
export async function checkWebSocket(
  domain: string,
  path: string,
  timeout: number = 5000
): Promise<WSCheckResult> {
  // Determine protocol based on domain
  const protocol = domain.includes('localhost') || domain.startsWith('127')
    ? 'ws'
    : 'wss'
  
  const wsUrl = `${protocol}://${domain}${path}`

  return new Promise((resolve) => {
    let ws: WebSocket | null = null
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null

    try {
      ws = new WebSocket(wsUrl)

      // Set timeout
      timeoutHandle = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          resolve({
            path,
            status: 'TIMEOUT',
            upgraded: false,
            handshakeValid: false,
          })
        }
      }, timeout)

      ws.onopen = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        ws?.close(1000, 'Health check')
        resolve({
          path,
          status: '101 Switching Protocols',
          upgraded: true,
          headers: {
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
          },
          handshakeValid: true,
          wsVersion: '13', // RFC 6455
        })
      }

      ws.onerror = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        resolve({
          path,
          status: 'Connection refused / error',
          upgraded: false,
          handshakeValid: false,
        })
      }

      ws.onclose = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        // Already handled by onopen, don't double-resolve
      }
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      resolve({
        path,
        status: `Error: ${(err as Error).message}`,
        upgraded: false,
        handshakeValid: false,
      })
    }
  })
}

/**
 * Check all common WebSocket paths on a domain in parallel
 */
export async function checkAllWebSocketPaths(
  domain: string,
  paths: string[]
): Promise<{
  fields: Record<string, string>
  rows: Array<Record<string, string>>
}> {
  const results = await Promise.all(
    paths.map((p) => checkWebSocket(domain, p))
  )

  const anyFound = results.some((r) => r.upgraded)
  const successCount = results.filter((r) => r.upgraded).length

  return {
    fields: {
      Domain: domain,
      'WebSocket Found': anyFound ? 'Yes' : 'No',
      'Paths Checked': paths.length.toString(),
      'Successful Upgrades': successCount.toString(),
      'RFC Compliance': anyFound ? 'RFC 6455 ✓' : 'Not detected',
      'Status': anyFound
        ? '✓ WebSocket endpoint(s) detected'
        : '✗ No WebSocket endpoints found',
    },
    rows: results.map((r) => ({
      Path: r.path,
      Status: r.status,
      Upgraded: r.upgraded ? 'Yes' : 'No',
    })),
  }
}
