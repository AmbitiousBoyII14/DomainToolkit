'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Users, Activity, Crown, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllUsers, updateUserPlan, getStoredUser, PLAN_CONFIGS, type User, type Plan } from '@/lib/auth'
import { getHistory } from '@/lib/history'

const ADMIN_PASSWORD = 'Treackyz'

type AdminTab = 'dashboard' | 'users'

export function AdminView() {
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  // Check if already unlocked this session
  useEffect(() => {
    const stored = sessionStorage.getItem('dtp_admin_unlocked')
    if (stored === '1') {
      setUnlocked(true)
      loadData()
    }
  }, [])

  function loadData() {
    setUsers(getAllUsers())
    setHistoryCount(getHistory().length)
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('dtp_admin_unlocked', '1')
      setUnlocked(true)
      loadData()
    } else {
      setPwError('Incorrect password.')
      setPw('')
    }
  }

  function handleChangePlan(userId: string, plan: Plan) {
    updateUserPlan(userId, plan)
    setUsers(getAllUsers())
    setEditingPlan(null)
  }

  function handleDeleteUser(userId: string) {
    if (!confirm('Delete this user?')) return
    const db = getAllUsers().filter(u => u.id !== userId)
    localStorage.setItem('dtp_users_db', JSON.stringify(db))
    setUsers(db)
    // if current user, clear session
    const current = getStoredUser()
    if (current?.id === userId) {
      localStorage.removeItem('dtp_user')
      window.location.reload()
    }
  }

  const planCounts = {
    free:     users.filter(u => u.plan === 'free').length,
    pro:      users.filter(u => u.plan === 'pro').length,
    business: users.filter(u => u.plan === 'business').length,
  }

  // ── Lock screen ──
  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-xs bg-card border border-border rounded-2xl shadow-xl p-7">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Lock size={22} className="text-primary" />
            </div>
            <h2 className="font-bold text-lg text-foreground">Admin Access</h2>
            <p className="text-sm text-muted-foreground mt-1 text-center">Enter the admin password to continue.</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            {pwError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{pwError}</p>
            )}
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError('') }}
                placeholder="Admin password"
                className="w-full rounded-lg border border-input bg-background px-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Hide' : 'Show'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Unlock Admin
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin panel ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage users and view platform stats</p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('dtp_admin_unlocked'); setUnlocked(false) }}
          className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {(['dashboard', 'users'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors',
              tab === t
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={users.length} icon={<Users size={16} className="text-primary" />} />
            <StatCard label="Scans Logged" value={historyCount} icon={<Activity size={16} className="text-success" />} />
            <StatCard label="Pro Users" value={planCounts.pro} icon={<Crown size={16} className="text-primary" />} />
            <StatCard label="Business" value={planCounts.business} icon={<Crown size={16} className="text-amber-500" />} />
          </div>

          {/* Plan distribution */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Plan Distribution</h3>
            <div className="flex flex-col gap-3">
              {(['free', 'pro', 'business'] as Plan[]).map(plan => {
                const count = planCounts[plan]
                const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground capitalize">{PLAN_CONFIGS[plan].name}</span>
                      <span className="text-xs text-muted-foreground">{count} users ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          plan === 'free' ? 'bg-muted-foreground/40' :
                          plan === 'pro' ? 'bg-primary' : 'bg-amber-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Support Contact</h3>
            <div className="flex flex-col gap-2">
              <ContactRow label="Telegram" href="https://t.me/Treacky_1" value="@Treacky_1" />
              <ContactRow label="Gmail" href="mailto:owner@domain.com" value="Contact via Gmail" />
            </div>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Users size={32} className="text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground mb-1">No registered users yet</p>
              <p className="text-sm text-muted-foreground">Users who sign up will appear here.</p>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">{users.length} registered user{users.length !== 1 ? 's' : ''}</h3>
                <button onClick={loadData} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Refresh</button>
              </div>
              <div className="divide-y divide-border">
                {users.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    editingPlan={editingPlan === u.id}
                    onStartEdit={() => setEditingPlan(u.id)}
                    onCancelEdit={() => setEditingPlan(null)}
                    onChangePlan={(plan) => handleChangePlan(u.id, plan)}
                    onDelete={() => handleDeleteUser(u.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground font-medium">{label}</span></div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  )
}

function ContactRow({ label, href, value }: { label: string; href: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">{value}</a>
    </div>
  )
}

const PLAN_BADGE: Record<Plan, string> = {
  free:     'bg-muted text-muted-foreground',
  pro:      'bg-primary/15 text-primary',
  business: 'bg-amber-500/15 text-amber-600',
}

function UserRow({
  user, editingPlan, onStartEdit, onCancelEdit, onChangePlan, onDelete,
}: {
  user: User
  editingPlan: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onChangePlan: (p: Plan) => void
  onDelete: () => void
}) {
  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Plan badge / editor */}
      {editingPlan ? (
        <div className="flex items-center gap-1.5">
          {(['free', 'pro', 'business'] as Plan[]).map(p => (
            <button
              key={p}
              onClick={() => onChangePlan(p)}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-semibold transition-colors',
                p === user.plan
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
            >
              {PLAN_CONFIGS[p].name}
            </button>
          ))}
          <button onClick={onCancelEdit} className="text-xs text-muted-foreground hover:text-foreground px-1">Cancel</button>
        </div>
      ) : (
        <button
          onClick={onStartEdit}
          className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-opacity hover:opacity-70', PLAN_BADGE[user.plan])}
        >
          {PLAN_CONFIGS[user.plan].name}
          <ChevronDown size={10} />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Delete ${user.name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
