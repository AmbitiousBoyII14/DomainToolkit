'use client'

import { createContext, useContext } from 'react'

// ─── Plan tiers ────────────────────────────────────────────────────────────
export type Plan = 'free' | 'pro' | 'business'

export interface PlanConfig {
  name: string
  price: string
  period: string
  paypalButtonId: string
  dailyScans: number
  historyLimit: number
  allowedTools: string[]
  canExport: boolean
  canBulkScan: boolean
  hasApiKey: boolean
  hasPrioritySupport: boolean
  badge?: string
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    name: 'Free', price: '$0', period: 'forever', paypalButtonId: '',
    dailyScans: 5, historyLimit: 10,
    allowedTools: ['domain-tools', 'ssl', 'websocket'],
    canExport: false, canBulkScan: false, hasApiKey: false, hasPrioritySupport: false,
  },
  pro: {
    name: 'Pro', price: '$4.99', period: 'per month', paypalButtonId: '54L2C9R46PZV8',
    dailyScans: 100, historyLimit: 500,
    allowedTools: 'all' as unknown as string[],
    canExport: true, canBulkScan: false, hasApiKey: false, hasPrioritySupport: false,
    badge: 'Most Popular',
  },
  business: {
    name: 'Business', price: '$14.99', period: 'per month', paypalButtonId: '54L2C9R46PZV8',
    dailyScans: -1, historyLimit: -1,
    allowedTools: 'all' as unknown as string[],
    canExport: true, canBulkScan: true, hasApiKey: true, hasPrioritySupport: true,
  },
}

export function isPlanAllowed(plan: Plan, toolId: string): boolean {
  const cfg = PLAN_CONFIGS[plan]
  if ((cfg.allowedTools as unknown as string) === 'all') return true
  return (cfg.allowedTools as string[]).includes(toolId)
}

// ─── User model ───────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: Plan
  provider: 'email' | 'google' | 'facebook'
  createdAt: number
  lastLogin?: number
}

// ─── Scan usage tracking ──────────────────────────────────────────────────
const SCAN_KEY = 'dtp_scan_usage'
interface UsageEntry { date: string; count: number }
function todayStr() { return new Date().toISOString().slice(0, 10) }

export function getScanCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const entry: UsageEntry = JSON.parse(localStorage.getItem(SCAN_KEY) ?? '{"date":"","count":0}')
    return entry.date !== todayStr() ? 0 : entry.count
  } catch { return 0 }
}
export function incrementScanCount(): void {
  if (typeof window === 'undefined') return
  const today = todayStr()
  try {
    const entry: UsageEntry = JSON.parse(localStorage.getItem(SCAN_KEY) ?? '{"date":"","count":0}')
    const count = entry.date === today ? entry.count + 1 : 1
    localStorage.setItem(SCAN_KEY, JSON.stringify({ date: today, count }))
  } catch { /* ignore */ }
}
export function canScan(plan: Plan): boolean {
  const limit = PLAN_CONFIGS[plan].dailyScans
  if (limit === -1) return true
  return getScanCount() < limit
}

// ─── Auth persistence (localStorage + server sync) ───────────────────────
const USER_KEY = 'dtp_user'
const USERS_DB_KEY = 'dtp_users_db'

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch { return null }
}

export function storeUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Persist to local "DB"
  const db = getAllUsers()
  const idx = db.findIndex(u => u.email === user.email)
  if (idx >= 0) db[idx] = user
  else db.push(user)
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db))
  // Sync to server (GitHub-backed)
  syncUserToServer(user)
}

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) ?? '[]') as User[]
  } catch { return [] }
}

export function removeStoredUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
}

// ─── Server sync ──────────────────────────────────────────────────────────

/** Sync user to GitHub-backed server */
async function syncUserToServer(user: User) {
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    })
  } catch {
    // Silent fail — works offline with localStorage
  }
}

/** Upgrade user plan on server after PayPal payment */
export async function upgradePlanServer(user: User, plan: Plan): Promise<boolean> {
  try {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

/** Upgrade plan locally + server */
export function upgradePlanLocal(user: User, plan: Plan): User {
  const updated = { ...user, plan }
  storeUser(updated)
  // Also update local DB
  const db = getAllUsers()
  const idx = db.findIndex(u => u.email === user.email)
  if (idx >= 0) { db[idx] = updated; localStorage.setItem(USERS_DB_KEY, JSON.stringify(db)) }
  // Fire server sync
  upgradePlanServer(updated, plan)
  return updated
}

// ─── Auth functions ───────────────────────────────────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getFirstName(email: string): string {
  return email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0]
}

export interface AuthResult { user: User | null; error: string | null }

export function signUpEmail(name: string, email: string, _password: string): AuthResult {
  const db = getAllUsers()
  if (db.find(u => u.email === email)) {
    return { user: null, error: 'An account with this email already exists. Please sign in.' }
  }
  const user: User = {
    id: generateId(),
    name: name.trim() || getFirstName(email),
    email: email.trim().toLowerCase(),
    plan: 'free',
    provider: 'email',
    createdAt: Date.now(),
  }
  storeUser(user)
  return { user, error: null }
}

export function signInEmail(email: string, _password: string): AuthResult {
  const db = getAllUsers()
  const existing = db.find(u => u.email === email.trim().toLowerCase())
  if (!existing) {
    return { user: null, error: 'No account found with this email. Please sign in first.' }
  }
  storeUser(existing)
  return { user: existing, error: null }
}

export function signInOAuth(provider: 'google' | 'facebook', name: string, email: string): AuthResult {
  const db = getAllUsers()
  const existing = db.find(u => u.email === email.trim().toLowerCase())
  if (existing) {
    // Update provider if changed
    if (existing.provider !== provider) existing.provider = provider
    storeUser(existing)
    return { user: existing, error: null }
  }
  const user: User = {
    id: generateId(),
    name,
    email: email.trim().toLowerCase(),
    plan: 'free',
    provider,
    createdAt: Date.now(),
  }
  storeUser(user)
  return { user, error: null }
}

export function signOut(): void { removeStoredUser() }

// ─── React context ────────────────────────────────────────────────────────
export interface AuthContextValue {
  user: User | null
  setUser: (u: User | null) => void
  openAuthModal: (mode?: 'signin' | 'signup') => void
  openPricing: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  openAuthModal: () => {},
  openPricing: () => {},
})

export function useAuth() { return useContext(AuthContext) }
