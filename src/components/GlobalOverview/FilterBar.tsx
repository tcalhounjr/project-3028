// ---------------------------------------------------------------------------
// FilterBar — Region and Score Tier filter controls for Global Overview.
// PRO-28: Renders <select> controls so tests can interact via fireEvent.change.
// ---------------------------------------------------------------------------

import React, { useContext } from 'react'
import { FilterContext, type Region, type TierFilter } from '../../contexts/FilterContext'

const REGIONS: Region[] = ['All', 'Americas', 'Europe', 'Asia', 'Africa', 'Middle East']
const TIERS: TierFilter[] = ['All', 'Stable', 'Elevated', 'Critical']

const labelStyle: React.CSSProperties = {
  fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  color: '#78909C',
  flexShrink: 0,
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
  color: '#1C1C1E',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8EAF0',
  borderRadius: '4px',
  padding: '6px 32px 6px 10px',
  cursor: 'pointer',
  appearance: 'auto',
  minWidth: '140px',
}

export default function FilterBar() {
  const { filters, setRegion, setTier } = useContext(FilterContext)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '12px 0',
      }}
      role="group"
      aria-label="Filter countries"
    >
      {/* Region filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="filter-region" style={labelStyle}>
          Region
        </label>
        <select
          id="filter-region"
          value={filters.region}
          onChange={(e) => setRegion(e.target.value as Region)}
          style={selectStyle}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div
        aria-hidden="true"
        style={{
          height: '20px',
          width: '1px',
          backgroundColor: '#E8EAF0',
          flexShrink: 0,
        }}
      />

      {/* Score Tier filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="filter-tier" style={labelStyle}>
          Score Tier
        </label>
        <select
          id="filter-tier"
          value={filters.tier}
          onChange={(e) => setTier(e.target.value as TierFilter)}
          style={selectStyle}
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
