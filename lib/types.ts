export interface ScanResult { id: string; type: string; target: string; timestamp: number; success: boolean; fields: Record<string, string>; rows?: Record<string, string>[]; isFavorite?: boolean }

export type ToolId = 'home' | 'all-in-one' | 'domain-tools' | 'dns' | 'whois' | 'http' | 'subdomains' | 'ssl' | 'websocket' | 'network-tools' | 'ping' | 'port-scan' | 'http-response-time' | 'hosting' | 'security-headers' | 'geo' | 'email-verifier' | 'bulk-scan' | 'history' | 'favorites' | 'pricing' | 'admin'

export interface NavItem { id: ToolId; label: string; icon: string; description?: string; hidden?: boolean; premium?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: 'home' },
  { id: 'all-in-one', label: 'All-In-One Scan', icon: 'scan' },
  { id: 'domain-tools', label: 'Domain Tools', icon: 'globe' },
  { id: 'ssl', label: 'SSL / TLS', icon: 'shield' },
  { id: 'websocket', label: 'WebSocket', icon: 'zap' },
  { id: 'network-tools', label: 'Network Tools', icon: 'network' },
  { id: 'hosting', label: 'Hosting / CDN', icon: 'server' },
  { id: 'security-headers', label: 'Security Headers', icon: 'lock' },
  { id: 'geo', label: 'Geo / IP Lookup', icon: 'map-pin' },
  { id: 'email-verifier', label: 'Email Verifier', icon: 'mail' },
  { id: 'bulk-scan', label: 'Bulk Scan', icon: 'layers', premium: true },
  { id: 'history', label: 'Scan History', icon: 'history' },
  { id: 'favorites', label: 'Favorites', icon: 'star' },
  { id: 'pricing', label: 'Upgrade Plan', icon: 'crown' },
  { id: 'admin', label: 'Admin Panel', icon: 'settings', hidden: true },
]