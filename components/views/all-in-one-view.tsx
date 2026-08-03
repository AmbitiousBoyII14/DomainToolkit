'use client'
import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton } from '../scan-ui'
export function AllInOneView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState(''); const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const copyText = result ? Object.entries(result.fields).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="All-In-One Scan" subtitle="DNS · WHOIS · SSL · HTTP · Security — all in one" /><InputCard><DomainInput value={host} onChange={setHost} onScanStart={() => run('all-in-one', host)} /></InputCard><PrimaryBtn loading={loading} onClick={() => run('all-in-one', host)} className="mb-4">Run Full Scan</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && <ResultsCard title="Complete Results">{Object.entries(result.fields).map(([k,v]) => <KvRow key={k} label={k} value={v} />)}<CopyButton text={copyText} /></ResultsCard>}</PageWrapper>)
}