import React, { useContext, useState, useMemo } from 'react'
import { DataContext } from '../App'
import type { DataJson } from '../types/country'
import { Sidebar, TopBar } from '../components/Layout'
import Map from '../components/GlobalOverview/Map'
import TopMovers from '../components/GlobalOverview/TopMovers'
import CountryTable from '../components/GlobalOverview/CountryTable'
import FilterBar from '../components/GlobalOverview/FilterBar'
import {
  FilterContext,
  ISO_REGION_MAP,
  TIER_TO_FILTER,
  type Region,
  type TierFilter,
  type FilterState,
} from '../contexts/FilterContext'

// ---------------------------------------------------------------------------
// GlobalOverview page — composes map, top movers, and country table.
// PRO-28: provides filter state via FilterContext; filtered countries
// are derived and passed to Map and CountryTable.
// ---------------------------------------------------------------------------

export default function GlobalOverview() {
  const data = useContext(DataContext) as DataJson | null

  // ---------------------------------------------------------------------------
  // Filter state — lifted here so Map and CountryTable share the same source.
  // All hooks are declared before any conditional return (Rules of Hooks).
  // ---------------------------------------------------------------------------
  const [filters, setFilters] = useState<FilterState>({ region: 'All', tier: 'All' })

  const setRegion = (region: Region) => setFilters((prev) => ({ ...prev, region }))
  const setTier = (tier: TierFilter) => setFilters((prev) => ({ ...prev, tier }))

  // Derived filtered country list — shared by Map and CountryTable.
  // Uses data?.countries ?? [] so it is safe when data is null.
  const filteredCountries = useMemo(() => {
    const countries = data?.countries ?? []
    return countries.filter((c) => {
      const regionMatch =
        filters.region === 'All' || ISO_REGION_MAP[c.iso] === filters.region
      const tierMatch =
        filters.tier === 'All' || TIER_TO_FILTER[c.current_tier] === filters.tier
      return regionMatch && tierMatch
    })
  }, [data, filters])

  // Loading state — returned AFTER all hooks are declared.
  const shell = (content: React.ReactNode) => (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FA' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', minHeight: '100vh' }}>
        <TopBar title="Global Overview" subtitle="Democratic Stress Dashboard" />
        {content}
      </div>
    </div>
  )

  if (!data) {
    return shell(
      <main
        className="p-6"
        aria-labelledby="page-heading-overview"
        aria-busy="true"
        style={{ fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif', padding: '32px' }}
      >
        <p style={{ color: '#6C6C70', fontSize: '14px' }}>Loading data…</p>
      </main>
    )
  }

  const { countries } = data

  return shell(
    <FilterContext.Provider value={{ filters, setRegion, setTier }}>
      <main
        aria-labelledby="page-heading-overview"
        style={{
          fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
          padding: '32px',
          maxWidth: '1600px',
        }}
      >
        <h1
          id="page-heading-overview"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
          }}
        >
          Global Overview
        </h1>

        {/* PRO-28: Filter controls */}
        <FilterBar />

        {/* Map — receives filtered countries */}
        <section
          aria-label="World map"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '24px',
            marginBottom: '24px',
            marginTop: '16px',
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
          <Map countries={filteredCountries} />
        </section>

        {/* Top Movers — full dataset, not filtered (shows overall movement context) */}
        <div style={{ marginBottom: '24px' }}>
          <TopMovers countries={countries} />
        </div>

        {/* Country Table — receives filtered countries */}
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
            {(filters.region !== 'All' || filters.tier !== 'All') && (
              <span
                style={{
                  marginLeft: '12px',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#78909C',
                }}
              >
                — {filteredCountries.length} of {countries.length} shown
              </span>
            )}
          </h2>
          <CountryTable countries={filteredCountries} />
        </section>
      </main>
    </FilterContext.Provider>
  )
}
