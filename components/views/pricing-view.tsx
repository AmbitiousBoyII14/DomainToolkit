'use client'

import { useState } from 'react'
import { Check, Crown, Zap, X, ExternalLink, BadgePercent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, PLAN_CONFIGS, type Plan, upgradePlanLocal } from '@/lib/auth'

interface Feature { label: string; free: boolean | string; pro: boolean | string; business: boolean | string }
const FEATURES: Feature[] = [
  { label: 'Daily scans', free: '5 scans', pro: '100 scans', business: 'Unlimited' },
  { label: 'Domain Tools (DNS, WHOIS, HTTP)', free: true, pro: true, business: true },
  { label: 'SSL / TLS checker', free: true, pro: true, business: true },
  { label: 'WebSocket detection', free: true, pro: true, business: true },
  { label: 'All-In-One Scan', free: false, pro: true, business: true },
  { label: 'Network Tools (Ping, Ports)', free: false, pro: true, business: true },
  { label: 'Hosting / CDN detection', free: false, pro: true, business: true },
  { label: 'Security Headers audit', free: false, pro: true, business: true },
  { label: 'Scan history', free: '10 entries', pro: '500 entries', business: 'Unlimited' },
  { label: 'Favorites', free: false, pro: true, business: true },
  { label: 'Export results', free: false, pro: true, business: true },
  { label: 'Bulk scan (all modes)', free: false, pro: true, business: true },
  { label: 'PDF export', free: false, pro: false, business: true },
  { label: 'API access key', free: false, pro: false, business: true },
  { label: 'Priority support', free: false, pro: false, business: true },
]

interface PlanInfo { id: Plan; highlighted: boolean }
const PLANS: PlanInfo[] = [
  { id: 'free', highlighted: false },
  { id: 'pro', highlighted: true },
  { id: 'business', highlighted: false },
]

export function PricingView() {
  const { user, setUser, openAuthModal } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState('')

  const showFirstPurchaseDiscount = user && !user.firstPurchaseUsed

  function handleSelectPlan(plan: Plan) {
    setPaymentSuccess('')
    if (!user) { openAuthModal('signup'); return }
    if (plan === 'free') return
    if (plan === user.plan) return

    setSelectedPlan(plan)

    // Open PayPal hosted button in new tab
    const cfg = PLAN_CONFIGS[plan]
    const paypalUrl = 'https://www.paypal.com/ncp/payment/' + cfg.paypalButtonId
    window.open(paypalUrl, '_blank', 'noopener,noreferrer')
  }

  function handlePaymentComplete(plan: Plan) {
    if (!user) return
    const cfg = PLAN_CONFIGS[plan]
    const updated = upgradePlanLocal(user, plan)
    setUser(updated)
    setPaymentSuccess('Upgraded to ' + cfg.name + '! ' + (showFirstPurchaseDiscount ? '50% off applied!' : 'Welcome aboard!'))
    setSelectedPlan(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Crown size={12} /> Upgrade your plan
        </div>
        <h2 className="text-2xl font-bold text-foreground">Simple, transparent pricing</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Start free, upgrade when you need more power. Secure via PayPal.
        </p>
        {showFirstPurchaseDiscount && (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
            <BadgePercent size={12} /> 50% OFF your first month!
          </div>
        )}
      </div>

      {paymentSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium text-center">{paymentSuccess}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {PLANS.map(({ id, highlighted }) => {
          const cfg = PLAN_CONFIGS[id]
          const isCurrentPlan = user?.plan === id
          const Icon = id === 'business' ? Crown : id === 'pro' ? Zap : null
          const showDiscount = showFirstPurchaseDiscount && id !== 'free'
          const displayPrice = showDiscount ? cfg.firstPrice : cfg.price

          return (
            <div key={id} className={cn(
              'relative flex flex-col rounded-2xl border p-6 transition-all',
              highlighted ? 'border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20' : 'border-border bg-card text-foreground shadow-sm hover:shadow-md'
            )}>
              {cfg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-white text-primary text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">{cfg.badge}</span>
                </div>
              )}
              {showDiscount && (
                <div className="absolute -top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full bg-success text-white text-[10px] font-bold shadow-sm whitespace-nowrap">50% OFF</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 mt-1">
                {Icon && <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', highlighted ? 'bg-white/20' : 'bg-primary/10')}><Icon size={14} className={highlighted ? 'text-white' : 'text-primary'} /></div>}
                <span className={cn('font-bold text-base', highlighted ? 'text-white' : 'text-foreground')}>{cfg.name}</span>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  {showDiscount ? (
                    <>
                      <span className={cn('text-3xl font-extrabold', highlighted ? 'text-success' : 'text-success')}>{displayPrice}</span>
                      <span className={cn('text-sm line-through opacity-50', highlighted ? 'text-white/50' : 'text-muted-foreground')}>{cfg.price}</span>
                    </>
                  ) : (
                    <span className={cn('text-3xl font-extrabold', highlighted ? 'text-white' : 'text-foreground')}>{displayPrice}</span>
                  )}
                  {id !== 'free' && <span className={cn('text-sm', highlighted ? 'text-white/70' : 'text-muted-foreground')}>/{cfg.period}</span>}
                </div>
              </div>

              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {[`${cfg.dailyScans === -1 ? 'Unlimited' : cfg.dailyScans} scans/day`, `History: ${cfg.historyLimit === -1 ? 'Unlimited' : cfg.historyLimit} entries`,
                  ...(cfg.allowedTools === ('all' as any) ? ['All tools unlocked'] : [`${(cfg.allowedTools as string[]).length} tools`]),
                  ...(cfg.canExport ? ['Export results'] : []), ...(cfg.canBulkScan ? ['Bulk scan all modes'] : []),
                  ...(cfg.hasApiKey ? ['API access'] : []), ...(cfg.hasPrioritySupport ? ['Priority support'] : [])
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><Check size={14} className={highlighted ? 'text-white/80' : 'text-success'} /><span className={highlighted ? 'text-white/90' : 'text-foreground'}>{feat}</span></li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button disabled className="w-full rounded-xl py-3 text-sm font-semibold bg-muted text-muted-foreground cursor-default">Current plan</button>
              ) : id === 'free' ? (
                <button onClick={() => handleSelectPlan('free')} className="w-full rounded-xl py-3 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                  Get started free
                </button>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => handleSelectPlan(id)} className={cn(
                    'w-full rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    highlighted ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-primary-foreground hover:opacity-90'
                  )}>
                    <ExternalLink size={14} /> Pay with PayPal
                    {showDiscount && <span className="text-[10px] opacity-80">({displayPrice})</span>}
                  </button>
                  {selectedPlan === id && (
                    <button onClick={() => handlePaymentComplete(id)} className="w-full rounded-xl py-2 text-xs text-success font-semibold bg-success/10 hover:bg-success/20 transition-colors">
                      ✓ I've completed payment — activate now
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature comparison */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-bold text-sm text-foreground">Full feature comparison</h3></div>
        <div className="grid grid-cols-4 gap-0 border-b border-border">
          <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</div>
          {PLANS.map(({ id }) => <div key={id} className={cn('px-3 py-3 text-center text-xs font-bold', id === 'pro' ? 'bg-primary/5 text-primary' : 'text-muted-foreground')}>{PLAN_CONFIGS[id].name}</div>)}
        </div>
        {FEATURES.map((feat, i) => (
          <div key={i} className={cn('grid grid-cols-4 gap-0 border-b border-border/50 last:border-0', i % 2 === 0 ? '' : 'bg-muted/30')}>
            <div className="px-4 py-2.5 text-sm text-foreground">{feat.label}</div>
            {(['free', 'pro', 'business'] as Plan[]).map(plan => {
              const val = feat[plan]
              return <div key={plan} className={cn('px-3 py-2.5 flex items-center justify-center', plan === 'pro' ? 'bg-primary/5' : '')}>
                {typeof val === 'string' ? <span className="text-xs font-semibold text-foreground">{val}</span> : val ? <Check size={14} className="text-success" /> : <X size={13} className="text-muted-foreground/40" />}
              </div>
            })}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Payments via PayPal 🛡️ | Need help? <a href="https://t.me/Treacky_1" target="_blank" rel="noreferrer" className="text-primary hover:underline">@Treacky_1</a>
      </p>
    </div>
  )
}
