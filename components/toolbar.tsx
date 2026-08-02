'use client'

import { Menu } from 'lucide-react'
import { UserMenu } from './user-menu'

interface ToolbarProps {
  title: string
  onMenuClick: () => void
}

export function Toolbar({ title, onMenuClick }: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 h-14 px-4 bg-primary text-primary-foreground shrink-0 shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <h1 className="font-bold text-base tracking-tight truncate flex-1">{title}</h1>
      <UserMenu />
    </header>
  )
}
