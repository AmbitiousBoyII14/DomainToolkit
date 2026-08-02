'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Eye, EyeOff, Mail, User, Lock, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  signUpEmail, signInEmail, signInOAuth,
  forgotPassword, resetPassword,
  type User as AuthUser,
} from '@/lib/auth'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'signin' | 'signup'
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

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

  // OAuth state
  const [oauthProvider, setOauthProvider] = useState<'google' | 'facebook' | null>(null)
  const [oauthName, setOauthName] = useState('')
  const [oauthEmail, setOauthEmail] = useState('')

  // Forgot/Reset state
  const [resetUrl, setResetUrl] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  // Detect reset token from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const em = params.get('email')
      if (token && em) {
        setResetToken(token)
        setResetEmail(decodeURIComponent(em))
        setMode('reset')
      }
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setError(''); setSuccessMsg(''); setName(''); setEmail('')
      setPassword(''); setShowPass(false)
      setOauthProvider(null); setOauthName(''); setOauthEmail('')
      setResetUrl('')
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setTimeout(() => {
      const result = mode === 'signup'
        ? signUpEmail(name, email, password)
        : signInEmail(email, password)
      setLoading(false)
      if (result.error) { setError(result.error); return }
      onSuccess(result.user!); onClose()
    }, 700)
  }

  function handleOAuthStart(provider: 'google' | 'facebook') {
    setOauthProvider(provider); setOauthName(''); setOauthEmail(''); setError('')
  }

  function handleOAuthComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!oauthEmail.includes('@')) { setError('Please enter a valid email address.'); return }
    setLoading(true)
    setTimeout(() => {
      const displayName = oauthName.trim() || oauthEmail.split('@')[0]
      const result = signInOAuth(oauthProvider!, displayName, oauthEmail)
      setLoading(false)
      if (result.error) { setError(result.error); return }
      onSuccess(result.user!); onClose()
    }, 700)
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccessMsg('')
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    if (result.success) {
      if (result.resetUrl) setResetUrl(result.resetUrl)
      setSuccessMsg(result.message)
      setMode('forgot-sent')
    } else {
      setError(result.message)
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccessMsg('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const result = await resetPassword(resetToken, resetEmail, password)
    setLoading(false)
    if (result.success) {
      setSuccessMsg(result.message + ' You can now sign in with your new password.')
      // Go back to signin after 2s
      setTimeout(() => { setMode('signin'); setSuccessMsg(''); setEmail(resetEmail); setPassword('') }, 2500)
    } else {
      setError(result.message)
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────

  const providerColor = oauthProvider === 'google' ? 'text-red-600' : 'text-blue-700'
  const providerName = oauthProvider === 'google' ? 'Google' : 'Facebook'

  function getTitle(): string {
    if (oauthProvider) return 'Continue with ' + providerName
    switch (mode) {
      case 'signup': return 'Create your account'
      case 'signin': return 'Welcome back'
      case 'forgot': return 'Reset your password'
      case 'forgot-sent': return 'Check your inbox'
      case 'reset': return 'Set new password'
    }
  }

  function getSubtitle(): string {
    if (oauthProvider) return 'Enter the ' + providerName + ' email you want to use'
    switch (mode) {
      case 'signup': return 'Start with 5 free scans per day'
      case 'signin': return 'Sign in to your account'
      case 'forgot': return 'Enter your email to receive a reset link'
      case 'forgot-sent': return 'Follow the link sent to your email'
      case 'reset': return 'Enter your new password for ' + resetEmail
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" aria-modal="true" role="dialog" aria-label={getTitle()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {(mode === 'forgot' || mode === 'forgot-sent' || mode === 'reset') && (
              <button onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-lg text-foreground">{getTitle()}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{getSubtitle()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-2">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── RESET PASSWORD MODE ── */}
        {mode === 'reset' ? (
          <form onSubmit={handleResetSubmit} className="px-6 py-5 space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? 'Hide' : 'Show'}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : mode === 'forgot' ? (
          /* ── FORGOT PASSWORD MODE ── */
          <form onSubmit={handleForgotSubmit} className="px-6 py-5 space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : mode === 'forgot-sent' ? (
          /* ── FORGOT SENT CONFIRMATION ── */
          <div className="px-6 py-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Mail size={24} className="text-success" />
            </div>
            <p className="text-sm text-muted-foreground">We've sent a password reset link to <strong>{email}</strong>.</p>
            {resetUrl && (
              <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground break-all font-mono">
                <p className="mb-1 font-semibold text-foreground">🔑 Reset URL (dev mode):</p>
                {resetUrl}
              </div>
            )}
            <button onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }}
              className="text-sm text-primary font-semibold hover:underline">
              Back to sign in
            </button>
          </div>
        ) : oauthProvider ? (
          /* ── OAUTH PROMPT ── */
          <form onSubmit={handleOAuthComplete} className="px-6 py-5 space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Your Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={oauthName} onChange={e => setOauthName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{providerName} Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={oauthEmail} onChange={e => setOauthEmail(e.target.value)}
                  placeholder="you@gmail.com" required
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className={cn('w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity',
                oauthProvider === 'google' ? 'bg-red-500 hover:opacity-90' : 'bg-blue-700 hover:opacity-90',
                loading && 'opacity-50 cursor-not-allowed')}>
              {loading ? 'Connecting...' : 'Continue with ' + providerName}
            </button>
            <button type="button" onClick={() => setOauthProvider(null)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Back</button>
          </form>
        ) : (
          /* ── NORMAL SIGN IN / SIGN UP ── */
          <div className="px-6 py-5">
            {/* Social buttons */}
            <div className="flex flex-col gap-2.5 mb-5">
              <button onClick={() => handleOAuthStart('google')}
                className="flex items-center justify-center gap-3 w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <GoogleIcon /> Continue with Google
              </button>
              <button onClick={() => handleOAuthStart('facebook')}
                className="flex items-center justify-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166fe5] transition-colors">
                <FacebookIcon /> Continue with Facebook
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" required
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create free account' : 'Sign in')}
              </button>
            </form>

            {/* Forgot password link + toggle */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
                  className="text-primary font-semibold hover:underline">
                  {mode === 'signup' ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
              {mode === 'signin' && (
                <button onClick={() => { setMode('forgot'); setError(''); setSuccessMsg('') }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
