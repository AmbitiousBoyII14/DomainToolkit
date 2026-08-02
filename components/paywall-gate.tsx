'use client'

import { Lock, Crown, Zap } from 'lucide-react'
import { useAuth, isPlanAllowed, type Plan } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface PaywallGateProps {
  toolId: string
  requiredPlan?: Plan
  children: React.ReactNode
}

export function PaywallGate({ toolId, requiredPlan = 'pro', children }: PaywallGateProps) {
  const { user, openPricing, openAuthModal } = useAuth()

  const plan = user?.plan ?? 'free'
  const allowed = isPlanAllowed(plan, toolId)

  if (allowed) return <>{children}</>

  const isNotLoggedIn = !user
  const planName = requiredPlan === 'business' ? 'Business' : 'Pro'
  const PlanIcon = requiredPlan === 'business' ? Crown : Zap

  return (
    <div className="relative overflow-hidden">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-[3px] opacity-40 saturate-50" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 px-4">
        <div className={cn(
          'w-full max-w-sm rounded-2xl border bg-card shadow-2xl p-7 text-center',
          'border-border'
        )}>
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-primary" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <PlanIcon size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">{planName} required</span>
          </div>

          <h3 className="font-bold text-lg text-foreground mb-2 text-balance">
            Unlock this tool
          </h3>
          <p className="text-sm text-muted-foreground mb-5 text-pretty leading-relaxed">
            {isNotLoggedIn
              ? 'Sign in or create a free account, then upgrade to access this feature and 7+ more professional tools.'
              : `Upgrade to ${planName} to access this tool along with all premium features and higher scan limits.`}
          </p>

          {/* Benefit chips */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            {['All tools', '100+ scans/day', 'Export results', 'Favorites'].map(b => (
              <span key={b} className="px-2 py-1 rounded-full bg-primary/8 text-primary text-[11px] font-semibold">
                {b}
              </span>
            ))}
          </div>

          {isNotLoggedIn ? (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create free account
              </button>
              <button
                onClick={() => openAuthModal('signin')}
                className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            <button
              onClick={openPricing}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Crown size={15} />
              Upgrade to {planName}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
