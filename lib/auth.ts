'use client'
import { createContext, useContext } from 'react'

export type Plan = 'free' | 'pro' | 'business'

export interface PlanConfig {
  name: string; price: string; period: string; paypalButtonId: string
  firstPrice: string; dailyScans: number; historyLimit: number
  allowedTools: string[]; canExport: boolean; canBulkScan: boolean
  hasApiKey: boolean; hasPrioritySupport: boolean; badge?: string
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    name: 'Free', price: '$0', period: 'forever', paypalButtonId: '', firstPrice: '$0',
    dailyScans: 5, historyLimit: 10, allowedTools: ['domain-tools', 'ssl', 'websocket'],
    canExport: false, canBulkScan: false, hasApiKey: false, hasPrioritySupport: false,
  },
  pro: {
    name: 'Pro', price: '$4.99', period: 'per month', paypalButtonId: '54L2C9R46PZV8',
    firstPrice: '$2.49', dailyScans: 100, historyLimit: 500, allowedTools: 'all' as unknown as string[],
    canExport: true, canBulkScan: true, hasApiKey: false, hasPrioritySupport: false,
    badge: 'Most Popular',
  },
  business: {
    name: 'Business', price: '$14.99', period: 'per month', paypalButtonId: '54L2C9R46PZV8',
    firstPrice: '$7.49', dailyScans: -1, historyLimit: -1, allowedTools: 'all' as unknown as string[],
    canExport: true, canBulkScan: true, hasApiKey: true, hasPrioritySupport: true,
  },
}

export function isPlanAllowed(plan: Plan, toolId: string): boolean {
  const cfg = PLAN_CONFIGS[plan]
  if ((cfg.allowedTools as unknown as string) === 'all') return true
  return (cfg.allowedTools as string[]).includes(toolId)
}

export interface User {
  id: string; name: string; email: string; avatar?: string
  plan: Plan; provider: 'email'; firstPurchaseUsed?: boolean
  passwordHash?: string; resetToken?: string; resetTokenExpiry?: number
  createdAt: number; lastLogin?: number
}

const SCAN_KEY = 'dtp_scan_usage'
interface UsageEntry { date: string; count: number }
function todayStr() { return new Date().toISOString().slice(0, 10) }
export function getScanCount(): number {
  if (typeof window === 'undefined') return 0
  try { const e: UsageEntry = JSON.parse(localStorage.getItem(SCAN_KEY) ?? '{"date":"","count":0}'); return e.date !== todayStr() ? 0 : e.count } catch { return 0 }
}
export function incrementScanCount(): void {
  if (typeof window === 'undefined') return
  try { const t = todayStr(); const e: UsageEntry = JSON.parse(localStorage.getItem(SCAN_KEY) ?? '{"date":"","count":0}'); localStorage.setItem(SCAN_KEY, JSON.stringify({ date: t, count: e.date === t ? e.count + 1 : 1 })) } catch {}
}
export function canScan(plan: Plan): boolean {
  const limit = PLAN_CONFIGS[plan].dailyScans; if (limit === -1) return true; return getScanCount() < limit
}

const USER_KEY = 'dtp_user'; const USERS_DB_KEY = 'dtp_users_db'
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) as User : null } catch { return null }
}
export function storeUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  const db = getAllUsers(); const idx = db.findIndex(u => u.email === user.email)
  if (idx >= 0) db[idx] = user; else db.push(user)
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db))
  fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user }) }).catch(() => {})
}
export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(USERS_DB_KEY) ?? '[]') as User[] } catch { return [] }
}
export function removeStoredUser(): void { if (typeof window === 'undefined') return; localStorage.removeItem(USER_KEY) }
export async function upgradePlanServer(user: User, plan: Plan): Promise<boolean> {
  try { const r = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, plan }) }); return r.ok && ((await r.json()).success === true) } catch { return false }
}
export function upgradePlanLocal(user: User, plan: Plan): User {
  const updated = { ...user, plan, firstPurchaseUsed: true }; storeUser(updated)
  const db = getAllUsers(); const idx = db.findIndex(u => u.email === user.email)
  if (idx >= 0) { db[idx] = updated; localStorage.setItem(USERS_DB_KEY, JSON.stringify(db)) }
  upgradePlanServer(updated, plan); return updated
}

function genId() { return Date.now() + '-' + Math.random().toString(36).slice(2, 9) }
function getFirstName(email: string) { return email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0] }
export interface AuthResult { user: User | null; error: string | null }
export interface ForgotResult { success: boolean; message: string; resetUrl?: string }
export function signUpEmail(name: string, email: string, _password: string): AuthResult {
  const db = getAllUsers(); if (db.find(u => u.email === email)) return { user: null, error: 'Account already exists. Sign in instead.' }
  const user: User = { id: genId(), name: name.trim() || getFirstName(email), email: email.trim().toLowerCase(), plan: 'free', provider: 'email', firstPurchaseUsed: false, createdAt: Date.now() }
  storeUser(user); return { user, error: null }
}
export function signInEmail(email: string, _password: string): AuthResult {
  const db = getAllUsers(); const u = db.find(x => x.email === email.trim().toLowerCase())
  if (!u) return { user: null, error: 'No account found. Sign up first.' }; storeUser(u); return { user: u, error: null }
}
export async function forgotPassword(email: string): Promise<ForgotResult> {
  try { const r = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase() }) }); const d = await r.json(); return { success: d.success, message: d.message, resetUrl: d.resetUrl } } catch { return { success: false, message: 'Network error' } }
}
export async function resetPassword(token: string, email: string, newPassword: string): Promise<ForgotResult> {
  try { const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: email.trim().toLowerCase(), newPassword }) }); const d = await r.json(); return { success: d.success, message: d.message || d.error || 'Error' } } catch { return { success: false, message: 'Network error' } }
}
export function signOut(): void { removeStoredUser() }
export interface AuthContextValue { user: User | null; setUser: (u: User | null) => void; openAuthModal: (mode?: 'signin' | 'signup') => void; openPricing: () => void }
export const AuthContext = createContext<AuthContextValue>({ user: null, setUser: () => {}, openAuthModal: () => {}, openPricing: () => {} })
export function useAuth() { return useContext(AuthContext) }
