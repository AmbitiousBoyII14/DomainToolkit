'use client'
import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill } from '../scan-ui'
export function SslView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState(''); const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const trusted = result?.fields?.['Trusted'] === 'Yes'
  const copyText = result ? Object.entries(result.fields).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="SSL / TLS Inspector" subtitle="Certificate chain, TLS version, cipher, expiry, trust" /><InputCard><DomainInput value={host} onChange={setHost} onScanStart={() => run('ssl', host)} /></InputCard><PrimaryBtn loading={loading} onClick={() => run('ssl', host)} className="mb-4">Inspect Certificate</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && (<><div className="mb-3"><Pill variant={trusted ? 'success' : 'error'}>{trusted ? 'TRUSTED' : 'UNTRUSTED'}</Pill></div><ResultsCard title="Certificate Details">{Object.entries(result.fields).map(([k,v]) => <KvRow key={k} label={k} value={v} />)}<CopyButton text={copyText} /></ResultsCard></>)}</PageWrapper>)
}