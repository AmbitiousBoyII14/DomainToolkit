'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScanResult } from '@/lib/types'
import { getFavorites, toggleFavorite } from '@/lib/history'
import { PageWrapper, PageHeading, Pill, EmptyState } from '../scan-ui'
import { StarOff } from 'lucide-react'

export function FavoritesView() {
  const [favorites, setFavorites] = useState<ScanResult[]>([])

  const reload = useCallback(() => {
    setFavorites(getFavorites())
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleUnstar = (id: string) => {
    toggleFavorite(id)
    reload()
  }

  return (
    <PageWrapper>
      <PageHeading title="Favorites" subtitle="Starred scans you want to keep handy" />

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Star any scan from the History screen."
        />
      ) : (
        <div className="space-y-2">
          {favorites.map(item => (
            <FavoriteItem key={item.id} item={item} onUnstar={handleUnstar} />
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

function FavoriteItem({ item, onUnstar }: { item: ScanResult; onUnstar: (id: string) => void }) {
  const date = new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-semibold text-sm text-foreground">{item.type}</span>
        <span className="text-xs text-muted-foreground shrink-0">{date}</span>
      </div>
      <p className="text-xs text-primary mb-2">{item.target}</p>
      <div className="flex items-center gap-2 mb-3">
        <Pill variant={item.success ? 'success' : 'error'}>{item.success ? 'OK' : 'FAILED'}</Pill>
      </div>
      <button
        onClick={() => onUnstar(item.id)}
        className="flex items-center gap-1.5 text-xs text-warning-foreground hover:opacity-75 transition-opacity font-medium"
        aria-label="Unstar"
      >
        <StarOff size={13} />
        Unstar
      </button>
    </div>
  )
}
