'use client'
import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton } from '../scan-ui'
export function HostingView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState(''); const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const copyText = result ? Object.entries(result.fields).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="Hosting / CDN Detection" subtitle="Detect provider & CDN from HTTP headers" /><InputCard><DomainInput value={host} onChange={setHost} onScanStart={() => run('hosting', host)} /></InputCard><PrimaryBtn loading={loading} onClick={() => run('hosting', host)} className="mb-4">Detect Provider</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && <ResultsCard title="Hosting Info">{Object.entries(result.fields).map(([k,v]) => <KvRow key={k} label={k} value={v} />)}<CopyButton text={copyText} /></ResultsCard>}</PageWrapper>)
}