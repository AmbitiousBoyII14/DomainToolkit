'use client'
import { useState, useEffect, useCallback } from 'react'
import { getFavorites, toggleFavorite } from '@/lib/history'
import { PageWrapper, PageHeading, Pill, EmptyState } from '../scan-ui'
import { StarOff, Globe } from 'lucide-react'
export function FavoritesView() {
  const [favs, setFavs] = useState(getFavorites()); const reload = useCallback(() => setFavs(getFavorites()), []); useEffect(() => { reload() }, [reload])
  return (<PageWrapper><PageHeading title="Favorites" subtitle="Starred scans" />{favs.length === 0 ? <EmptyState title="No favorites" description="Star scans from History." /> : (<div className="space-y-2">{favs.map(item => (<div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><Globe size={13} className="text-muted-foreground" /><span className="font-mono text-sm font-medium">{item.target}</span></div><div className="flex items-center gap-2"><Pill variant="primary">{item.type}</Pill><span className="text-[10px] text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span></div></div><button onClick={() => { toggleFavorite(item.id); reload() }} className="p-2 rounded-lg text-amber-500 bg-amber-50 opacity-0 group-hover:opacity-100"><StarOff size={14} /></button></div>))}</div>)}</PageWrapper>)
}