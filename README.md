# DomainToolkit Pro

Professional network & domain analysis tool — DNS, WHOIS, SSL/TLS, WebSocket, Security Headers, Hosting/CDN detection and more.

## Features

- **All-In-One Scan** — Run every check in a single pass
- **Domain Tools** — DNS (A/AAAA/MX/NS/TXT/CNAME), WHOIS, HTTP status, subdomain enumeration
- **SSL / TLS** — Certificate chain, expiry, TLS version, cipher, SANs, trust status
- **WebSocket** — WS/WSS endpoint detection & path scanning
- **Network Tools** — Ping, port scanning, latency measurement
- **Hosting / CDN** — Detects hosting provider & CDN
- **Security Headers** — CSP, HSTS, X-Frame-Options, XSS Protection, and more
- **History & Favorites** — Track and bookmark your scans

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Lucide icons
- **Payments**: PayPal
- **Deployment**: Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

- `POST /api/scan` — Run domain/network analysis tools
- `POST /api/users` — User management
- `PUT /api/users` — Update user plan
- `POST /api/auth/forgot-password` — Password reset request
- `POST /api/auth/reset-password` — Password reset

## License

MIT
