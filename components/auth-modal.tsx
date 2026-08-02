'use client'

import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Mail, User, Lock, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signUpEmail, signInEmail, forgotPassword, resetPassword, type User as AuthUser } from '@/lib/auth'

interface AuthModalProps { isOpen: boolean; initialMode?: 'signin' | 'signup'; onClose: () => void; onSuccess: (user: AuthUser) => void }
type FlowMode = 'signin' | 'signup' | 'forgot' | 'forgot-sent' | 'reset'

export function AuthModal({ isOpen, initialMode = 'signup', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<FlowMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const t = p.get('token'); const e = p.get('email')
      if (t && e) { setResetToken(t); setResetEmail(decodeURIComponent(e)); setMode('reset') }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) { setMode(initialMode); setError(''); setSuccessMsg(''); setName(''); setEmail(''); setPassword(''); setShowPass(false); setResetUrl('') }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!email.includes('@')) { setError('Please enter a valid email.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setTimeout(() => {
      const r = mode === 'signup' ? signUpEmail(name, email, password) : signInEmail(email, password)
      setLoading(false)
      if (r.error) { setError(r.error); return }
      onSuccess(r.user!); onClose()
    }, 600)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccessMsg('')
    if (!email.includes('@')) { setError('Please enter a valid email.'); return }
    setLoading(true)
    const r = await forgotPassword(email); setLoading(false)
    if (r.success) { if (r.resetUrl) setResetUrl(r.resetUrl); setSuccessMsg(r.message); setMode('forgot-sent') }
    else setError(r.message)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccessMsg('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const r = await resetPassword(resetToken, resetEmail, password); setLoading(false)
    if (r.success) { setSuccessMsg(r.message + ' Redirecting...'); setTimeout(() => { setMode('signin'); setSuccessMsg(''); setEmail(resetEmail); setPassword('') }, 2000) }
    else setError(r.message)
  }

  function getTitle(): string {
    switch(mode) { case 'signup': return 'Create your account'; case 'signin': return 'Welcome back'; case 'forgot': return 'Reset your password'; case 'forgot-sent': return 'Check your inbox'; case 'reset': return 'Set new password' }
  }
  function getSub(): string {
    switch(mode) { case 'signup': return 'Start with 5 free scans per day'; case 'signin': return 'Sign in to your account'; case 'forgot': return "Enter your email and we'll send a reset link"; case 'forgot-sent': return 'Follow the link we sent to your email'; case 'reset': return 'Choose a new password for ' + resetEmail }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" aria-modal="true" role="dialog" aria-label={getTitle()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {(mode === 'forgot' || mode === 'forgot-sent' || mode === 'reset') && (
              <button onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></button>
            )}
            <div><h2 className="font-bold text-lg text-foreground">{getTitle()}</h2><p className="text-sm text-muted-foreground mt-0.5">{getSub()}</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>
        {successMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex gap-2"><CheckCircle size={16} className="shrink-0 mt-0.5" /><span>{successMsg}</span></div>}

        {mode === 'reset' ? (
          <form onSubmit={handleReset} className="px-6 py-5 space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">New Password</label>
              <div className="relative"><KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgot} className="px-6 py-5 space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        ) : mode === 'forgot-sent' ? (
          <div className="px-6 py-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto"><Mail size={24} className="text-success" /></div>
            <p className="text-sm text-muted-foreground">Reset link sent to <strong>{email}</strong>.</p>
            {resetUrl && <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground break-all font-mono"><p className="mb-1 font-semibold text-foreground">🔑 Reset URL:</p>{resetUrl}</div>}
            <button onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }} className="text-sm text-primary font-semibold hover:underline">Back to sign in</button>
          </div>
        ) : (
          <div className="px-6 py-5">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
                  <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div></div>
              )}
              <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div></div>
              <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div></div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 mt-1">
                {loading ? (mode === 'signup' ? 'Creating...' : 'Signing in...') : (mode === 'signup' ? 'Create free account' : 'Sign in')}
              </button>
            </form>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }} className="text-primary font-semibold hover:underline">{mode === 'signup' ? 'Sign in' : 'Sign up free'}</button>
              </p>
              {mode === 'signin' && <button onClick={() => { setMode('forgot'); setError(''); setSuccessMsg('') }} className="text-xs text-muted-foreground hover:text-primary">Forgot password?</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
