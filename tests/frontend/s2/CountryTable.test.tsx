/**
 * S2 Tests — CountryTable
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import CountryTable from '../../../src/components/GlobalOverview/CountryTable'
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
  makeCountry({ iso: 'NIC', name: 'Nicaragua', current_score: 28.0, current_tier: 'critical', current_tier_label: 'Critical Stress', one_year_change: -8.3 }),
  makeCountry({ iso: 'HUN', name: 'Hungary', current_score: 55.0, current_tier: 'elevated', current_tier_label: 'Elevated Stress', one_year_change: 3.1 }),
  makeCountry({ iso: 'USA', name: 'United States', current_score: 76.0, current_tier: 'stable', current_tier_label: 'Stable', one_year_change: 12.5 }),
]

function renderTable(countries: CountryData[] = THREE_COUNTRIES) {
  return render(
    <MemoryRouter>
      <CountryTable countries={countries} />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CountryTable', () => {
  it('renders a table element', () => {
    renderTable()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders "Country" column header', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /Country/i })).toBeInTheDocument()
  })

  it('renders "Score" column header', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /Score/i })).toBeInTheDocument()
  })

  it('renders "Tier" column header', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /Tier/i })).toBeInTheDocument()
  })

  it('renders "1-Year Change" column header', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /1-Year Change/i })).toBeInTheDocument()
  })

  it('renders a row for each country', () => {
    renderTable()
    expect(screen.getByText('Nicaragua')).toBeInTheDocument()
    expect(screen.getByText('Hungary')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
  })

  it('renders country score as a formatted decimal', () => {
    renderTable()
    expect(screen.getByText('28.0')).toBeInTheDocument()
  })

  it('renders flag images with descriptive alt text', () => {
    renderTable()
    expect(screen.getByAltText('Flag of Nicaragua')).toBeInTheDocument()
    expect(screen.getByAltText('Flag of Hungary')).toBeInTheDocument()
    expect(screen.getByAltText('Flag of United States')).toBeInTheDocument()
  })

  it('renders country names as links to the country page', () => {
    renderTable()
    const nicLink = screen.getByRole('link', { name: 'Nicaragua' })
    expect(nicLink).toHaveAttribute('href', '/country/NIC')
  })

  it('renders the positive 1-year change with a + sign', () => {
    renderTable()
    expect(screen.getByText('+12.5')).toBeInTheDocument()
  })

  it('renders the negative 1-year change without a + sign', () => {
    renderTable()
    expect(screen.getByText('-8.3')).toBeInTheDocument()
  })

  it('renders with an empty countries array without crashing', () => {
    renderTable([])
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('default sort column (Score) has aria-sort set', () => {
    renderTable()
    const scoreHeader = screen.getByRole('columnheader', { name: /Score/i })
    expect(scoreHeader).toHaveAttribute('aria-sort')
    const sortVal = scoreHeader.getAttribute('aria-sort')
    expect(['ascending', 'descending']).toContain(sortVal)
  })

  it('clicking a column header changes the sort', () => {
    renderTable()
    const countryHeader = screen.getByRole('columnheader', { name: /Country/i })
    fireEvent.click(countryHeader)
    expect(countryHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('clicking the same column header twice toggles the sort direction', () => {
    renderTable()
    const scoreHeader = screen.getByRole('columnheader', { name: /Score/i })
    // First click — Score is already the default sort (ascending), second click should flip to descending
    fireEvent.click(scoreHeader)
    expect(scoreHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('handles keyboard Enter on a column header to sort', () => {
    renderTable()
    const countryHeader = screen.getByRole('columnheader', { name: /Country/i })
    fireEvent.keyDown(countryHeader, { key: 'Enter', code: 'Enter' })
    expect(countryHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('handles keyboard Space on a column header to sort', () => {
    renderTable()
    const tierHeader = screen.getByRole('columnheader', { name: /Tier/i })
    fireEvent.keyDown(tierHeader, { key: ' ', code: 'Space' })
    expect(tierHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('non-sort keyboard key on header does not trigger sort', () => {
    renderTable()
    const tierHeader = screen.getByRole('columnheader', { name: /Tier/i })
    const initialSort = tierHeader.getAttribute('aria-sort')
    fireEvent.keyDown(tierHeader, { key: 'Tab', code: 'Tab' })
    expect(tierHeader).toHaveAttribute('aria-sort', initialSort)
  })

  it('row onMouseEnter and onMouseLeave handlers do not throw', () => {
    renderTable()
    const rows = screen.getAllByRole('row')
    // Skip the header row (index 0)
    const dataRow = rows[1]
    expect(() => {
      fireEvent.mouseEnter(dataRow)
      fireEvent.mouseLeave(dataRow)
    }).not.toThrow()
  })

  it('link onMouseEnter and onMouseLeave handlers do not throw', () => {
    renderTable()
    const link = screen.getByRole('link', { name: 'Nicaragua' })
    expect(() => {
      fireEvent.mouseEnter(link)
      fireEvent.mouseLeave(link)
    }).not.toThrow()
  })
})
