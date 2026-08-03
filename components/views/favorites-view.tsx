'use client'
import { useState, useEffect, useCallback } from 'react'
import { ScanResult } from '@/lib/types'
import { getFavorites, toggleFavorite } from '@/lib/history'
import { PageWrapper, PageHeading, Pill, EmptyState } from '../scan-ui'
import { StarOff, Globe } from 'lucide-react'

export function FavoritesView() {
  const [favorites, setFavorites] = useState<ScanResult[]>([])
  const reload = useCallback(() => { setFavorites(getFavorites()) }, [])
  useEffect(() => { reload() }, [reload])
  return (<PageWrapper><PageHeading title="Favorites" subtitle="Starred scans you want to keep handy" />{favorites.length === 0 ? <EmptyState title="No favorites yet" description="Star any scan from the History screen." /> : (<div className="space-y-2">{favorites.map(item => (<div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4 group"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><Globe size={13} className="text-muted-foreground" /><span className="font-mono text-sm text-foreground font-medium">{item.target}</span></div><div className="flex items-center gap-2"><Pill variant="primary">{item.type}</Pill><span className="text-[10px] text-muted-foreground">{new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></div><button onClick={() => { toggleFavorite(item.id); reload() }} className="p-2 rounded-lg text-orange bg-orange/10 hover:bg-orange/20 transition-colors opacity-0 group-hover:opacity-100"><StarOff size={14} /></button></div>))}</div>)}</PageWrapper>)
}