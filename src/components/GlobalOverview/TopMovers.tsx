import React from 'react'
import type { CountryData } from '../../types/country'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopMoversProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Subcomponent: a single mover row
// ---------------------------------------------------------------------------

interface MoverRowProps {
  country: CountryData
  // React's `key` prop is reserved and not passed through; declared here only
  // to satisfy TypeScript when the component is used with a key attribute.
  key?: React.Key
}

function MoverRow({ country }: MoverRowProps) {
  const changeSign = country.one_year_change >= 0 ? '+' : ''
  const changeDisplay = `${changeSign}${country.one_year_change.toFixed(1)}`
  const changeColor = country.one_year_change >= 0 ? '#2E7D32' : '#C62828'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 0',
        borderBottom: '1px solid #F2F2F7',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <img
          src={country.flag_url}
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
        <span
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1C1C1E',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {country.name}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontSize: '13px',
          fontWeight: 400,
          color: changeColor,
          flexShrink: 0,
        }}
      >
        {changeDisplay}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header style — type.label
// ---------------------------------------------------------------------------

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  color: '#6C6C70',
  marginBottom: '8px',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TopMovers({ countries }: TopMoversProps) {
  // Sort a copy descending for rising (top 5), ascending for declining (top 5)
  const sorted = [...countries].sort((a, b) => b.one_year_change - a.one_year_change)
  const risers = sorted.slice(0, 5)
  const decliners = [...sorted].reverse().slice(0, 5)

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
      }}
    >
      {/* Card title */}
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
        Top Movers
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Risers */}
        <div data-testid="top-risers">
          <p style={sectionLabelStyle}>Top Risers</p>
          {risers.map((country) => (
            <MoverRow key={country.iso} country={country} />
          ))}
        </div>

        {/* Decliners */}
        <div data-testid="top-decliners">
          <p style={sectionLabelStyle}>Top Decliners</p>
          {decliners.map((country) => (
            <MoverRow key={country.iso} country={country} />
          ))}
        </div>
      </div>
    </div>
  )
}
