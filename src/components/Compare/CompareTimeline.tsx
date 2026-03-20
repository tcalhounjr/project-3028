import React from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CountryData } from '../../types/country'

// ---------------------------------------------------------------------------
// Country palette — 3 distinct colors matching spec + Civic Vigil navy.
// ---------------------------------------------------------------------------

export const COMPARE_COLORS: [string, string, string] = ['#1A237E', '#C62828', '#2E7D32']

// ---------------------------------------------------------------------------
// Build merged chart data: [{year, [iso]: composite, ...}]
// ---------------------------------------------------------------------------

interface ChartRow {
  year: number
  [iso: string]: number
}

function buildChartData(countries: CountryData[]): ChartRow[] {
  if (countries.length === 0) return []

  // Collect all years present across all countries
  const allYears = Array.from(
    new Set(countries.flatMap((c) => c.timeline.map((t) => t.year)))
  ).sort((a, b) => a - b)

  return allYears.map((year) => {
    const row: ChartRow = { year }
    for (const country of countries) {
      const entry = country.timeline.find((t) => t.year === year)
      if (entry !== undefined) {
        row[country.iso] = entry.composite
      }
    }
    return row
  })
}

// ---------------------------------------------------------------------------
// Custom multi-country tooltip
// ---------------------------------------------------------------------------

interface TooltipProps {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: number
}

function CompareTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        borderRadius: '4px',
        padding: '10px 14px',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        fontSize: '13px',
        minWidth: '160px',
      }}
    >
      <div style={{ fontWeight: 700, color: '#1A237E', marginBottom: '8px' }}>{label}</div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '4px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '10px',
                height: '3px',
                backgroundColor: entry.color,
                borderRadius: '1px',
              }}
            />
            <span style={{ color: '#1C1C1E', fontWeight: 500 }}>{entry.name}</span>
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontSize: '12px',
              color: entry.color,
              fontWeight: 700,
            }}
          >
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompareTimelineProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompareTimeline({ countries }: CompareTimelineProps) {
  const chartData = buildChartData(countries)

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            color: '#1A237E',
            margin: 0,
          }}
        >
          Composite Score Timeline
        </h2>
        {/* Zone legend */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {[
            { label: 'Safe (66–100)', color: '#ECEFF1', textColor: '#546E7A' },
            { label: 'Watch (41–65)', color: '#FFFDE7', textColor: '#E65100' },
            { label: 'Danger (0–40)', color: '#FFEBEE', textColor: '#C62828' },
          ].map((zone) => (
            <div key={zone.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: zone.color,
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <span
                style={{
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: zone.textColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                {zone.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '560px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal vertical={false} stroke="#F2F2F7" />
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

              {/* Band overlays — cast to any to work around recharts 3.x generic inference */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ReferenceArea y1={0} y2={41} {...{ fill: '#FFEBEE', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ReferenceArea y1={40} y2={66} {...{ fill: '#FFFDE7', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ReferenceArea y1={65} y2={100} {...{ fill: '#ECEFF1', fillOpacity: 0.5, ifOverflow: 'extendDomain' } as any} />

              <Tooltip content={<CompareTooltip />} />

              <Legend
                wrapperStyle={{
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                  fontSize: '12px',
                  paddingTop: '12px',
                }}
              />

              {countries.map((country, idx) => (
                <Line
                  key={country.iso}
                  type="monotone"
                  dataKey={country.iso}
                  name={country.name}
                  stroke={COMPARE_COLORS[idx] ?? COMPARE_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabular fallback for screen readers */}
      <table
        aria-label="Composite score data"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        <thead>
          <tr>
            <th scope="col">Year</th>
            {countries.map((c) => (
              <th key={c.iso} scope="col">{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              {countries.map((c) => (
                <td key={c.iso}>{row[c.iso] !== undefined ? row[c.iso].toFixed(1) : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
