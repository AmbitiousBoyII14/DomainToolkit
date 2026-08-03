'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScanResult } from '@/lib/types'
import { getHistory, deleteResult, toggleFavorite, clearHistory } from '@/lib/history'
import { PageWrapper, PageHeading, Pill, EmptyState } from '../scan-ui'
import { Star, Trash2, StarOff } from 'lucide-react'

export function HistoryView() {
  const [history, setHistory] = useState<ScanResult[]>([])
  const [query, setQuery] = useState('')
  const reload = useCallback(() => { const all = getHistory(); if (!query.trim()) { setHistory(all); return }; const q = query.toLowerCase(); setHistory(all.filter(r => r.target.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))) }, [query])
  useEffect(() => { reload() }, [reload])
  const handleDelete = (id: string) => { deleteResult(id); reload() }
  const handleToggleFav = (id: string) => { toggleFavorite(id); reload() }
  const handleClear = () => { if (confirm('Clear all history? Starred items will be kept.')) { clearHistory(); reload() } }
  const total = getHistory().length
  return (<PageWrapper><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold text-foreground">History</h2><p className="text-sm text-muted-foreground">{total} scan{total !== 1 ? 's' : ''} recorded</p></div>{total > 0 && <button onClick={handleClear} className="text-xs text-destructive hover:underline font-medium">Clear All</button>}</div><div className="mb-4"><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search history..." className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>{history.length === 0 ? <EmptyState title="No history yet" description="Completed scans will appear here." /> : (<div className="space-y-2">{history.map(item => (<HistoryItem key={item.id} item={item} onDelete={handleDelete} onToggleFav={handleToggleFav} />))}</div>)}</PageWrapper>)
}

function HistoryItem({ item, onDelete, onToggleFav }: { item: ScanResult; onDelete: (id: string) => void; onToggleFav: (id: string) => void }) {
  const date = new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (<div className="bg-card border border-border rounded-xl p-4"><div className="flex items-start justify-between gap-2 mb-1"><span className="font-semibold text-sm text-foreground">{item.type}</span><span className="text-xs text-muted-foreground shrink-0">{date}</span></div><p className="text-xs text-primary mb-2">{item.target}</p><div className="flex items-center gap-2 mb-3"><Pill variant={item.success ? 'success' : 'error'}>{item.success ? 'OK' : 'FAILED'}</Pill>{item.isFavorite && <Pill variant="warning">STARRED</Pill>}</div><div className="flex items-center gap-3"><button onClick={() => onToggleFav(item.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-warning-foreground transition-colors">{item.isFavorite ? <StarOff size={13} /> : <Star size={13} />}{item.isFavorite ? 'Unstar' : 'Star'}</button><span className="flex-1" /><button onClick={() => onDelete(item.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} />Delete</button></div></div>)
}