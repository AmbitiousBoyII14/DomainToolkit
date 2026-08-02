'use client'

import { type ToolId } from '@/lib/types'
import {
  Globe, ShieldCheck, Zap, Network, Server, Lock,
  ScanLine, History, Star, ArrowRight, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, PLAN_CONFIGS, getScanCount } from '@/lib/auth'

interface HomeViewProps {
  onNavigate: (id: ToolId) => void
}

interface CardDef {
  id: ToolId
  title: string
  desc: string
  icon: React.ElementType
  gradient: string
}

const CARDS: CardDef[] = [
  { id: 'all-in-one',       title: 'All-In-One Scan',  desc: 'Complete analysis in one pass', icon: ScanLine,   gradient: 'from-violet-500 to-indigo-600' },
  { id: 'domain-tools',     title: 'Domain Tools',     desc: 'DNS, WHOIS, HTTP & Subdomains', icon: Globe,      gradient: 'from-blue-500 to-cyan-500' },
  { id: 'ssl',              title: 'SSL / TLS',         desc: 'Certificate & TLS details',     icon: ShieldCheck,gradient: 'from-emerald-500 to-teal-600' },
  { id: 'websocket',        title: 'WebSocket',         desc: 'WS / WSS path detection',       icon: Zap,        gradient: 'from-amber-500 to-orange-500' },
  { id: 'network-tools',    title: 'Network Tools',     desc: 'Ping, ports & latency',         icon: Network,    gradient: 'from-blue-600 to-indigo-500' },
  { id: 'hosting',          title: 'Hosting / CDN',     desc: 'Detect provider & CDN',         icon: Server,     gradient: 'from-rose-500 to-pink-600' },
  { id: 'security-headers', title: 'Security Headers',  desc: 'CSP, HSTS, XSS & more',        icon: Lock,       gradient: 'from-slate-600 to-slate-800' },
  { id: 'history',          title: 'History',           desc: 'Past scan results',             icon: History,    gradient: 'from-teal-500 to-cyan-600' },
  { id: 'favorites',        title: 'Favorites',         desc: 'Starred scans',                 icon: Star,       gradient: 'from-yellow-500 to-amber-600' },
]

export function HomeView({ onNavigate }: HomeViewProps) {
  const { user, openAuthModal, openPricing } = useAuth()
  const plan = user?.plan ?? 'free'
  const cfg = PLAN_CONFIGS[plan]
  const scansToday = getScanCount()
  const scansLeft = cfg.dailyScans === -1 ? null : cfg.dailyScans - scansToday

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground text-balance">Domain Toolkit Pro</h2>
          <p className="text-sm text-muted-foreground mt-1">Professional network &amp; domain analysis</p>
        </div>
        {user ? (
          <div className="shrink-0 text-right">
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
              plan === 'business' ? 'bg-amber-500/15 text-amber-600' :
              plan === 'pro'      ? 'bg-primary/15 text-primary' :
              'bg-muted text-muted-foreground'
            )}>
              {plan !== 'free' && <Crown size={11} />}
              {cfg.name}
            </span>
            {scansLeft !== null && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {scansLeft} scan{scansLeft !== 1 ? 's' : ''} left today
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('signup')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Sign up free
          </button>
        )}
      </div>

      {/* Upgrade nudge for free users */}
      {user && plan === 'free' && (
        <button
          onClick={openPricing}
          className="w-full mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-left flex items-center justify-between gap-3 hover:bg-primary/10 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-primary">Unlock all 8 tools</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Pro for 100 scans/day, full history &amp; exports</p>
          </div>
          <Crown size={18} className="text-primary shrink-0" />
        </button>
      )}

      {/* Quick-access hero card */}
      <button
        onClick={() => onNavigate('all-in-one')}
        className="w-full mb-5 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-5 text-left text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ScanLine size={20} className="text-white/80" />
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Recommended</span>
            </div>
            <p className="font-bold text-lg leading-tight text-balance">All-In-One Scan</p>
            <p className="text-sm text-white/70 mt-0.5">Run every check in a single pass</p>
          </div>
          <ArrowRight size={20} className="text-white/60 shrink-0" />
        </div>
      </button>

      {/* Tool grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.filter(c => c.id !== 'all-in-one').map(card => (
          <ToolCard key={card.id} card={card} onClick={() => onNavigate(card.id)} />
        ))}
      </div>
    </div>
  )
}

function ToolCard({ card, onClick }: { card: CardDef; onClick: () => void }) {
  const Icon = card.icon
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-4 h-28 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all"
      style={{}}
    >
      <div className={cn('flex flex-col items-center gap-2 w-full h-full justify-center rounded-xl bg-gradient-to-br', card.gradient, 'px-3 py-3')}>
        <Icon size={24} className="text-white/90 shrink-0" aria-hidden="true" />
        <p className="font-bold text-xs text-white text-center leading-tight text-balance">{card.title}</p>
        <p className="text-[10px] text-white/70 text-center leading-tight hidden sm:block">{card.desc}</p>
      </div>
    </button>
  )
}
