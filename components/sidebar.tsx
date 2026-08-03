'use client'

import { NAV_ITEMS, type ToolId } from '@/lib/types'
import {
  Home, ScanLine, Globe, ShieldCheck, Zap, Network, Server, Lock,
  History, Star, X, Crown, Settings, Terminal, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, PLAN_CONFIGS } from '@/lib/auth'

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home, scan: ScanLine, globe: Globe, shield: ShieldCheck,
  zap: Zap, network: Network, server: Server, lock: Lock,
  history: History, star: Star, crown: Crown, settings: Settings,
}

interface SidebarProps { activeId: ToolId; onNavigate: (id: ToolId) => void; isOpen: boolean; onClose: () => void }

export function Sidebar({ activeId, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border h-screen">
        <SidebarContent activeId={activeId} onNavigate={onNavigate} />
      </aside>
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out lg:hidden', isOpen ? 'translate-x-0' : '-translate-x-full')} aria-label="Navigation drawer">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border">
          <div className="flex items-center gap-2"><Terminal size={16} className="text-primary" /><span className="font-bold text-sm text-sidebar-foreground">Domain Toolkit Pro</span></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"><X size={18} /></button>
        </div>
        <SidebarContent activeId={activeId} onNavigate={onNavigate} />
      </aside>
    </>
  )
}

function SidebarContent({ activeId, onNavigate }: { activeId: ToolId; onNavigate: (id: ToolId) => void }) {
  const { user } = useAuth()
  const mainItems = NAV_ITEMS.filter(i => !i.hidden && i.id !== 'pricing')
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-4 border-b border-sidebar-border hidden lg:block">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,198,255,0.2)]">
            <Globe size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">Domain Toolkit</p>
            <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1"><Sparkles size={10} className="text-primary" />Pro</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5" aria-label="Main navigation">
        {mainItems.map(item => {
          const Icon = ICON_MAP[item.icon] ?? Globe
          const isActive = item.id === activeId
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-200 group',
                isActive ? 'bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(0,198,255,0.15)]' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40')}
              aria-current={isActive ? 'page' : undefined}>
              <Icon size={16} className={cn('transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground/80')} />
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,198,255,0.6)]" />}
            </button>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t border-sidebar-border space-y-1.5">
        {user ? (<>
          {user.plan !== 'business' ? (
            <button onClick={() => onNavigate('pricing')} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all', activeId === 'pricing' ? 'bg-gradient-to-r from-cyan to-accent text-white shadow-[0_0_20px_rgba(124,58,237,0.2)]' : 'bg-secondary text-primary hover:bg-secondary/80')}><Crown size={14} /><span>{user.plan === 'free' ? 'Upgrade to Pro' : 'Go Business'}</span></button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange/15 text-orange border border-orange/20">BUSINESS</span><span className="text-[11px] text-muted-foreground truncate">{user.name}</span></div>
          )}
        </>) : (
          <button onClick={() => onNavigate('pricing')} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all', activeId === 'pricing' ? 'bg-gradient-to-r from-cyan to-accent text-white' : 'bg-secondary text-primary hover:bg-secondary/80')}><Crown size={14} /><span>View Plans</span></button>
        )}
        <button onClick={() => onNavigate('admin')} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"><Settings size={11} />Admin</button>
      </div>
    </div>
  )
}