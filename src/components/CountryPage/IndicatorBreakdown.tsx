import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { CountryData, TimelineEntry } from '../../types/country'

// ---------------------------------------------------------------------------
// prefers-reduced-motion helper
// ---------------------------------------------------------------------------

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDICATOR_LABELS: Record<string, string> = {
  media_freedom: 'Media Freedom',
  judicial_independence: 'Judicial Independence',
  civil_society_space: 'Civil Society Space',
  election_quality: 'Election Quality',
  executive_constraints: 'Executive Constraints',
  rhetoric_radar: 'Rhetoric Radar',
  civic_protests: 'Civic Protests',
}

const INDICATOR_KEYS = Object.keys(INDICATOR_LABELS)

const TREND_COLORS: Record<string, string> = {
  improving: '#2E7D32',
  stable: '#F9A825',
  declining: '#C62828',
  rapidly_declining: '#C62828',
}

const TREND_LABELS: Record<string, string> = {
  improving: 'Improving',
  stable: 'Stable',
  declining: 'Declining',
  rapidly_declining: 'Rapidly Declining',
}

// ---------------------------------------------------------------------------
// Trend icon
// ---------------------------------------------------------------------------

function TrendIcon({ trend }: { trend: string }) {
  const color = TREND_COLORS[trend] ?? '#6C6C70'
  if (trend === 'improving') return <TrendingUp size={12} color={color} aria-hidden="true" />
  if (trend === 'declining' || trend === 'rapidly_declining') return <TrendingDown size={12} color={color} aria-hidden="true" />
  return <Minus size={12} color={color} aria-hidden="true" />
}

// ---------------------------------------------------------------------------
// Sparkline tooltip
// ---------------------------------------------------------------------------

interface SparkPayload {
  value: number | null
  payload: { year: number; value: number | null }
}

interface SparkTooltipProps {
  active?: boolean
  payload?: SparkPayload[]
  indicatorLabel?: string
}

function SparkTooltip({ active, payload, indicatorLabel }: SparkTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  if (entry.value === null || entry.value === undefined) return null
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        borderRadius: '4px',
        padding: '6px 10px',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        fontSize: '12px',
        color: '#1C1C1E',
        pointerEvents: 'none',
      }}
    >
      {indicatorLabel && (
        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{indicatorLabel}</div>
      )}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#6C6C70', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {entry.payload.year}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: '12px' }}>
          {(entry.value as number).toFixed(1)}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IndicatorBreakdownProps {
  indicators: CountryData['indicators']
  timeline: TimelineEntry[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IndicatorBreakdown({ indicators, timeline }: IndicatorBreakdownProps) {
  const noAnimation = prefersReducedMotion()

  // Build radar data
  const radarData = INDICATOR_KEYS.map((key) => ({
    subject: INDICATOR_LABELS[key],
    value: indicators[key]?.value ?? 0,
    fullMark: 100,
  }))

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          lineHeight: 1.4,
          letterSpacing: '-0.2px',
          color: '#1A237E',
          marginBottom: '20px',
        }}
      >
        Indicator Breakdown
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Panel 1 — Radar Chart */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                  fontSize: 11,
                  fill: '#6C6C70',
                }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Indicators"
                dataKey="value"
                stroke="#1565C0"
                strokeWidth={2}
                fill="#1565C0"
                fillOpacity={0.4}
                isAnimationActive={!noAnimation}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Panel 2 — Individual Indicator List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          {INDICATOR_KEYS.map((key) => {
            const indicator = indicators[key]
            if (!indicator) return null

            const trend = indicator.trend
            const trendColor = TREND_COLORS[trend] ?? '#6C6C70'
            const trendLabel = TREND_LABELS[trend] ?? trend

            // Sparkline data: last 10 years of this indicator
            const sparkData = timeline
              .slice(-10)
              .map((t) => ({ year: t.year, value: t.indicators[key] ?? null }))

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #F2F2F7',
                }}
              >
                {/* Label */}
                <div style={{ minWidth: '140px' }}>
                  <span
                    style={{
                      fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1C1C1E',
                    }}
                  >
                    {INDICATOR_LABELS[key]}
                  </span>
                </div>

                {/* Trend badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#F2F2F7',
                    borderRadius: '2px',
                    padding: '2px 6px',
                    minWidth: '96px',
                  }}
                >
                  <TrendIcon trend={trend} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: trendColor,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                    }}
                  >
                    {trendLabel}
                  </span>
                </div>

                {/* Sparkline */}
                <LineChart width={120} height={40} data={sparkData}>
                  <Tooltip
                    content={<SparkTooltip indicatorLabel={INDICATOR_LABELS[key]} />}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trendColor}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={!noAnimation}
                  />
                </LineChart>

                {/* Current score */}
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    fontSize: '13px',
                    color: '#1C1C1E',
                    minWidth: '36px',
                    textAlign: 'right',
                  }}
                >
                  {indicator.value.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
