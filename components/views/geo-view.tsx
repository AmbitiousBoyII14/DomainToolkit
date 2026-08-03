'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton } from '../scan-ui'

export function GeoView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const handleRun = () => run('geo', host)
  const copyText = result ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="Geo / IP Lookup" subtitle="Find the physical location, ISP, and network info for any domain or IP address" /><InputCard><DomainInput value={host} onChange={setHost} label="Domain or IP Address" placeholder="example.com or 8.8.8.8" onScanStart={handleRun} /></InputCard><PrimaryBtn loading={loading} onClick={handleRun} className="mb-4">Lookup Location</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && (<ResultsCard title="Geo / IP Results">{Object.entries(result.fields).map(([k, v]) => (<KvRow key={k} label={k} value={v} />))}<CopyButton text={copyText} /></ResultsCard>)}</PageWrapper>)
}