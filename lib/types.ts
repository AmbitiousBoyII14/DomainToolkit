export interface ScanResult {
  id: string
  type: string
  target: string
  timestamp: number
  success: boolean
  fields: Record<string, string>
  rows?: Record<string, string>[]
  isFavorite?: boolean
}

export type ToolId =
  | 'home'
  | 'all-in-one'
  | 'domain-tools'
  | 'ssl'
  | 'websocket'
  | 'network-tools'
  | 'hosting'
  | 'security-headers'
  | 'history'
  | 'favorites'
  | 'pricing'
  | 'admin'

export interface NavItem {
  id: ToolId
  label: string
  icon: string
  description?: string
  hidden?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home',             label: 'Home',             icon: 'home',        description: 'Dashboard' },
  { id: 'all-in-one',       label: 'All-In-One Scan',  icon: 'scan',        description: 'Complete analysis' },
  { id: 'domain-tools',     label: 'Domain Tools',     icon: 'globe',       description: 'DNS, WHOIS, HTTP, Subdomains' },
  { id: 'ssl',              label: 'SSL / TLS',         icon: 'shield',      description: 'Certificate & TLS' },
  { id: 'websocket',        label: 'WebSocket',         icon: 'zap',         description: 'WS / WSS detect' },
  { id: 'network-tools',    label: 'Network Tools',     icon: 'network',     description: 'Ping, Port Scanner, Latency' },
  { id: 'hosting',          label: 'Hosting / CDN',     icon: 'server',      description: 'Provider & CDN detection' },
  { id: 'security-headers', label: 'Security Headers',  icon: 'lock',        description: 'CSP, HSTS, XSS & more' },
  { id: 'history',          label: 'History',           icon: 'history',     description: 'Past results' },
  { id: 'favorites',        label: 'Favorites',         icon: 'star',        description: 'Starred scans' },
  { id: 'pricing',          label: 'Upgrade',           icon: 'crown',       description: 'Plans & pricing' },
  { id: 'admin',            label: 'Admin',             icon: 'settings',    description: 'Admin panel', hidden: true },
]
