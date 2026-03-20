import React from 'react'
import type { CountryData } from '../../types/country'
import { INDICATOR_LABELS } from '../../constants/indicators'
import { toW40Url } from '../../utils/flagUrl'

// ---------------------------------------------------------------------------
// getCurrentValue — latest snapshot value for a given indicator.
// Checks the indicators record first (current snapshot), falls back to the
// latest_year timeline entry.
// ---------------------------------------------------------------------------

function getCurrentValue(country: CountryData, indicatorKey: string): number | null {
  const ind = country.indicators[indicatorKey]
  if (ind !== undefined) return ind.value

  const entry = country.timeline.find((t) => t.year === country.latest_year)
  if (!entry) return null
  const val = entry.indicators[indicatorKey]
  return val !== undefined ? val : null
}

// ---------------------------------------------------------------------------
// getDelta — year-over-year delta for a given indicator.
// Returns null if timeline data is insufficient.
// ---------------------------------------------------------------------------

function getYearOverYearDelta(country: CountryData, indicatorKey: string): number | null {
  const latestYear = country.latest_year
  const currentEntry = country.timeline.find((t) => t.year === latestYear)
  const priorEntry = country.timeline.find((t) => t.year === latestYear - 1)

  if (!currentEntry || !priorEntry) return null

  const current = currentEntry.indicators[indicatorKey]
  const prior = priorEntry.indicators[indicatorKey]

  if (current === undefined || prior === undefined) return null

  return current - prior
}

// ---------------------------------------------------------------------------
// getCrossCountryDelta — deviation from the cross-country mean for a given
// indicator. Used when year-over-year delta is unavailable.
// ---------------------------------------------------------------------------

function getCrossCountryDelta(
  country: CountryData,
  indicatorKey: string,
  allCountries: CountryData[],
): number | null {
  const value = getCurrentValue(country, indicatorKey)
  if (value === null) return null

  const allValues = allCountries
    .map((c) => getCurrentValue(c, indicatorKey))
    .filter((v): v is number => v !== null)

  if (allValues.length === 0) return null

  const mean = allValues.reduce((sum, v) => sum + v, 0) / allValues.length
  return value - mean
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IndicatorTableProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IndicatorTable({ countries }: IndicatorTableProps) {
  const indicatorKeys = Object.keys(INDICATOR_LABELS)

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflowX: 'auto',
      }}
    >
      <table
        aria-label="Indicator comparison table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#F5F7FA',
              borderBottom: '2px solid #E8EAF0',
            }}
          >
            {/* Indicator label column header */}
            <th
              scope="col"
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 700,
                color: '#6C6C70',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                whiteSpace: 'nowrap',
                minWidth: '160px',
              }}
            >
              Indicator
            </th>

            {/* One column per selected country */}
            {countries.map((country) => (
              <th
                key={country.iso}
                scope="col"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1A237E',
                  minWidth: '140px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={toW40Url(country.flag_url)}
                    alt={`Flag of ${country.name}`}
                    width={40}
                    height={27}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '2px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='27' viewBox='0 0 40 27'%3E%3Crect width='40' height='27' fill='%23e5e7eb'/%3E%3C/svg%3E"
                    }}
                  />
                  <span>{country.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {indicatorKeys.map((key, rowIdx) => (
            <tr
              key={key}
              style={{
                borderBottom: rowIdx < indicatorKeys.length - 1 ? '1px solid #F2F2F7' : 'none',
              }}
            >
              {/* Indicator name */}
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1C1C1E',
                  whiteSpace: 'nowrap',
                }}
              >
                {INDICATOR_LABELS[key]}
              </td>

              {/* Value + delta for each country */}
              {countries.map((country) => {
                const value = getCurrentValue(country, key)

                // Prefer year-over-year delta; fall back to cross-country mean deviation
                const yoyDelta = getYearOverYearDelta(country, key)
                const delta =
                  yoyDelta !== null ? yoyDelta : getCrossCountryDelta(country, key, countries)

                const deltaPositive = delta !== null && delta > 0
                const deltaNegative = delta !== null && delta < 0

                return (
                  <td
                    key={country.iso}
                    className={
                      deltaPositive
                        ? 'delta-cell-green'
                        : deltaNegative
                        ? 'delta-cell-red'
                        : undefined
                    }
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      backgroundColor: deltaPositive
                        ? '#F1F8E9'
                        : deltaNegative
                        ? '#FFEBEE'
                        : 'transparent',
                    }}
                  >
                    {/* Current value */}
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1A237E',
                        lineHeight: 1,
                        marginBottom: '4px',
                      }}
                    >
                      {value !== null ? value.toFixed(1) : '—'}
                    </div>

                    {/* Delta — only render when non-zero */}
                    {delta !== null && delta !== 0 && (
                      <div
                        className={deltaPositive ? 'delta-positive-green' : 'delta-negative-red'}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: deltaPositive ? '#2E7D32' : '#C62828',
                          letterSpacing: '0.4px',
                        }}
                        aria-label={`${deltaPositive ? 'Up' : 'Down'} ${Math.abs(delta).toFixed(1)} from prior year`}
                      >
                        {deltaPositive ? '↑' : '↓'}
                        {deltaPositive ? '+' : ''}
                        {delta.toFixed(1)}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
