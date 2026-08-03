'use client'
import { useState } from 'react'
import { PaywallGate } from '../paywall-gate'
import { PageWrapper, PageHeading, InputCard, BulkDomainInput, PrimaryBtn, ProgressBar, ErrorState, Pill } from '../scan-ui'
import { useAuth, canBulkScan } from '@/lib/auth'

interface BulkResult { domain: string; tool: string; success: boolean; fields: Record<string, string> }
export function BulkScanView({ onScanSaved }: { onScanSaved?: () => void }) {
  const { user } = useAuth(); const plan = user?.plan ?? 'free'; const allowed = canBulkScan(plan)
  const [domains, setDomains] = useState(''); const [tool, setTool] = useState('all-in-one')
  const [loading, setLoading] = useState(false); const [results, setResults] = useState<BulkResult[]>([])
  const [error, setError] = useState(''); const [progress, setProgress] = useState(0)

  const handleRun = async () => {
    if (!allowed) return
    const list = domains.split('\n').map(d => d.trim()).filter(d => d.length > 0)
    if (list.length === 0) { setError('Enter at least one domain.'); return }
    if (list.length > 100) { setError('Maximum 100 domains per bulk scan.'); return }
    setLoading(true); setError(''); setResults([]); setProgress(0)
    const allResults: BulkResult[] = []
    for (let i = 0; i < list.length; i++) {
      try {
        const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool, host: list[i] }) })
        const data = await res.json()
        allResults.push({ domain: list[i], tool, success: !data.error, fields: data.fields || {} })
      } catch { allResults.push({ domain: list[i], tool, success: false, fields: {} }) }
      setProgress(Math.round(((i + 1) / list.length) * 100))
      setResults([...allResults])
    }
    setLoading(false); onScanSaved?.()
  }

  const domainList = domains.split('\n').filter(d => d.trim())
  return (<PaywallGate toolId="bulk-scan"><PageWrapper><PageHeading title="Bulk Scan (Pro)" subtitle="Scan up to 100 domains at once" /><InputCard><BulkDomainInput value={domains} onChange={setDomains} /><div className="mt-4"><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scan Mode</label><select value={tool} onChange={e => setTool(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"><option value="all-in-one">All-In-One</option><option value="dns">DNS Lookup</option><option value="ssl">SSL / TLS</option><option value="http">HTTP Headers</option></select></div></InputCard><PrimaryBtn loading={loading} onClick={handleRun} className="mb-4">Scan {domainList.length || 0} Domains</PrimaryBtn>{loading && <ProgressBar value={progress} label={`${results.length}/${domainList.length} scanned`} />}{error && <ErrorState message={error} />}{results.length > 0 && (<div className="space-y-2">{results.map((r, i) => (<div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="font-mono text-sm font-semibold">{r.domain}</span><Pill variant={r.success ? 'success' : 'error'}>{r.success ? 'OK' : 'FAIL'}</Pill></div>{r.success && Object.keys(r.fields).length > 0 && (<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">{Object.entries(r.fields).slice(0, 6).map(([k,v]) => (<div key={k} className="flex gap-1"><span className="text-muted-foreground">{k}:</span><span className="font-mono truncate">{v}</span></div>))}</div>)}</div>))}</div>)}</PageWrapper></PaywallGate>)
}