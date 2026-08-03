'use client'

import { cn } from '@/lib/utils'
import { Copy, Check, Search, Terminal } from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { suggestDomains, addDomainToHistory } from '@/lib/scan-history'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto px-4 py-6 pb-20">{children}</div>
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (<div className="mb-6"><h2 className="text-xl font-bold text-foreground">{title}</h2>{subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}</div>)
}

export function InputCard({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-5 mb-4">{children}</div>
}

interface DomainInputProps { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; onScanStart?: (domain: string) => void }
export function DomainInput({ value, onChange, placeholder = 'example.com', label = 'Domain', onScanStart }: DomainInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const s = suggestDomains(value); setSuggestions(s); setShowSuggestions(s.length > 0 && document.activeElement === inputRef.current) }, [value])
  useEffect(() => { const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setShowSuggestions(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])
  const selectSuggestion = (domain: string) => { onChange(domain); setShowSuggestions(false); inputRef.current?.focus() }
  return (
    <div className="relative">
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input ref={inputRef} type="text" value={value} onChange={e => { onChange(e.target.value); setShowSuggestions(true) }} onFocus={() => { const s = suggestDomains(value); setSuggestions(s); if (s.length > 0) setShowSuggestions(true) }} onKeyDown={e => { if (e.key === 'Enter' && onScanStart) { setShowSuggestions(false); addDomainToHistory(value); onScanStart(value) } }} placeholder={placeholder} className="w-full rounded-xl border border-input bg-secondary/50 px-10 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all font-mono" spellCheck={false} autoCapitalize="none" autoCorrect="off" />
        {value && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">↵ enter</span>}
      </div>
      {showSuggestions && suggestions.length > 0 && (<div ref={dropdownRef} className="absolute z-20 left-0 right-0 top-full mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">{suggestions.map((d, i) => (<button key={i} type="button" onClick={() => selectSuggestion(d)} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-b border-border/50 last:border-0 flex items-center gap-3"><Terminal size={13} className="text-primary/50" /><span className="font-mono">{d}</span></button>))}</div>)}
    </div>
  )
}

export function BulkDomainInput({ value, onChange, label = 'Domains (one per line)' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (<div><label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} placeholder="example.com
google.com
github.com" rows={5} className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all font-mono resize-none" spellCheck={false} autoCapitalize="none" autoCorrect="off" /></div>)
}

interface ToolSelectProps { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string }
export function ToolSelect({ value, onChange, options, label = 'Tool' }: ToolSelectProps) {
  return (<div><label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all">{options.map(o => <option key={o.value} value={o.value} className="bg-card">{o.label}</option>)}</select></div>)
}

interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { loading?: boolean; children: React.ReactNode }
export function PrimaryBtn({ loading, children, className, ...props }: PrimaryBtnProps) {
  return (<button {...props} disabled={loading || props.disabled} className={cn('w-full rounded-xl font-semibold text-sm py-3.5 transition-all duration-300 bg-gradient-to-r from-cyan to-accent text-white shadow-[0_0_30px_rgba(0,198,255,0.15)] hover:shadow-[0_0_50px_rgba(124,58,237,0.25)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none', className)}>{loading ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning...</span>) : children}</button>)
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (<div className="mb-4"><div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan to-accent rounded-full transition-all duration-500 ease-out" style={{ width: value + '%' }} /></div>{label && <p className="text-xs text-muted-foreground mt-2 font-mono">{label}</p>}</div>)
}

export function ResultsCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (<div className="glass rounded-2xl mb-4 overflow-hidden glow-cyan">{title && (<div className="flex items-center gap-3 px-5 py-4 border-b border-border"><span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan to-accent shrink-0" /><h3 className="font-semibold text-sm text-foreground">{title}</h3></div>)}<div className="divide-y divide-border/50">{children}</div></div>)
}

export function KvRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-start gap-4 px-5 py-3"><span className="text-[11px] text-muted-foreground min-w-[120px] shrink-0 pt-0.5 uppercase tracking-wider font-semibold">{label}</span><span className="text-sm text-foreground font-mono break-all flex-1">{value || '—'}</span></div>)
}

type PillVariant = 'success' | 'error' | 'warning' | 'primary' | 'muted'
export function Pill({ children, variant = 'primary' }: { children: React.ReactNode; variant?: PillVariant }) {
  const colors = { success: 'bg-success/10 text-success border border-success/20', error: 'bg-destructive/10 text-destructive border border-destructive/20', warning: 'bg-warning/10 text-warning border border-warning/20', primary: 'bg-primary/10 text-primary border border-primary/20', muted: 'bg-muted text-muted-foreground border border-border' }
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', colors[variant])}>{children}</span>
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }, [text])
  return (<button onClick={copy} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors px-5 py-3">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy results'}</button>)
}

export function ErrorState({ message }: { message: string }) {
  return (<div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 mb-4"><p className="text-sm text-destructive font-mono">{message}</p></div>)
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (<div className="flex flex-col items-center justify-center py-20 text-center px-4"><div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><Terminal size={24} className="text-muted-foreground" /></div><p className="font-semibold text-foreground mb-1.5">{title}</p><p className="text-sm text-muted-foreground max-w-xs">{description}</p></div>)
}