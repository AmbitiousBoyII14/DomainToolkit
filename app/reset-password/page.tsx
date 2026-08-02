'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react'
import { resetPassword } from '@/lib/auth'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const result = await resetPassword(token, email, password)
    setLoading(false)
    if (result.success) {
      setSuccess('Password reset successfully! Redirecting to sign in...')
      setTimeout(() => router.push('/'), 2000)
    } else {
      setError(result.message)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock size={24} className="text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground">This password reset link is invalid or incomplete.</p>
          <button onClick={() => router.push('/')}
            className="text-sm text-primary font-semibold hover:underline">
            Go to home page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Back */}
        <button onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={15} />
          Back to home
        </button>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <h1 className="font-bold text-lg text-foreground">Set new password</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Enter your new password for {email}</p>
          </div>

          {success ? (
            <div className="px-6 py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle size={24} className="text-success" />
              </div>
              <p className="text-sm text-success font-medium">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    }>
      <ResetForm />
    </Suspense>
  )
}
