'use client'

import { Menu, Terminal } from 'lucide-react'
import { UserMenu } from './user-menu'

interface ToolbarProps { title: string; onMenuClick: () => void }

export function Toolbar({ title, onMenuClick }: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 h-14 px-4 bg-card/50 backdrop-blur-xl border-b border-border shrink-0">
      <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden text-foreground" aria-label="Open navigation menu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:flex items-center gap-2">
        <Terminal size={14} className="text-primary animate-pulse-glow" />
        <span className="text-[11px] font-mono text-muted-foreground tracking-wider uppercase">Domain Toolkit Pro</span>
      </div>
      <h1 className="font-semibold text-sm tracking-tight truncate flex-1 lg:text-center">{title}</h1>
      <UserMenu />
    </header>
  )
}