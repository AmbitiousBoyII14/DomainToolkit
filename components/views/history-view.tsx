'use client'
import { useState, useEffect, useCallback } from 'react'
import { ScanResult } from '@/lib/types'
import { getHistory, deleteResult, toggleFavorite, clearHistory } from '@/lib/history'
import { PageWrapper, Pill, EmptyState } from '../scan-ui'
import { Star, Trash2, Search, Globe } from 'lucide-react'

export function HistoryView() {
  const [history, setHistory] = useState<ScanResult[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const reload = useCallback(() => { let all = getHistory(); const q = query.toLowerCase(); if (q) all = all.filter(r => r.target.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)); if (filter !== 'all') all = all.filter(r => r.type.toLowerCase() === filter.toLowerCase()); setHistory(all) }, [query, filter])
  useEffect(() => { reload() }, [reload])
  const handleDelete = (id: string) => { deleteResult(id); reload() }
  const handleToggleFav = (id: string) => { toggleFavorite(id); reload() }
  const total = getHistory().length
  const types = [...new Set(getHistory().map(r => r.type))]
  return (<PageWrapper><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold text-foreground">Scan History</h2><p className="text-sm text-muted-foreground">{total} total scans</p></div>{total > 0 && <button onClick={() => { if (confirm('Clear all non-starred history?')) { clearHistory(); reload() } }} className="text-xs text-destructive/70 hover:text-destructive font-medium transition-colors">Clear All</button>}</div><div className="flex items-center gap-2 mb-4"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search domain or email..." className="w-full rounded-xl border border-input bg-secondary/50 pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" /></div><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"><option value="all">All types</option>{types.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}</select></div>{history.length === 0 ? <EmptyState title="No history yet" description="Completed scans will appear here." /> : (<div className="space-y-1.5"><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">{history.length} shown</div>{history.map(item => <HistoryItem key={item.id} item={item} onDelete={handleDelete} onToggleFav={handleToggleFav} />)}</div>)}</PageWrapper>)
}

function HistoryItem({ item, onDelete, onToggleFav }: { item: ScanResult; onDelete: (id: string) => void; onToggleFav: (id: string) => void }) {
  const date = new Date(item.timestamp)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const tc: Record<string, string> = { dns: 'bg-blue-500/10 text-blue-400 border-blue-500/20', ssl: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', http: 'bg-cyan/10 text-cyan border-cyan/20', geo: 'bg-orange/10 text-orange border-orange/20', all: 'bg-accent/10 text-accent border-accent/20', security: 'bg-rose-500/10 text-rose-400 border-rose-500/20', whois: 'bg-purple-500/10 text-purple-400 border-purple-500/20', websocket: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hosting: 'bg-pink-500/10 text-pink-400 border-pink-500/20' }
  return (<div className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-primary/10 transition-all duration-200"><span className={'shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ' + (tc[item.type.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border')}>{item.type}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><Globe size={13} className="text-muted-foreground shrink-0" /><p className="font-mono text-sm text-foreground truncate font-medium">{item.target}</p></div></div><Pill variant={item.success ? 'success' : 'error'}>{item.success ? 'OK' : 'FAIL'}</Pill><span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">{dateStr}, {timeStr}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onToggleFav(item.id)} className={'p-2 rounded-lg transition-colors ' + (item.isFavorite ? 'text-orange bg-orange/10' : 'text-muted-foreground hover:text-orange hover:bg-orange/5')}><Star size={13} fill={item.isFavorite ? 'currentColor' : 'none'} /></button><button onClick={() => onDelete(item.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"><Trash2 size={13} /></button></div></div>)
}