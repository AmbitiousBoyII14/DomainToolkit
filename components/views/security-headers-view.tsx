'use client'
import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill } from '../scan-ui'
export function SecurityHeadersView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState(''); const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const score = parseInt(result?.fields?.['Score'] ?? '0')
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F'
  const copyText = result ? Object.entries(result.fields).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="Security Headers" subtitle="Audit 10 critical HTTP security headers" /><InputCard><DomainInput value={host} onChange={setHost} onScanStart={() => run('security-headers', host)} /></InputCard><PrimaryBtn loading={loading} onClick={() => run('security-headers', host)} className="mb-4">Audit Headers</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && (<><div className="mb-3 flex gap-2"><Pill variant={score >= 60 ? 'success' : 'warning'}>SCORE: {score}/100</Pill><Pill variant="primary">GRADE: {grade}</Pill></div><ResultsCard title="Header Audit">{Object.entries(result.fields).map(([k,v]) => <KvRow key={k} label={k} value={v} />)}<CopyButton text={copyText} /></ResultsCard></>)}</PageWrapper>)
}