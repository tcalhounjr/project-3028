import React from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { TimelineEntry, CountryEvent } from '../../types/country'

// ---------------------------------------------------------------------------
// prefers-reduced-motion helper
// ---------------------------------------------------------------------------

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface EventInfo {
  description: string
  affected_indicators: string[]
}

interface ChartDataPoint {
  year: number
  composite: number
  events?: EventInfo[]
}

interface TooltipPayload {
  value: number
  dataKey: string
  payload: ChartDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const score = payload[0]?.value ?? 0
  const events = payload[0]?.payload?.events

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        borderRadius: '4px',
        padding: '10px 14px',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
        color: '#1C1C1E',
        minWidth: '160px',
        maxWidth: '260px',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: events && events.length > 0 ? '8px' : 0 }}>
        <span style={{ color: '#6C6C70', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Score
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: '13px' }}>
          {score.toFixed(1)}
        </span>
      </div>
      {events && events.length > 0 && (
        <div style={{ borderTop: '1px solid #F2F2F7', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ color: '#6C6C70', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Events
          </span>
          {events.map((evt, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#1C1C1E', lineHeight: 1.4 }}>
              {evt.description}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StressTimelineProps {
  timeline: TimelineEntry[]
  events?: CountryEvent[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StressTimeline({ timeline, events }: StressTimelineProps) {
  const noAnimation = prefersReducedMotion()

  // Build a map of year → event info for merging into chartData
  const eventsByYear = new Map<number, EventInfo[]>()
  const eventYears: number[] = []
  if (events && events.length > 0) {
    for (const evt of events) {
      const yr = parseInt(evt.date.split('-')[0], 10)
      if (!isNaN(yr)) {
        if (!eventsByYear.has(yr)) {
          eventsByYear.set(yr, [])
          eventYears.push(yr)
        }
        eventsByYear.get(yr)!.push({
          description: evt.description,
          affected_indicators: evt.affected_indicators,
        })
      }
    }
  }

  const chartData: ChartDataPoint[] = timeline.map((t) => ({
    year: t.year,
    composite: t.composite,
    ...(eventsByYear.has(t.year) ? { events: eventsByYear.get(t.year) } : {}),
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
          marginBottom: '16px',
        }}
      >
        Democratic Stress Timeline
      </h2>

      <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '600px' }}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={true} vertical={false} stroke="#F2F2F7" />

          <XAxis
            dataKey="year"
            tick={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif', fontSize: 11, fill: '#6C6C70' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif', fontSize: 11, fill: '#6C6C70' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />

          {/* Band overlays — cast to any to work around recharts 3.x generic inference for fill prop */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ReferenceArea y1={0} y2={40} {...{ fill: '#FFEBEE', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ReferenceArea y1={41} y2={65} {...{ fill: '#FFFDE7', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ReferenceArea y1={66} y2={100} {...{ fill: '#ECEFF1', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />

          {/* Event reference lines */}
          {eventYears.map((yr) => (
            <ReferenceLine
              key={yr}
              x={yr}
              stroke="#C7C7CC"
              strokeDasharray="4 2"
              label={{ value: 'E', fill: '#6C6C70', fontSize: 10 }}
            />
          ))}

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="composite"
            stroke="#1565C0"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!noAnimation}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  )
}
