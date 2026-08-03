'use client'
import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import { PageWrapper, PageHeading, InputCard, DomainInput, ToolSelect, PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton } from '../scan-ui'
const TOOLS = [{ value: 'dns', label: 'DNS Lookup' },{ value: 'whois', label: 'WHOIS Lookup' },{ value: 'http', label: 'HTTP Headers' },{ value: 'subdomains', label: 'Subdomain Finder' }]
export function DomainToolsView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState(''); const [tool, setTool] = useState('dns'); const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)
  const copyText = result ? Object.entries(result.fields).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
  return (<PageWrapper><PageHeading title="Domain Tools" subtitle="DNS, WHOIS, HTTP headers, subdomain discovery" /><InputCard><DomainInput value={host} onChange={setHost} onScanStart={() => run(tool, host)} /><div className="mt-4"><ToolSelect value={tool} onChange={setTool} options={TOOLS} label="Tool" /></div></InputCard><PrimaryBtn loading={loading} onClick={() => run(tool, host)} className="mb-4">Run Scan</PrimaryBtn>{loading && <ProgressBar value={progress} label={progressLabel} />}{error && <ErrorState message={error} />}{result && <ResultsCard title={result.type || 'Results'}>{Object.entries(result.fields).map(([k,v]) => <KvRow key={k} label={k} value={v} />)}<CopyButton text={copyText} /></ResultsCard>}</PageWrapper>)
}