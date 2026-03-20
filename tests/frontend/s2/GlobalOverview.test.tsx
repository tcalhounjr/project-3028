/**
 * S2 Tests — GlobalOverview page
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import type { DataJson, CountryData } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mock '../../../src/App' to avoid importing the old monolith (which depends
// on @google/genai unavailable in the test env). We export a real Context so
// the page's useContext call works correctly.
// The factory must not reference variables declared outside of it because
// vi.mock factories are hoisted to the top of the file.
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

// ---------------------------------------------------------------------------
// Mock child components that require leaflet/maps to prevent jsdom errors
// ---------------------------------------------------------------------------

vi.mock('../../../src/components/GlobalOverview/Map', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-map">Map ({countries.length} countries)</div>
  ),
}))

vi.mock('../../../src/components/GlobalOverview/TopMovers', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-top-movers">TopMovers ({countries.length})</div>
  ),
}))

vi.mock('../../../src/components/GlobalOverview/CountryTable', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-country-table">CountryTable ({countries.length})</div>
  ),
}))

// ---------------------------------------------------------------------------
// Import page and the mocked DataContext AFTER mocks are established
// ---------------------------------------------------------------------------

import GlobalOverview from '../../../src/pages/GlobalOverview'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCountry(iso: string, name: string): CountryData {
  return {
    iso,
    name,
    flag_url: `https://example.com/flag/w80/${iso.toLowerCase()}.png`,
    current_score: 55.0,
    current_tier: 'elevated',
    current_tier_label: 'Elevated Stress',
    one_year_change: 0.0,
    five_year_change: 0.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
  }
}

function makeDataJson(countries: CountryData[]): DataJson {
  return {
    meta: {
      generated_at: '2024-01-01T00:00:00Z',
      year_range: [2010, 2024],
      countries: countries.length,
      indicators: {},
      vdem_version: '13',
      normalization: 'min-max',
      weights: {},
    },
    countries,
  }
}

function renderWithContext(data: DataJson | null) {
  return render(
    <MemoryRouter>
      <DataContext.Provider value={data}>
        <GlobalOverview />
      </DataContext.Provider>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GlobalOverview', () => {
  it('shows loading state when data is null', () => {
    renderWithContext(null)
    expect(screen.getByText('Loading data…')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
  })

  it('renders the "Global Overview" heading when data is available', () => {
    const data = makeDataJson([makeCountry('NIC', 'Nicaragua'), makeCountry('HUN', 'Hungary')])
    renderWithContext(data)
    expect(screen.getAllByRole('heading', { name: 'Global Overview' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Map component with countries when data is available', () => {
    const data = makeDataJson([makeCountry('NIC', 'Nicaragua'), makeCountry('HUN', 'Hungary')])
    renderWithContext(data)
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
    expect(screen.getByTestId('mock-map')).toHaveTextContent('2 countries')
  })

  it('renders the TopMovers component when data is available', () => {
    const data = makeDataJson([makeCountry('USA', 'United States')])
    renderWithContext(data)
    expect(screen.getByTestId('mock-top-movers')).toBeInTheDocument()
  })

  it('renders the CountryTable component when data is available', () => {
    const data = makeDataJson([makeCountry('USA', 'United States')])
    renderWithContext(data)
    expect(screen.getByTestId('mock-country-table')).toBeInTheDocument()
  })

  it('renders the "All Countries" section heading', () => {
    const data = makeDataJson([makeCountry('POL', 'Poland')])
    renderWithContext(data)
    expect(screen.getByRole('heading', { name: 'All Countries' })).toBeInTheDocument()
  })

  it('renders the "Stress Map" section heading', () => {
    const data = makeDataJson([makeCountry('POL', 'Poland')])
    renderWithContext(data)
    expect(screen.getByRole('heading', { name: 'Stress Map' })).toBeInTheDocument()
  })

  it('page is not aria-busy when data is present', () => {
    const data = makeDataJson([makeCountry('POL', 'Poland')])
    renderWithContext(data)
    expect(screen.getByRole('main')).not.toHaveAttribute('aria-busy', 'true')
  })
})
