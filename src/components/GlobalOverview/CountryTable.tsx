import React, { useState, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CountryData } from '../../types/country'
import ScoreBadge from './ScoreBadge'
import { toW40Url } from '../../utils/flagUrl'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'name' | 'current_score' | 'current_tier' | 'one_year_change'
type SortDir = 'asc' | 'desc'

interface SortState {
  key: SortKey
  dir: SortDir
}

interface Column {
  key: SortKey
  label: string
  align: 'left' | 'right' | 'center'
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Country', align: 'left' },
  { key: 'current_score', label: 'Score', align: 'right' },
  { key: 'current_tier', label: 'Tier', align: 'center' },
  { key: 'one_year_change', label: '1-Year Change', align: 'right' },
]

// ---------------------------------------------------------------------------
// Sorting logic
// ---------------------------------------------------------------------------

function sortCountries(countries: CountryData[], sort: SortState): CountryData[] {
  return [...countries].sort((a, b) => {
    let cmp = 0
    switch (sort.key) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'current_score':
        cmp = a.current_score - b.current_score
        break
      case 'current_tier': {
        // Order tiers: critical < elevated < stable (lower score = more stressed = first)
        const tierOrder: Record<string, number> = { critical: 0, rapid_erosion: 1, elevated: 2, stable: 3 }
        cmp = (tierOrder[a.current_tier] ?? 99) - (tierOrder[b.current_tier] ?? 99)
        break
      }
      case 'one_year_change':
        cmp = a.one_year_change - b.one_year_change
        break
    }
    return sort.dir === 'asc' ? cmp : -cmp
  })
}

// ---------------------------------------------------------------------------
// Zebra row colors — referenced in initial style prop, onMouseLeave restore,
// and hover. Defined as constants to avoid duplication.
// ---------------------------------------------------------------------------

const ROW_COLOR_EVEN = '#FFFFFF'
const ROW_COLOR_ODD = '#F5F7FA'
const ROW_COLOR_HOVER = '#EEF2FF'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CountryTableProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CountryTable({ countries }: CountryTableProps) {
  // Default: sort by current_score ascending (most stressed first)
  const [sort, setSort] = useState<SortState>({ key: 'current_score', dir: 'asc' })

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }, [])

  const sorted = sortCountries(countries, sort)

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
        }}
        aria-label="Country stress scores"
      >
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isActive = sort.key === col.key
              const ariaSortValue: React.AriaAttributes['aria-sort'] = isActive
                ? sort.dir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSortValue}
                  style={{
                    padding: '0 16px',
                    height: '44px',
                    textAlign: col.align,
                    fontSize: '11px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color: isActive ? '#1A237E' : '#78909C',
                    borderBottom: '1px solid #F2F2F7',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSort(col.key)
                    }
                  }}
                  tabIndex={0}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent:
                        col.align === 'right'
                          ? 'flex-end'
                          : col.align === 'center'
                          ? 'center'
                          : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {col.label}
                    {isActive ? (
                      sort.dir === 'asc' ? (
                        <ChevronUp size={14} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} aria-hidden="true" />
                      )
                    ) : null}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length}
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
                  fontSize: '14px',
                  color: '#78909C',
                }}
              >
                No tracked countries in this region. The current dataset covers Americas, Europe, and Asia.
              </td>
            </tr>
          )}
          {sorted.map((country, idx) => {
            const isEven = idx % 2 === 0
            const changeSign = country.one_year_change >= 0 ? '+' : ''
            const changeDisplay = `${changeSign}${country.one_year_change.toFixed(1)}`
            const changeColor = country.one_year_change >= 0 ? '#2E7D32' : '#C62828'

            return (
              <tr
                key={country.iso}
                style={{
                  backgroundColor: isEven ? ROW_COLOR_EVEN : ROW_COLOR_ODD,
                  height: '52px',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = ROW_COLOR_HOVER
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = isEven ? ROW_COLOR_EVEN : ROW_COLOR_ODD
                }}
              >
                {/* Country column: flag (w40) + name (linked to country page) */}
                <td style={{ padding: '0 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* PRO-29: display flag at w40 */}
                    <img
                      src={toW40Url(country.flag_url)}
                      alt={`Flag of ${country.name}`}
                      width={40}
                      style={{
                        height: 'auto',
                        borderRadius: '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        flexShrink: 0,
                        display: 'block',
                      }}
                    />
                    <Link
                      to={`/country/${country.iso}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1C1C1E',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'
                      }}
                    >
                      {country.name}
                    </Link>
                  </div>
                </td>

                {/* Score column */}
                <td
                  style={{
                    padding: '0 16px',
                    textAlign: 'right',
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    fontSize: '13px',
                    color: '#1C1C1E',
                    fontWeight: 400,
                  }}
                >
                  {country.current_score.toFixed(1)}
                </td>

                {/* Tier column */}
                <td style={{ padding: '0 16px', textAlign: 'center' }}>
                  <ScoreBadge tier={country.current_tier} tierLabel={country.current_tier_label} />
                </td>

                {/* 1-Year Change column */}
                <td
                  style={{
                    padding: '0 16px',
                    textAlign: 'right',
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: changeColor,
                  }}
                >
                  {changeDisplay}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
