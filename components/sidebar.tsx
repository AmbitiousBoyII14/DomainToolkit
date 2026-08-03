'use client'
import { NAV_ITEMS, type ToolId } from '@/lib/types'
import { Home, ScanLine, Globe, ShieldCheck, Zap, Network, Server, Lock, History, Star, X, Crown, Settings, MapPin, Mail, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, PLAN_CONFIGS } from '@/lib/auth'

const ICONS: Record<string, React.ElementType> = { home: Home, scan: ScanLine, globe: Globe, shield: ShieldCheck, zap: Zap, network: Network, server: Server, lock: Lock, 'map-pin': MapPin, mail: Mail, history: History, star: Star, crown: Crown, settings: Settings, layers: Layers }

interface SidebarProps { activeId: ToolId; onNavigate: (id: ToolId) => void; isOpen: boolean; onClose: () => void }

export function Sidebar({ activeId, onNavigate, isOpen, onClose }: SidebarProps) {
  return (<>
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-screen"><SidebarContent activeId={activeId} onNavigate={onNavigate} /></aside>
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:hidden', isOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border"><span className="font-bold text-sm text-sidebar-fg">Domain Toolkit Pro</span><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-fg"><X size={18} /></button></div>
      <SidebarContent activeId={activeId} onNavigate={onNavigate} />
    </aside>
  </>)
}

function SidebarContent({ activeId, onNavigate }: { activeId: ToolId; onNavigate: (id: ToolId) => void }) {
  const { user } = useAuth()
  const mainItems = NAV_ITEMS.filter(i => !i.hidden && i.id !== 'pricing')
  const toolIds = ['all-in-one','domain-tools','ssl','websocket','network-tools','hosting','security-headers','geo','email-verifier','bulk-scan']
  const recordIds = ['history','favorites']
  return (<div className="flex flex-col h-full">
    <div className="px-5 py-5 border-b border-sidebar-border hidden lg:block">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0"><Globe size={17} className="text-primary-foreground" /></div><div><p className="font-bold text-sm text-sidebar-fg">Domain Toolkit</p><p className="text-[11px] text-muted-foreground">Professional</p></div></div>
    </div>
    <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
      <div className="px-3 py-1"><p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Tools</p></div>
      {mainItems.filter(i => toolIds.includes(i.id)).map(item => { const Icon = ICONS[item.icon] ?? Globe; const isActive = item.id === activeId
        return (<button key={item.id} onClick={() => onNavigate(item.id)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] transition-all duration-150', isActive ? 'bg-sidebar-accent text-sidebar-accent-fg font-semibold shadow-sm' : 'text-sidebar-fg/70 hover:text-sidebar-fg hover:bg-sidebar-accent/50')}><Icon size={17} className={isActive ? 'text-sidebar-accent-fg' : 'text-muted-foreground'} /><span className="truncate">{item.label}</span>{item.premium && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 uppercase">PRO</span>}</button>)
      })}
      <div className="px-3 py-1 mt-2"><p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Records</p></div>
      {mainItems.filter(i => recordIds.includes(i.id)).map(item => { const Icon = ICONS[item.icon] ?? History; const isActive = item.id === activeId
        return (<button key={item.id} onClick={() => onNavigate(item.id)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] transition-all duration-150', isActive ? 'bg-sidebar-accent text-sidebar-accent-fg font-semibold shadow-sm' : 'text-sidebar-fg/70 hover:text-sidebar-fg hover:bg-sidebar-accent/50')}><Icon size={17} className={isActive ? 'text-sidebar-accent-fg' : 'text-muted-foreground'} /><span className="truncate">{item.label}</span></button>)
      })}
    </nav>
    <div className="px-3 py-3 border-t border-sidebar-border space-y-1.5">
      {user ? (user.plan === 'free' ? <button onClick={() => onNavigate('pricing')} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all', activeId === 'pricing' ? 'btn-primary' : 'bg-accent text-accent-foreground hover:bg-accent/80')}><Crown size={14} /><span>Upgrade to Pro</span></button> : <div className="flex items-center gap-2 px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', user.plan === 'business' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-accent text-accent-foreground')}>{user.plan.toUpperCase()}</span><span className="text-xs text-muted-foreground truncate">{user.name}</span></div>) : <button onClick={() => onNavigate('pricing')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/80"><Crown size={14} /><span>View Plans</span></button>}
      <button onClick={() => onNavigate('admin')} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"><Settings size={11} />Admin</button>
    </div>
  </div>)
}