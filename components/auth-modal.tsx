'use client'

import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Mail, User, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  signUpEmail, signInEmail, signInOAuth,
  type User as AuthUser,
} from '@/lib/auth'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'signin' | 'signup'
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

export function AuthModal({ isOpen, initialMode = 'signup', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OAuth simulation state
  const [oauthProvider, setOauthProvider] = useState<'google' | 'facebook' | null>(null)
  const [oauthName, setOauthName] = useState('')
  const [oauthEmail, setOauthEmail] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setError('')
      setName('')
      setEmail('')
      setPassword('')
      setOauthProvider(null)
      setOauthName('')
      setOauthEmail('')
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setTimeout(() => {
      const result = mode === 'signup'
        ? signUpEmail(name, email, password)
        : signInEmail(email, password)
      setLoading(false)
      if (result.error) { setError(result.error); return }
      onSuccess(result.user!)
      onClose()
    }, 700)
  }

  function handleOAuthStart(provider: 'google' | 'facebook') {
    setOauthProvider(provider)
    setOauthName('')
    setOauthEmail('')
    setError('')
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
      onSuccess(result.user!)
      onClose()
    }, 700)
  }

  const providerColor = oauthProvider === 'google'
    ? 'text-red-600'
    : 'text-blue-700'
  const providerName = oauthProvider === 'google' ? 'Google' : 'Facebook'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-label={mode === 'signup' ? 'Create account' : 'Sign in'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg text-foreground">
              {oauthProvider
                ? `Continue with ${providerName}`
                : mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {oauthProvider
                ? `Enter the ${providerName} email you want to use`
                : mode === 'signup' ? 'Start with 5 free scans per day' : 'Sign in to your account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* OAuth prompt */}
        {oauthProvider ? (
          <form onSubmit={handleOAuthComplete} className="px-6 py-5 space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={oauthName}
                  onChange={e => setOauthName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {providerName} Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={oauthEmail}
                  onChange={e => setOauthEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity',
                oauthProvider === 'google' ? 'bg-red-500 hover:opacity-90' : 'bg-blue-700 hover:opacity-90',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? 'Connecting...' : `Continue with ${providerName}`}
            </button>
            <button
              type="button"
              onClick={() => setOauthProvider(null)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Back
            </button>
          </form>
        ) : (
          <div className="px-6 py-5">
            {/* Social buttons */}
            <div className="flex flex-col gap-2.5 mb-5">
              <button
                onClick={() => handleOAuthStart('google')}
                className="flex items-center justify-center gap-3 w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuthStart('facebook')}
                className="flex items-center justify-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166fe5] transition-colors"
              >
                <FacebookIcon />
                Continue with Facebook
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email form */}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading
                  ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                  : (mode === 'signup' ? 'Create free account' : 'Sign in')}
              </button>
            </form>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
                className="text-primary font-semibold hover:underline"
              >
                {mode === 'signup' ? 'Sign in' : 'Sign up free'}
              </button>
            </p>
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
