'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton,
} from '../scan-ui'

// Groups fields into labelled sections
function detectSection(key: string): string {
  const k = key.toLowerCase()
  if (['domain', 'ip address', 'nameservers', 'mx records', 'asn', 'reverse dns'].includes(k)) return 'General'
  if (k.startsWith('a record') || k.startsWith('aaaa') || k.includes('dns') || k.includes('record') || k === 'cname' || k === 'ns' || k === 'soa' || k === 'mx') return 'DNS'
  if (k.includes('ssl') || k.includes('tls') || k.includes('cert') || k.includes('cipher') || k.includes('issuer') || k.includes('subject') || k.includes('expir') || k.includes('trusted')) return 'SSL / TLS'
  if (k.includes('csp') || k.includes('hsts') || k.includes('x-frame') || k.includes('xss') || k.includes('referrer') || k.includes('score') || k.includes('content-type-options')) return 'Security'
  if (k.includes('status') || k.includes('server') || k.includes('content') || k.includes('https') || k.includes('redirect') || k.includes('header')) return 'HTTP'
  if (k.includes('provider') || k.includes('cdn') || k.includes('cloud') || k.includes('host')) return 'Hosting'
  if (k.includes('ping') || k.includes('latency') || k.includes('port')) return 'Network'
  return 'General'
}

const SECTION_ORDER = ['General', 'DNS', 'HTTP', 'SSL / TLS', 'Security', 'Hosting', 'Network']

export function AllInOneView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run('all-in-one', host)

  // Group fields into sections
  const sections: Record<string, Record<string, string>> = {}
  if (result) {
    for (const [k, v] of Object.entries(result.fields)) {
      const section = detectSection(k)
      if (!sections[section]) sections[section] = {}
      sections[section][k] = v
    }
  }

  const orderedSections = [
    ...SECTION_ORDER.filter(s => sections[s]),
    ...Object.keys(sections).filter(s => !SECTION_ORDER.includes(s)),
  ]

  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading
        title="All-In-One Scan"
        subtitle="Runs every supported check in one pass — DNS, HTTP, SSL, Security &amp; Hosting"
      />

      <InputCard>
        <DomainInput value={host} onChange={setHost} />
      </InputCard>

      <PrimaryBtn
        loading={loading}
        onClick={handleRun}
        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRun() }}
        className="mb-4"
      >
        Run All Checks
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error   && <ErrorState message={error} />}

      {result && orderedSections.map(section => (
        <ResultsCard key={section} title={section}>
          {Object.entries(sections[section]).map(([k, v]) => (
            <KvRow key={k} label={k} value={v} />
          ))}
        </ResultsCard>
      ))}

      {result && (
        <div className="bg-card border border-border rounded-xl mt-1">
          <CopyButton text={copyText} />
        </div>
      )}
    </PageWrapper>
  )
}
