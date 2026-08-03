'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill } from '../scan-ui'

export function EmailVerifierView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [email, setEmail] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const handleRun = () => run('email', email)
  const isValid = result?.fields?.['Valid Format'] === 'Yes'
  const mxOk = result?.fields?.['MX Records Found'] === 'Yes'
  const copyText = result ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="Email Verifier" subtitle="Validate email format, check MX records, and detect disposable emails" /><InputCard><div className="mb-1.5"><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRun() }} placeholder="user@example.com" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" spellCheck={false} autoCapitalize="none" autoCorrect="off" /></div></InputCard><PrimaryBtn loading={loading} onClick={handleRun} className="mb-4">Verify Email</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && (<><div className="mb-3 flex gap-2"><Pill variant={isValid ? 'success' : 'error'}>{isValid ? 'FORMAT VALID' : 'INVALID'}</Pill><Pill variant={mxOk ? 'success' : 'warning'}>{mxOk ? 'MX OK' : 'NO MX'}</Pill></div><ResultsCard title="Email Verification Results">{Object.entries(result.fields).map(([k, v]) => (<KvRow key={k} label={k} value={v} />))}<CopyButton text={copyText} /></ResultsCard></>)}</PageWrapper>)
}