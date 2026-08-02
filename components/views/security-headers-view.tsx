'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput,
  PrimaryBtn, ProgressBar, ResultsCard, ErrorState, CopyButton, Pill,
} from '../scan-ui'
import { cn } from '@/lib/utils'

export function SecurityHeadersView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run('security-headers', host)

  const scoreStr = result?.fields['Score']
  const score = scoreStr ? parseInt(scoreStr, 10) : 0
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F'
  const gradeColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning-foreground' : 'text-destructive'

  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading
        title="Security Headers"
        subtitle="CSP, HSTS, X-Frame-Options, XSS protection, CORS and cookie flags"
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
        Scan Headers
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error   && <ErrorState message={error} />}

      {result && (
        <>
          {/* Score card */}
          <div className="bg-card border border-border rounded-xl p-5 mb-3 flex items-center gap-5">
            <div className="text-center shrink-0">
              <p className={cn('text-5xl font-bold leading-none', gradeColor)}>{grade}</p>
              <p className="text-xs text-muted-foreground mt-1">{score} / 100</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive')}
                  style={{ width: `${score}%` }}
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Security score based on present headers</p>
            </div>
          </div>

          {/* Headers table */}
          <ResultsCard title="Security Headers">
            {Object.entries(result.fields)
              .filter(([k]) => k !== 'Score' && k !== 'Domain')
              .map(([k, v]) => {
                const present = v !== 'Missing' && v !== '' && v !== 'Not set'
                return (
                  <div key={k} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground flex-1 min-w-0">{k}</span>
                    <Pill variant={present ? 'success' : 'error'}>
                      {present ? 'PRESENT' : 'MISSING'}
                    </Pill>
                  </div>
                )
              })}
            <CopyButton text={copyText} />
          </ResultsCard>
        </>
      )}
    </PageWrapper>
  )
}
