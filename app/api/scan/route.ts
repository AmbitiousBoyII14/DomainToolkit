import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns/promises'
import https from 'https'
import http from 'http'
import tls from 'tls'

export const maxDuration = 30

function sanitizeHost(raw: string): string {
  return raw.replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '').split('/')[0].split(':')[0].trim().toLowerCase()
}

function isValidHost(host: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(host) || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)
}

async function httpFetch(url: string, timeoutMs = 8000): Promise<{ status: number; headers: Record<string, string>; finalUrl: string; redirectCount: number }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      const headers: Record<string, string> = {}
      for (const [k, v] of Object.entries(res.headers)) { if (typeof v === 'string') headers[k] = v; else if (Array.isArray(v)) headers[k] = v.join(', ') }
      resolve({ status: res.statusCode ?? 0, headers, finalUrl: url, redirectCount: 0 })
      res.resume()
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

async function checkWebSocketUpgrade(hostname: string, path: string, timeoutMs = 5000): Promise<{ status: string; upgraded: boolean }> {
  return new Promise((resolve) => {
    const req = https.request({ hostname, port: 443, path, method: 'GET', headers: { 'Upgrade': 'websocket', 'Connection': 'Upgrade', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==' }, timeout: timeoutMs, rejectUnauthorized: false }, (res) => {
      const upgraded = res.statusCode === 101 && (res.headers['upgrade'] || '').toLowerCase() === 'websocket'
      resolve({ status: String(res.statusCode ?? 0), upgraded })
      res.resume()
    })
    req.on('error', () => resolve({ status: 'Error', upgraded: false }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'Timeout', upgraded: false }) })
    req.end()
  })
}

async function sslCheck(host: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 8000 }, () => {
      const cert = socket.getPeerCertificate(true)
      const proto = socket.getProtocol() ?? 'unknown'
      socket.destroy()
      if (!cert || !cert.subject) { resolve({ Error: 'No certificate returned' }); return }
      const now = Date.now()
      const validFrom = cert.valid_from ? new Date(cert.valid_from).getTime() : 0
      const validTo   = cert.valid_to   ? new Date(cert.valid_to).getTime()   : 0
      const daysLeft  = Math.ceil((validTo - now) / 86400000)
      const trusted   = socket.authorized ? 'Yes' : 'No'
      resolve({ Trusted: trusted, Subject: cert.subject?.CN ?? '', Issuer: cert.issuer?.CN ?? cert.issuer?.O ?? '', 'Serial Number': cert.serialNumber ?? '', 'Valid From': cert.valid_from ?? '', 'Expires': cert.valid_to ?? '', 'Days Remaining': daysLeft > 0 ? String(daysLeft) : 'Expired', 'TLS Version': proto, 'Cipher': (socket.getCipher() as any)?.name ?? '', 'HSTS': 'Check HTTP headers', 'Subject Alt Names': (cert.subjectaltname ?? '').replace(/DNS:/g, '').trim() })
    })
    socket.on('error', reject)
    socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS timeout')) })
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { tool, host: rawHost } = body as { tool: string; host: string }
  const host = sanitizeHost(rawHost ?? '')
  if (!host || !isValidHost(host)) { return NextResponse.json({ error: 'Invalid host' }, { status: 400 }) }
  try {
    switch (tool) {
      case 'dns': {
        const [a, aaaa, mx, ns, txt, cname] = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host), dns.resolveMx(host), dns.resolveNs(host), dns.resolveTxt(host), dns.resolveCname(host)])
        const fields: Record<string, string> = { Domain: host }
        if (a.status === 'fulfilled') fields['A Records'] = a.value.join(', ')
        if (aaaa.status === 'fulfilled') fields['AAAA Records'] = aaaa.value.join(', ')
        if (mx.status === 'fulfilled') fields['MX Records'] = mx.value.map(r => `${r.exchange} (${r.priority})`).join(', ')
        if (ns.status === 'fulfilled') fields['NS Records'] = ns.value.join(', ')
        if (txt.status === 'fulfilled') fields['TXT Records'] = txt.value.map(r => r.join('')).join(' | ')
        if (cname.status === 'fulfilled') fields['CNAME'] = cname.value.join(', ')
        return NextResponse.json({ success: true, type: 'DNS Lookup', fields })
      }
      case 'domain-overview': {
        const [aRes, nsRes, mxRes] = await Promise.allSettled([dns.resolve4(host), dns.resolveNs(host), dns.resolveMx(host)])
        let httpData: { status: number; headers: Record<string, string>; finalUrl: string } | null = null
        try { httpData = await httpFetch(`https://${host}`) } catch { try { httpData = await httpFetch(`http://${host}`) } catch { /* ignore */ } }
        const fields: Record<string, string> = { Domain: host }
        if (aRes.status === 'fulfilled') fields['IP Address'] = aRes.value[0] ?? ''
        if (nsRes.status === 'fulfilled') fields['Nameservers'] = nsRes.value.join(', ')
        if (mxRes.status === 'fulfilled') fields['MX Records'] = mxRes.value.map(r => r.exchange).join(', ')
        if (httpData) { fields['HTTP Status'] = String(httpData.status); fields['Server'] = httpData.headers['server'] ?? 'unknown'; fields['Content-Type'] = httpData.headers['content-type'] ?? 'unknown'; fields['HTTPS'] = httpData.finalUrl.startsWith('https') ? 'Yes' : 'No' }
        return NextResponse.json({ success: true, type: 'Domain Overview', fields })
      }
      case 'http': {
        let httpData: { status: number; headers: Record<string, string>; finalUrl: string } | null = null
        let protocol = 'https'
        try { httpData = await httpFetch(`https://${host}`) } catch { try { httpData = await httpFetch(`http://${host}`); protocol = 'http' } catch { /* ignore */ } }
        if (!httpData) return NextResponse.json({ error: 'Could not reach host' }, { status: 502 })
        const fields: Record<string, string> = { Domain: host, 'HTTP Status': String(httpData.status), Protocol: protocol.toUpperCase(), Server: httpData.headers['server'] ?? 'Not set', 'Content-Type': httpData.headers['content-type'] ?? 'Not set', 'X-Powered-By': httpData.headers['x-powered-by'] ?? 'Not set', 'Cache-Control': httpData.headers['cache-control'] ?? 'Not set', 'Content-Encoding': httpData.headers['content-encoding'] ?? 'Not set', 'Transfer-Encoding': httpData.headers['transfer-encoding'] ?? 'Not set', 'Set-Cookie': httpData.headers['set-cookie'] ?? 'Not set' }
        return NextResponse.json({ success: true, type: 'HTTP Inspect', fields })
      }
      case 'whois': {
        let whoisData: Record<string, string> = { Domain: host, Note: 'WHOIS lookup via public API' }
        try {
          const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${host}`, { signal: AbortSignal.timeout(8000) })
          if (res.ok) {
            const data = await res.json() as Record<string, any>
            whoisData['Registrar'] = data?.entities?.[0]?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] ?? 'N/A'
            whoisData['Status'] = Array.isArray(data?.status) ? data.status.join(', ') : 'N/A'
            const events: Record<string, string> = {}
            if (Array.isArray(data?.events)) { for (const e of data.events) { if (e.eventAction === 'registration') events['Registered'] = e.eventDate ?? ''; if (e.eventAction === 'expiration') events['Expires'] = e.eventDate ?? ''; if (e.eventAction === 'last changed') events['Updated'] = e.eventDate ?? '' } }
            Object.assign(whoisData, events)
            if (Array.isArray(data?.nameservers)) { whoisData['Nameservers'] = data.nameservers.map((n: any) => n.ldhName).join(', ') }
          }
        } catch { /* use fallback */ }
        return NextResponse.json({ success: true, type: 'WHOIS Lookup', fields: whoisData })
      }
      case 'subdomains': {
        const common = ['www', 'mail', 'ftp', 'api', 'app', 'dev', 'staging', 'blog', 'shop', 'cdn', 'admin', 'portal', 'secure', 'vpn', 'remote', 'support', 'help', 'docs', 'status', 'assets']
        const found: string[] = []
        const results = await Promise.allSettled(common.map(sub => dns.resolve4(`${sub}.${host}`).then(() => `${sub}.${host}`)))
        for (const r of results) { if (r.status === 'fulfilled') found.push(r.value) }
        const fields: Record<string, string> = { Domain: host, 'Subdomains Found': String(found.length), 'Scanned Prefixes': String(common.length), ...(found.length ? { 'Found': found.join(', ') } : { Note: 'No common subdomains resolved' }) }
        return NextResponse.json({ success: true, type: 'Subdomain Finder', fields })
      }
      case 'ssl': {
        const certFields = await sslCheck(host)
        return NextResponse.json({ success: true, type: 'SSL / TLS Check', fields: { Domain: host, ...certFields } })
      }
      case 'websocket': {
        const paths = ['/', '/ws', '/socket', '/socket.io', '/websocket', '/live', '/api/ws', '/chat']
        const rows: { Path: string; Status: string; Upgraded: string }[] = []
        let detected = false
        for (const path of paths) {
          const result = await checkWebSocketUpgrade(host, path, 5000)
          if (result.upgraded) detected = true
          rows.push({ Path: path, Status: result.status, Upgraded: result.upgraded ? 'Yes' : 'No' })
        }
        const fields: Record<string, string> = { Domain: host, 'WebSocket Found': detected ? 'Yes' : 'No', 'Paths Checked': String(paths.length), 'Paths with WS': String(rows.filter(r => r.Upgraded === 'Yes').length) }
        return NextResponse.json({ success: true, type: 'WebSocket Scan', fields, rows })
      }
      case 'ping': {
        const start = Date.now()
        let reachable = false; let latency = 0; let statusCode = 0
        try { const res = await httpFetch(`https://${host}`, 6000); latency = Date.now() - start; reachable = true; statusCode = res.status } catch { try { const res2 = await httpFetch(`http://${host}`, 6000); latency = Date.now() - start; reachable = true; statusCode = res2.status } catch { /* unreachable */ } }
        return NextResponse.json({ success: true, type: 'Ping / Reachability', fields: { Host: host, Reachable: reachable ? 'Yes' : 'No', 'Response Time': reachable ? `${latency} ms` : 'N/A', 'HTTP Status': reachable ? String(statusCode) : 'N/A' } })
      }
      case 'port-scan': {
        const COMMON_PORTS: [number, string][] = [[21, 'FTP'], [22, 'SSH'], [25, 'SMTP'], [80, 'HTTP'], [110, 'POP3'], [143, 'IMAP'], [443, 'HTTPS'], [465, 'SMTPS'], [587, 'SMTP/TLS'], [993, 'IMAPS'], [995, 'POP3S'], [3306, 'MySQL'], [5432, 'PostgreSQL'], [6379, 'Redis'], [8080, 'HTTP-Alt'], [8443, 'HTTPS-Alt']]
        const rows: { Port: string; Service: string; Status: string }[] = []
        await Promise.allSettled(COMMON_PORTS.map(([port, service]) => new Promise<void>((resolve) => { const net = require('net') as typeof import('net'); const sock = new net.Socket(); sock.setTimeout(1500); sock.on('connect', () => { rows.push({ Port: String(port), Service: service, Status: 'open' }); sock.destroy(); resolve() }); sock.on('timeout', () => { rows.push({ Port: String(port), Service: service, Status: 'closed' }); sock.destroy(); resolve() }); sock.on('error', () => { rows.push({ Port: String(port), Service: service, Status: 'closed' }); sock.destroy(); resolve() }); sock.connect(port, host) })))
        rows.sort((a, b) => Number(a.Port) - Number(b.Port))
        const open = rows.filter(r => r.Status === 'open')
        return NextResponse.json({ success: true, type: 'Port Scanner', fields: { Host: host, 'Open Ports': String(open.length), 'Ports Scanned': String(COMMON_PORTS.length) }, rows })
      }
      case 'http-response-time': {
        const times: number[] = []
        for (let i = 0; i < 3; i++) { const t = Date.now(); try { await httpFetch(`https://${host}`, 6000); times.push(Date.now() - t) } catch { /* ignore */ } }
        const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
        return NextResponse.json({ success: true, type: 'HTTP Response Time', fields: { Host: host, 'Avg Response': avg !== null ? `${avg} ms` : 'Unreachable', 'Samples': String(times.length), 'Min': times.length ? `${Math.min(...times)} ms` : 'N/A', 'Max': times.length ? `${Math.max(...times)} ms` : 'N/A' } })
      }
      case 'hosting': {
        let httpData: { status: number; headers: Record<string, string> } | null = null
        try { httpData = await httpFetch(`https://${host}`) } catch { /* ignore */ }
        const headers = httpData?.headers ?? {}
        const serverHeader = (headers['server'] ?? '').toLowerCase()
        const cfRay = headers['cf-ray']; const xVercel = headers['x-vercel-id']; const xNetlify = headers['x-nf-request-id']; const xAmzHeader = headers['x-amz-cf-id'] ?? headers['x-amz-id-2']
        let provider = 'Unknown'; let cdn = 'None detected'
        if (cfRay) { provider = 'Cloudflare'; cdn = 'Cloudflare' }
        else if (xVercel) { provider = 'Vercel'; cdn = 'Vercel Edge Network' }
        else if (xNetlify) { provider = 'Netlify'; cdn = 'Netlify CDN' }
        else if (xAmzHeader || serverHeader.includes('amazons3')) { provider = 'AWS'; cdn = 'CloudFront / S3' }
        else if (serverHeader.includes('cloudfront')) { provider = 'AWS'; cdn = 'CloudFront' }
        else if ((headers['via'] ?? '').toLowerCase().includes('akamai')) { provider = 'Akamai'; cdn = 'Akamai' }
        else if (serverHeader.includes('azure')) { provider = 'Azure'; cdn = 'Azure CDN' }
        else if (serverHeader.includes('gws') || serverHeader.includes('google')) { provider = 'Google Cloud'; cdn = 'GCP / Firebase' }
        else if (serverHeader) { provider = serverHeader }
        const fields: Record<string, string> = { Domain: host, 'HTTP Status': httpData ? String(httpData.status) : 'N/A', Provider: provider, CDN: cdn, 'Server Header': headers['server'] ?? 'Not set', 'X-Powered-By': headers['x-powered-by'] ?? 'Not set', 'Via': headers['via'] ?? 'Not set' }
        return NextResponse.json({ success: true, type: 'Hosting / CDN Detection', fields })
      }
      case 'security-headers': {
        let httpData: { headers: Record<string, string> } | null = null
        try { httpData = await httpFetch(`https://${host}`) } catch { /* ignore */ }
        const h = httpData?.headers ?? {}
        const CHECKED_HEADERS: [string, string][] = [['Content-Security-Policy', 'content-security-policy'], ['Strict-Transport-Security', 'strict-transport-security'], ['X-Frame-Options', 'x-frame-options'], ['X-Content-Type-Options', 'x-content-type-options'], ['X-XSS-Protection', 'x-xss-protection'], ['Referrer-Policy', 'referrer-policy'], ['Permissions-Policy', 'permissions-policy'], ['Cross-Origin-Opener-Policy', 'cross-origin-opener-policy'], ['Cross-Origin-Resource-Policy', 'cross-origin-resource-policy'], ['Cross-Origin-Embedder-Policy', 'cross-origin-embedder-policy']]
        const fields: Record<string, string> = { Domain: host }
        let score = 0
        for (const [label, key] of CHECKED_HEADERS) { const val = h[key]; fields[label] = val ?? 'Missing'; if (val) score += 10 }
        fields['Score'] = String(score)
        return NextResponse.json({ success: true, type: 'Security Headers', fields })
      }
      case 'all-in-one': {
        const allFields: Record<string, string> = { Domain: host }
        try { const [a, ns, mx] = await Promise.allSettled([dns.resolve4(host), dns.resolveNs(host), dns.resolveMx(host)]); if (a.status === 'fulfilled') allFields['IP Address'] = a.value[0] ?? ''; if (ns.status === 'fulfilled') allFields['Nameservers'] = ns.value.join(', '); if (mx.status === 'fulfilled') allFields['MX Records'] = mx.value.map(r => r.exchange).join(', ') } catch { /* ignore */ }
        let httpData: { status: number; headers: Record<string, string> } | null = null
        try { httpData = await httpFetch(`https://${host}`); allFields['HTTP Status'] = String(httpData.status); allFields['Server'] = httpData.headers['server'] ?? 'unknown'; allFields['HTTPS'] = 'Yes' } catch { /* ignore */ }
        try { const certFields = await sslCheck(host); Object.assign(allFields, certFields) } catch { /* ignore */ }
        if (httpData) { const h = httpData.headers; allFields['CSP'] = h['content-security-policy'] ? 'Present' : 'Missing'; allFields['HSTS'] = h['strict-transport-security'] ? 'Present' : 'Missing'; allFields['X-Frame-Options'] = h['x-frame-options'] ? 'Present' : 'Missing'; allFields['X-Content-Type-Options'] = h['x-content-type-options'] ? 'Present' : 'Missing'; allFields['Referrer-Policy'] = h['referrer-policy'] ? 'Present' : 'Missing' }
        if (httpData) { const sh = (httpData.headers['server'] ?? '').toLowerCase(); allFields['Provider'] = httpData.headers['cf-ray'] ? 'Cloudflare' : httpData.headers['x-vercel-id'] ? 'Vercel' : httpData.headers['x-nf-request-id'] ? 'Netlify' : sh || 'Unknown' }
        return NextResponse.json({ success: true, type: 'All-In-One Scan', fields: allFields })
      }
      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message ?? 'Scan failed' }, { status: 500 })
  }
}