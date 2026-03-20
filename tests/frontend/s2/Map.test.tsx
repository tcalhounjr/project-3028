/**
 * S2 Tests — Map (GlobalOverview/Map)
 */

import '../s1-06/setup'

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import Map from '../../../src/components/GlobalOverview/Map'
import type { CountryData } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCountry(overrides: Partial<CountryData>): CountryData {
  return {
    iso: 'NIC',
    name: 'Nicaragua',
    flag_url: 'https://example.com/flag/w80/nic.png',
    current_score: 28.4,
    current_tier: 'critical',
    current_tier_label: 'Critical Stress',
    one_year_change: -8.3,
    five_year_change: -15.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    ...overrides,
  }
}

const THREE_COUNTRIES: CountryData[] = [
  makeCountry({ iso: 'NIC', name: 'Nicaragua', current_tier: 'critical', current_tier_label: 'Critical Stress', one_year_change: -8.3 }),
  makeCountry({ iso: 'HUN', name: 'Hungary', current_tier: 'elevated', current_tier_label: 'Elevated Stress', one_year_change: 3.1 }),
  makeCountry({ iso: 'USA', name: 'United States', current_tier: 'stable', current_tier_label: 'Stable', one_year_change: 12.5 }),
]

function renderMap(countries: CountryData[] = THREE_COUNTRIES) {
  return render(
    <MemoryRouter>
      <Map countries={countries} />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Map', () => {
  it('renders the map container element', () => {
    renderMap()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders one marker per country that has known coords', () => {
    renderMap()
    const markers = screen.getAllByTestId('map-marker')
    // All 3 countries (NIC, HUN, USA) have known coords in COUNTRY_COORDS
    expect(markers.length).toBe(3)
  })

  it('renders the tier legend', () => {
    renderMap()
    expect(screen.getByTestId('tier-legend')).toBeInTheDocument()
  })

  it('renders "Critical" in the legend', () => {
    renderMap()
    const legend = screen.getByTestId('tier-legend')
    expect(legend).toHaveTextContent('Critical')
  })

  it('renders "Elevated" in the legend', () => {
    renderMap()
    const legend = screen.getByTestId('tier-legend')
    expect(legend).toHaveTextContent('Elevated')
  })

  it('renders "Stable" in the legend', () => {
    renderMap()
    const legend = screen.getByTestId('tier-legend')
    expect(legend).toHaveTextContent('Stable')
  })

  it('renders with an empty countries array without crashing', () => {
    renderMap([])
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('does not render a marker for a country with no known coords', () => {
    const unknownCountry = makeCountry({ iso: 'ZZZ', name: 'Unknownland' })
    renderMap([unknownCountry])
    expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument()
  })

  it('renders popup content for a mapped country', () => {
    renderMap([makeCountry({ iso: 'NIC', name: 'Nicaragua' })])
    expect(screen.getByText('Nicaragua')).toBeInTheDocument()
  })

  it('renders a rapid_erosion tier country with correct tier label in popup', () => {
    const country = makeCountry({ iso: 'VEN', name: 'Venezuela', current_tier: 'rapid_erosion', current_tier_label: 'Rapid Erosion', one_year_change: -5.0 })
    renderMap([country])
    expect(screen.getByText('Venezuela')).toBeInTheDocument()
  })
})
