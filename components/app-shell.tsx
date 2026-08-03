'use client'
import { useState, useCallback, useEffect } from 'react'
import { NAV_ITEMS, type ToolId } from '@/lib/types'
import { Sidebar } from './sidebar'; import { Toolbar } from './toolbar'
import { AuthModal } from './auth-modal'; import { ContactFAB } from './contact-fab'
import { AuthContext, getStoredUser, storeUser, type User, type AuthContextValue } from '@/lib/auth'
import { HomeView } from './views/home-view'
import { AllInOneView } from './views/all-in-one-view'
import { DomainToolsView } from './views/domain-tools-view'
import { SslView } from './views/ssl-view'
import { WebSocketView } from './views/websocket-view'
import { NetworkToolsView } from './views/network-tools-view'
import { HostingView } from './views/hosting-view'
import { SecurityHeadersView } from './views/security-headers-view'
import { GeoView } from './views/geo-view'
import { EmailVerifierView } from './views/email-verifier-view'
import { BulkScanView } from './views/bulk-scan-view'
import { HistoryView } from './views/history-view'
import { FavoritesView } from './views/favorites-view'
import { PricingView } from './views/pricing-view'
import { AdminView } from './views/admin-view'

export function AppShell() {
  const [activeId, setActiveId] = useState<ToolId>('home'); const [sidebarOpen, setSidebarOpen] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0); const [user, setUserState] = useState<User | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false); const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup')
  useEffect(() => { const s = getStoredUser(); if (s) setUserState(s) }, [])
  const setUser = useCallback((u: User | null) => { setUserState(u); if (u) storeUser(u) }, [])
  const openAuthModal = useCallback((m: 'signin' | 'signup' = 'signup') => { setAuthModalMode(m); setAuthModalOpen(true) }, [])
  const openPricing = useCallback(() => { setActiveId('pricing'); setSidebarOpen(false) }, [])
  const authCtx: AuthContextValue = { user, setUser, openAuthModal, openPricing }
  const navigate = useCallback((id: ToolId) => { setActiveId(id); setSidebarOpen(false) }, [])
  const onScanSaved = useCallback(() => setHistoryVersion(v => v + 1), [])
  const currentNav = NAV_ITEMS.find(n => n.id === activeId)
  return (<AuthContext.Provider value={authCtx}><div className="flex h-screen overflow-hidden bg-background"><Sidebar activeId={activeId} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />{sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}<div className="flex flex-col flex-1 min-w-0 overflow-hidden"><Toolbar title={currentNav?.label ?? 'Domain Toolkit Pro'} onMenuClick={() => setSidebarOpen(true)} /><main className="flex-1 overflow-y-auto"><ActiveView id={activeId} navigate={navigate} onScanSaved={onScanSaved} historyVersion={historyVersion} /></main></div><AuthModal isOpen={authModalOpen} initialMode={authModalMode} onClose={() => setAuthModalOpen(false)} onSuccess={(u) => { setUser(u); setAuthModalOpen(false) }} /><ContactFAB /></div></AuthContext.Provider>)
}

function ActiveView({ id, navigate, onScanSaved, historyVersion }: { id: ToolId; navigate: (id: ToolId) => void; onScanSaved: () => void; historyVersion: number }) {
  switch (id) {
    case 'home': return <HomeView onNavigate={navigate} />
    case 'all-in-one': return <AllInOneView onScanSaved={onScanSaved} />
    case 'domain-tools': return <DomainToolsView onScanSaved={onScanSaved} />
    case 'ssl': return <SslView onScanSaved={onScanSaved} />
    case 'websocket': return <WebSocketView onScanSaved={onScanSaved} />
    case 'network-tools': return <NetworkToolsView onScanSaved={onScanSaved} />
    case 'hosting': return <HostingView onScanSaved={onScanSaved} />
    case 'security-headers': return <SecurityHeadersView onScanSaved={onScanSaved} />
    case 'geo': return <GeoView onScanSaved={onScanSaved} />
    case 'email-verifier': return <EmailVerifierView onScanSaved={onScanSaved} />
    case 'bulk-scan': return <BulkScanView onScanSaved={onScanSaved} />
    case 'history': return <HistoryView />
    case 'favorites': return <FavoritesView />
    case 'pricing': return <PricingView />
    case 'admin': return <AdminView />
    default: return <HomeView onNavigate={navigate} />
  }
}