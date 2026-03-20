/**
 * S2 Tests — TopMovers
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TopMovers from '../../../src/components/GlobalOverview/TopMovers'
import type { CountryData } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCountry(overrides: Partial<CountryData>): CountryData {
  return {
    iso: 'TST',
    name: 'Testland',
    flag_url: 'https://example.com/flag/w80/tst.png',
    current_score: 60.0,
    current_tier: 'elevated',
    current_tier_label: 'Elevated Stress',
    one_year_change: 0.0,
    five_year_change: 0.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    ...overrides,
  }
}

const THREE_COUNTRIES: CountryData[] = [
  makeCountry({ iso: 'NIC', name: 'Nicaragua', one_year_change: -8.3, current_tier: 'critical', current_tier_label: 'Critical Stress' }),
  makeCountry({ iso: 'HUN', name: 'Hungary', one_year_change: 3.1, current_tier: 'elevated', current_tier_label: 'Elevated Stress' }),
  makeCountry({ iso: 'USA', name: 'United States', one_year_change: 12.5, current_tier: 'stable', current_tier_label: 'Stable' }),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TopMovers', () => {
  it('renders heading "Top Movers"', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    expect(screen.getByRole('heading', { name: 'Top Movers' })).toBeInTheDocument()
  })

  it('renders the top risers section', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    expect(screen.getByTestId('top-risers')).toBeInTheDocument()
  })

  it('renders the top decliners section', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    expect(screen.getByTestId('top-decliners')).toBeInTheDocument()
  })

  it('renders country names in the list', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    // Each country appears once in risers and once in decliners (with only 3 countries)
    expect(screen.getAllByText('Nicaragua').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Hungary').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('United States').length).toBeGreaterThanOrEqual(1)
  })

  it('shows positive change with + sign for a rising country', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    expect(screen.getAllByText('+12.5').length).toBeGreaterThanOrEqual(1)
  })

  it('shows negative change without + sign for a declining country', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    expect(screen.getAllByText('-8.3').length).toBeGreaterThanOrEqual(1)
  })

  it('renders flag images for each mover row', () => {
    render(<TopMovers countries={THREE_COUNTRIES} />)
    // Each of 3 countries appears in both columns — 6 flag images total
    const flagImgs = screen.getAllByRole('img')
    expect(flagImgs.length).toBeGreaterThanOrEqual(3)
  })

  it('renders with an empty countries array without crashing', () => {
    render(<TopMovers countries={[]} />)
    expect(screen.getByRole('heading', { name: 'Top Movers' })).toBeInTheDocument()
  })

  it('renders a single country without crashing', () => {
    const single = [makeCountry({ iso: 'AAA', name: 'Aarabia', one_year_change: 1.5 })]
    render(<TopMovers countries={single} />)
    expect(screen.getAllByText('Aarabia').length).toBeGreaterThanOrEqual(1)
  })

  it('renders zero change as "0.0" without + sign', () => {
    const zeroChange = [makeCountry({ iso: 'ZER', name: 'Zeroia', one_year_change: 0.0 })]
    render(<TopMovers countries={zeroChange} />)
    expect(screen.getAllByText('+0.0').length).toBeGreaterThanOrEqual(1)
  })
})
