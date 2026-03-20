import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { CountryData } from '../../types/country'
import { getCountryInsights, type AIInsights } from '../../services/aiInsightsService'

interface Props {
  country: CountryData
}

// ---------------------------------------------------------------------------
// Skeleton loader — no animated pulse when prefers-reduced-motion is active
// ---------------------------------------------------------------------------

function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: '14px',
        borderRadius: '3px',
        backgroundColor: '#E5E5EA',
        width,
        // animation is suppressed by @media (prefers-reduced-motion: reduce)
        // defined in index.css via the .animate-pulse class override
      }}
      className="ai-skeleton-line"
    />
  )
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading AI insights" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SkeletonLine width="60%" />
      <SkeletonLine />
      <SkeletonLine width="85%" />
      <SkeletonLine width="40%" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

const confidenceColor: Record<AIInsights['confidence'], string> = {
  high: '#1B5E20',
  medium: '#E65100',
  low: '#C62828',
}

const confidenceBg: Record<AIInsights['confidence'], string> = {
  high: '#E8F5E9',
  medium: '#FFF3E0',
  low: '#FFEBEE',
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function AIInsightsPanel({ country }: Props) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setInsights(null)
    setError(null)

    getCountryInsights(country)
      .then((result) => {
        if (!cancelled) setInsights(result)
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load AI insights. Please try again.')
      })

    return () => {
      cancelled = true
    }
  }, [country.iso])

  return (
    <section
      aria-labelledby="ai-insights-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
        marginBottom: '24px',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <Sparkles size={16} aria-hidden="true" style={{ color: '#1A237E', flexShrink: 0 }} />
        <p
          id="ai-insights-heading"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: '#6C6C70',
            margin: 0,
          }}
        >
          AI Insights
        </p>
      </div>

      {/* States */}
      {error && (
        <p role="alert" style={{ fontSize: '14px', color: '#C62828', margin: 0 }}>
          {error}
        </p>
      )}

      {!insights && !error && <LoadingSkeleton />}

      {insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Headline */}
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.2px',
              color: '#1A237E',
              margin: 0,
            }}
          >
            {insights.headline}
          </h3>

          {/* Analysis paragraph */}
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#1C1C1E',
              margin: 0,
            }}
          >
            {insights.analysis}
          </p>

          {/* Watch-points */}
          {insights.watchPoints.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: '#6C6C70',
                  marginBottom: '8px',
                  marginTop: 0,
                }}
              >
                Watch Points
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {insights.watchPoints.map((point, i) => (
                  <li
                    key={i}
                    style={{ fontSize: '14px', lineHeight: 1.5, color: '#3A3A3C' }}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence disclaimer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #F2F2F7',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: confidenceColor[insights.confidence],
                backgroundColor: confidenceBg[insights.confidence],
                borderRadius: '2px',
                padding: '2px 6px',
              }}
            >
              {insights.confidence} confidence
            </span>
            <span style={{ fontSize: '12px', color: '#6C6C70' }}>
              AI-generated summary · not a substitute for expert analysis
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
