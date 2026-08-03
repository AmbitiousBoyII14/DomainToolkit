'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, Crown, ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, signOut, PLAN_CONFIGS, type Plan } from '@/lib/auth'

const PLAN_COLORS: Record<Plan, string> = { free: 'bg-muted text-muted-foreground border border-border', pro: 'bg-primary/10 text-primary border border-primary/20', business: 'bg-orange/10 text-orange border border-orange/20' }

export function UserMenu() {
  const { user, setUser, openAuthModal, openPricing } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])

  if (!user) {
    return (<div className="flex items-center gap-2"><button onClick={() => openAuthModal('signin')} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">Sign in</button><button onClick={() => openAuthModal('signup')} className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan to-accent text-white rounded-lg hover:shadow-[0_0_15px_rgba(0,198,255,0.2)] transition-all">Sign up</button></div>)
  }

  const cfg = PLAN_CONFIGS[user.plan]
  function handleSignOut() { signOut(); setUser(null); setOpen(false) }
  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors" aria-expanded={open} aria-haspopup="menu">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-accent flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-white">{initials || <User size={12} />}</span></div>
        <div className="hidden sm:block text-left"><p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">{user.name}</p><p className="text-[10px] text-muted-foreground leading-tight capitalize">{user.plan}</p></div>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>
      {open && (<div className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden"><div className="px-4 py-3 border-b border-border"><p className="text-sm font-semibold text-foreground truncate">{user.name}</p><p className="text-xs text-muted-foreground truncate">{user.email}</p><span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5', PLAN_COLORS[user.plan])}>{user.plan !== 'free' && <Crown size={10} />}{cfg.name} Plan</span></div>{user.plan !== 'business' && (<button onClick={() => { openPricing(); setOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-secondary transition-colors text-left"><Crown size={15} />{user.plan === 'free' ? 'Upgrade to Pro' : 'Upgrade to Business'}</button>)}<button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"><LogOut size={15} />Sign out</button></div>)}
    </div>
  )
}