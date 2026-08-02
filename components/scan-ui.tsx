'use client'

import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'

// ---- Page wrapper ----
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      {children}
    </div>
  )
}

// ---- Page heading ----
export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ---- Input card ----
export function InputCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-3 shadow-sm">
      {children}
    </div>
  )
}

// ---- Domain input ----
interface DomainInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
}
export function DomainInput({ value, onChange, placeholder = 'example.com', label = 'Domain' }: DomainInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
      />
    </div>
  )
}

// ---- Select / tool picker ----
interface ToolSelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
}
export function ToolSelect({ value, onChange, options, label = 'Tool' }: ToolSelectProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ---- Primary button ----
interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
}
export function PrimaryBtn({ loading, children, className, ...props }: PrimaryBtnProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        'w-full rounded-xl bg-primary text-primary-foreground font-semibold text-sm py-3 transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? 'Running...' : children}
    </button>
  )
}

// ---- Progress bar ----
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="mb-4">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {label && <p className="text-xs text-muted-foreground mt-1.5">{label}</p>}
    </div>
  )
}

// ---- Results card ----
export function ResultsCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-3 overflow-hidden">
      {title && (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <span className="w-1 h-4 rounded-full bg-primary shrink-0" aria-hidden="true" />
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
      )}
      <div className="divide-y divide-border">
        {children}
      </div>
    </div>
  )
}

// ---- KV row ----
export function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span className="text-xs text-muted-foreground min-w-[130px] shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground font-mono break-all flex-1">{value}</span>
    </div>
  )
}

// ---- Status pill ----
type PillVariant = 'success' | 'error' | 'warning' | 'primary' | 'muted'
export function Pill({ children, variant = 'primary' }: { children: React.ReactNode; variant?: PillVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variant === 'success' && 'bg-success/15 text-success',
        variant === 'error'   && 'bg-destructive/15 text-destructive',
        variant === 'warning' && 'bg-warning/15 text-warning-foreground',
        variant === 'primary' && 'bg-primary/10 text-primary',
        variant === 'muted'   && 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

// ---- Copy button ----
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [text])

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-4 py-2.5"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy results'}
    </button>
  )
}

// ---- Error state ----
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-3">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

// ---- Empty state ----
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <span className="text-muted-foreground text-xl" aria-hidden="true">--</span>
      </div>
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
