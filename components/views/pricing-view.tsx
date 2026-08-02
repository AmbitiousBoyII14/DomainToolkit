'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Crown, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, PLAN_CONFIGS, type Plan, upgradePlanLocal } from '@/lib/auth'

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (opts: { hostedButtonId: string }) => { render: (selector: string) => void }
    }
  }
}

interface Feature {
  label: string
  free: boolean | string
  pro: boolean | string
  business: boolean | string
}

const FEATURES: Feature[] = [
  { label: 'Daily scans',            free: '5 scans',    pro: '100 scans',   business: 'Unlimited' },
  { label: 'Domain Tools (DNS, WHOIS, HTTP)', free: true, pro: true,         business: true },
  { label: 'SSL / TLS checker',      free: true,         pro: true,          business: true },
  { label: 'WebSocket detection',    free: true,         pro: true,          business: true },
  { label: 'All-In-One Scan',        free: false,        pro: true,          business: true },
  { label: 'Network Tools (Ping, Ports)', free: false,   pro: true,          business: true },
  { label: 'Hosting / CDN detection',free: false,        pro: true,          business: true },
  { label: 'Security Headers audit', free: false,        pro: true,          business: true },
  { label: 'Scan history',           free: '10 entries', pro: '500 entries', business: 'Unlimited' },
  { label: 'Favorites',              free: false,        pro: true,          business: true },
  { label: 'Export results',         free: false,        pro: true,          business: true },
  { label: 'PDF export',             free: false,        pro: false,         business: true },
  { label: 'Bulk domain scan',       free: false,        pro: false,         business: true },
  { label: 'API access key',         free: false,        pro: false,         business: true },
  { label: 'Priority support',       free: false,        pro: false,         business: true },
]

interface PlanInfo { id: Plan; highlighted: boolean }

const PLANS: PlanInfo[] = [
  { id: 'free',     highlighted: false },
  { id: 'pro',      highlighted: true  },
  { id: 'business', highlighted: false },
]

export function PricingView() {
  const { user, setUser, openAuthModal } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [paypalError, setPaypalError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')
  const renderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup render timeouts
  useEffect(() => {
    return () => {
      if (renderTimeout.current) clearTimeout(renderTimeout.current)
    }
  }, [])

  function handleSelectPlan(plan: Plan) {
    setPaymentSuccess('')
    setPaypalError('')
    if (!user) {
      openAuthModal('signup')
      return
    }
    if (plan === 'free') return
    if (plan === user.plan) return

    const cfg = PLAN_CONFIGS[plan]
    if (!cfg.paypalButtonId) {
      // No PayPal button set up for this tier yet
      // Fallback: direct upgrade (demo for now, real when button ID is configured)
      const updated = upgradePlanLocal(user, plan)
      setUser(updated)
      setPaymentSuccess(`Upgraded to ${cfg.name}! (Demo — add PayPal button ID for real payments)`)
      return
    }

    // Show PayPal button for this plan
    setSelectedPlan(plan)
    setPaypalLoading(true)

    // Need to wait for DOM render before rendering PayPal button
    renderTimeout.current = setTimeout(() => {
      try {
        if (window.paypal) {
          window.paypal.HostedButtons({ hostedButtonId: cfg.paypalButtonId })
            .render(`#paypal-container-${plan}`)
          setPaypalLoading(false)
        } else {
          setPaypalError('PayPal SDK not loaded. Please refresh and try again.')
          setPaypalLoading(false)
        }
      } catch (e: any) {
        setPaypalError('PayPal render failed: ' + (e.message || 'Unknown error'))
        setPaypalLoading(false)
      }
    }, 300)

    // Listen for PayPal payment completion via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'paypal-payment-success') {
        const upgraded = upgradePlanLocal(user, plan)
        setUser(upgraded)
        setPaymentSuccess(`Payment successful! You are now on the ${cfg.name} plan.`)
        setSelectedPlan(null)
      }
    }
    window.addEventListener('message', handleMessage)
    // Cleanup after 5 minutes
    setTimeout(() => window.removeEventListener('message', handleMessage), 300000)
  }

  function handleManualUpgrade(plan: Plan) {
    if (!user) return
    const cfg = PLAN_CONFIGS[plan]
    const upgraded = upgradePlanLocal(user, plan)
    setUser(upgraded)
    setPaymentSuccess(`Upgraded to ${cfg.name}! Your plan is now active.`)
    setSelectedPlan(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Crown size={12} />
          Upgrade your plan
        </div>
        <h2 className="text-2xl font-bold text-foreground text-balance">Simple, transparent pricing</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto text-pretty">
          Start free, upgrade when you need more power. Secure payments via PayPal.
        </p>
      </div>

      {/* Success message */}
      {paymentSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium text-center">
          {paymentSuccess}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {PLANS.map(({ id, highlighted }) => {
          const cfg = PLAN_CONFIGS[id]
          const isCurrentPlan = user?.plan === id
          const isSelected = selectedPlan === id
          const Icon = id === 'business' ? Crown : id === 'pro' ? Zap : null

          return (
            <div
              key={id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all',
                highlighted
                  ? 'border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20'
                  : 'border-border bg-card text-foreground shadow-sm hover:shadow-md',
                isSelected && 'ring-2 ring-success ring-offset-2'
              )}
            >
              {/* Badge */}
              {cfg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-white text-primary text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">
                    {cfg.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 mt-1">
                {Icon && (
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    highlighted ? 'bg-white/20' : 'bg-primary/10'
                  )}>
                    <Icon size={14} className={highlighted ? 'text-white' : 'text-primary'} />
                  </div>
                )}
                <span className={cn('font-bold text-base', highlighted ? 'text-white' : 'text-foreground')}>
                  {cfg.name}
                </span>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className={cn('text-3xl font-extrabold', highlighted ? 'text-white' : 'text-foreground')}>
                    {cfg.price}
                  </span>
                  {id !== 'free' && (
                    <span className={cn('text-sm', highlighted ? 'text-white/70' : 'text-muted-foreground')}>
                      /{cfg.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Key features */}
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {[
                  `${cfg.dailyScans === -1 ? 'Unlimited' : cfg.dailyScans} scans/day`,
                  `History: ${cfg.historyLimit === -1 ? 'Unlimited' : cfg.historyLimit} entries`,
                  ...(cfg.allowedTools === ('all' as any) ? ['All tools unlocked'] : [`${(cfg.allowedTools as string[]).length} tools`]),
                  ...(cfg.canExport ? ['Export results'] : []),
                  ...(cfg.canBulkScan ? ['Bulk domain scan'] : []),
                  ...(cfg.hasApiKey ? ['API access key'] : []),
                  ...(cfg.hasPrioritySupport ? ['Priority support'] : []),
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className={highlighted ? 'text-white/80' : 'text-success'} />
                    <span className={highlighted ? 'text-white/90' : 'text-foreground'}>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA / PayPal button area */}
              {isSelected && cfg.paypalButtonId ? (
                <div className="space-y-2">
                  {paypalLoading && (
                    <div className="text-center text-sm py-3 text-muted-foreground">Loading PayPal...</div>
                  )}
                  {paypalError && (
                    <div className="text-center text-xs text-destructive py-2">{paypalError}</div>
                  )}
                  <div id={`paypal-container-${id}`} className="min-h-[45px]" />
                  {!paypalLoading && !paypalError && (
                    <button
                      onClick={() => handleManualUpgrade(id)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
                    >
                      Already paid? Tap here to activate
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan(id)}
                  disabled={isCurrentPlan}
                  className={cn(
                    'w-full rounded-xl py-3 text-sm font-semibold transition-all',
                    highlighted
                      ? 'bg-white text-primary hover:bg-white/90 disabled:opacity-60'
                      : isCurrentPlan
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                  )}
                >
                  {isCurrentPlan ? 'Current plan' : id === 'free' ? 'Get started free' : `Get ${cfg.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature comparison table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Full feature comparison</h3>
        </div>
        <div className="grid grid-cols-4 gap-0 border-b border-border">
          <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</div>
          {PLANS.map(({ id }) => (
            <div key={id} className={cn(
              'px-3 py-3 text-center text-xs font-bold',
              id === 'pro' ? 'bg-primary/5 text-primary' : 'text-muted-foreground'
            )}>
              {PLAN_CONFIGS[id].name}
            </div>
          ))}
        </div>
        {FEATURES.map((feat, i) => (
          <div key={i} className={cn(
            'grid grid-cols-4 gap-0 border-b border-border/50 last:border-0',
            i % 2 === 0 ? '' : 'bg-muted/30'
          )}>
            <div className="px-4 py-2.5 text-sm text-foreground">{feat.label}</div>
            {(['free', 'pro', 'business'] as Plan[]).map(plan => {
              const val = feat[plan]
              return (
                <div key={plan} className={cn('px-3 py-2.5 flex items-center justify-center', plan === 'pro' ? 'bg-primary/5' : '')}>
                  {typeof val === 'string' ? (
                    <span className="text-xs font-semibold text-foreground">{val}</span>
                  ) : val ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <X size={13} className="text-muted-foreground/40" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Payments processed securely via PayPal 🛡️ | Need help?{' '}
        <a href="https://t.me/Treacky_1" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          @Treacky_1
        </a>
      </p>
    </div>
  )
}
