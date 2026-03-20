import React, { useContext } from 'react'
import { DataContext } from '../App'
import type { DataJson } from '../types/country'
import Map from '../components/GlobalOverview/Map'
import TopMovers from '../components/GlobalOverview/TopMovers'
import CountryTable from '../components/GlobalOverview/CountryTable'

// ---------------------------------------------------------------------------
// GlobalOverview page — composes map, top movers, and country table.
// All data sourced from DataContext; no prop drilling from App.
// ---------------------------------------------------------------------------

export default function GlobalOverview() {
  const data = useContext(DataContext) as DataJson | null

  // Loading state
  if (!data) {
    return (
      <main
        className="p-6"
        aria-labelledby="page-heading-overview"
        aria-busy="true"
        style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}
      >
        <h1
          id="page-heading-overview"
          style={{
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            color: '#1A237E',
            marginBottom: '24px',
          }}
        >
          Global Overview
        </h1>
        <p style={{ color: '#6C6C70', fontSize: '14px' }}>Loading data…</p>
      </main>
    )
  }

  const { countries } = data

  return (
    <main
      className="p-6"
      aria-labelledby="page-heading-overview"
      style={{
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        maxWidth: '1600px',
      }}
    >
      {/* Page title */}
      <h1
        id="page-heading-overview"
        style={{
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          color: '#1A237E',
          marginBottom: '24px',
        }}
      >
        Global Overview
      </h1>

      {/* Map — full width card */}
      <section
        aria-label="World map"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '-0.2px',
            color: '#1A237E',
            marginBottom: '16px',
          }}
        >
          Stress Map
        </h2>
        <Map countries={countries} />
      </section>

      {/* Top Movers — full width */}
      <div style={{ marginBottom: '24px' }}>
        <TopMovers countries={countries} />
      </div>

      {/* Country Table — full width card */}
      <section aria-label="Country stress scores table">
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '-0.2px',
            color: '#1A237E',
            marginBottom: '16px',
          }}
        >
          All Countries
        </h2>
        <CountryTable countries={countries} />
      </section>
    </main>
  )
}
