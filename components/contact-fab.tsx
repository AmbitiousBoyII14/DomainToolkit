'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>)
}

export function ContactFAB() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])
  return (<div ref={ref} className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">{open && (<div className="flex flex-col items-end gap-2 mb-1"><a href="https://t.me/Treacky_1" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-2xl bg-[#229ED9] text-white text-sm font-semibold shadow-lg hover:bg-[#1a8fbf] transition-colors" onClick={() => setOpen(false)}><TelegramIcon size={17} />Message on Telegram</a><a href="mailto:?subject=Domain Toolkit Pro Support&body=Hi, I need help with Domain Toolkit Pro." className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-2xl bg-white border border-border text-foreground text-sm font-semibold shadow-lg hover:bg-muted transition-colors" onClick={() => setOpen(false)}><Mail size={16} className="text-red-500" />Send via Gmail</a></div>)}<button onClick={() => setOpen(o => !o)} className={cn('w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95', open ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground hover:bg-primary/90')} aria-label={open ? 'Close contact menu' : 'Contact support'} style={{ width: 52, height: 52 }}>{open ? <X size={20} /> : <MessageCircle size={22} />}</button></div>)
}