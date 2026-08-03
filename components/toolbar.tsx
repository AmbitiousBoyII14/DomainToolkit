'use client'
import { Menu, Sun, Moon } from 'lucide-react'
import { UserMenu } from './user-menu'
import { ThemeToggle } from './theme-toggle'
interface ToolbarProps { title: string; onMenuClick: () => void }
export function Toolbar({ title, onMenuClick }: ToolbarProps) {
  return (<header className="flex items-center gap-3 h-14 px-4 bg-card border-b border-border shrink-0"><button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden"><Menu size={20} /></button><h1 className="font-semibold text-sm text-foreground truncate flex-1">{title}</h1><ThemeToggle />
      <UserMenu /></header>)
}