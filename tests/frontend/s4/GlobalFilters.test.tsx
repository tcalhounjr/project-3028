/**
 * S4 Tests — PRO-28: Global Overview filters
 *
 * Verifies that:
 *   1. Region filter renders with options: All, Americas, Europe, Asia, Africa,
 *      Middle East.
 *   2. Score Tier filter renders with options: All, Stable, Elevated, Critical.
 *   3. Selecting a Region filter shows only matching countries in CountryTable.
 *   4. Selecting a Score Tier filter shows only matching countries.
 *   5. Both filters can be active simultaneously (AND logic).
 *   6. Selecting "All" resets the filter (all countries shown again).
 *
 * Implementation notes:
 *   The GlobalOverview page is expected to add filter controls above the
 *   CountryTable. CountryTable receives the already-filtered countries array.
 *   Alternatively the filters may be rendered inside a dedicated FilterBar
 *   component that GlobalOverview composes. Either pattern satisfies these
 *   tests as long as the visible country rows respond to filter selection.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import type { CountryData, DataJson } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mocks — block leaflet from crashing jsdom; render CountryTable for real
// so filter effects on the row list are observable.
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

vi.mock('../../../src/components/GlobalOverview/Map', () => ({
  default: () => <div data-testid="mock-map" />,
}))

vi.mock('../../../src/components/GlobalOverview/TopMovers', () => ({
  default: () => <div data-testid="mock-top-movers" />,
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import GlobalOverview from '../../../src/pages/GlobalOverview'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Fixtures
//
// We craft a minimal 6-country set that exercises every region and every
// Score Tier combination needed by the filter ACs.
// ---------------------------------------------------------------------------

function makeCountry(
  iso: string,
  name: string,
  region: string,
  tier: 'critical' | 'elevated' | 'stable',
): CountryData {
  return {
    iso,
    name,
    // Cast region onto the object — types/country.ts may not have region yet;
    // the property will be present in data.json at runtime.
    ...(({ region } as unknown) as object),
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: tier === 'critical' ? 25 : tier === 'elevated' ? 55 : 80,
    current_tier: tier,
    current_tier_label:
      tier === 'critical' ? 'Critical Stress' : tier === 'elevated' ? 'Elevated Stress' : 'Stable',
    one_year_change: 0,
    five_year_change: 0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
  }
}

// 6 countries spanning 3 regions and 3 tiers
const COUNTRIES: CountryData[] = [
  makeCountry('NIC', 'Nicaragua', 'Americas', 'critical'),
  makeCountry('BRA', 'Brazil', 'Americas', 'elevated'),
  makeCountry('HUN', 'Hungary', 'Europe', 'elevated'),
  makeCountry('POL', 'Poland', 'Europe', 'stable'),
  makeCountry('IND', 'India', 'Asia', 'elevated'),
  makeCountry('PHL', 'Philippines', 'Asia', 'critical'),
]

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

function renderOverview(countries: CountryData[] = COUNTRIES) {
  return render(
    <MemoryRouter>
      <DataContext.Provider value={makeDataJson(countries)}>
        <GlobalOverview />
      </DataContext.Provider>
    </MemoryRouter>,
  )
}

function getRegionSelect(): HTMLSelectElement {
  return (
    screen.getByRole('combobox', { name: /region/i }) ||
    screen.getByLabelText(/region/i)
  ) as HTMLSelectElement
}

function getTierSelect(): HTMLSelectElement {
  return (
    screen.getByRole('combobox', { name: /score tier|tier/i }) ||
    screen.getByLabelText(/score tier|tier/i)
  ) as HTMLSelectElement
}

// ---------------------------------------------------------------------------
// Helpers — count visible country rows by querying the CountryTable.
// The table has aria-label="Country stress scores" per the existing
// CountryTable implementation.
// ---------------------------------------------------------------------------

function getVisibleCountryNames(): string[] {
  const table = screen.getByRole('table', { name: /country stress scores/i })
  const rows = within(table).getAllByRole('row')
  // Skip the header row (index 0); collect first-column text from data rows.
  return rows
    .slice(1)
    .map((row) => {
      const firstCell = within(row).getAllByRole('cell')[0]
      const link = firstCell?.querySelector('a')
      return link?.textContent?.trim() ?? ''
    })
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// PRO-28: Region filter options
// ---------------------------------------------------------------------------

describe('PRO-28: Region filter renders with correct options', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('Region filter is present in GlobalOverview when data is loaded', () => {
    renderOverview()
    expect(getRegionSelect()).toBeInTheDocument()
  })

  it('Region filter has an "All" option', () => {
    renderOverview()
    expect(within(getRegionSelect()).getByRole('option', { name: 'All' })).toBeInTheDocument()
  })

  it('Region filter has an "Americas" option', () => {
    renderOverview()
    expect(within(getRegionSelect()).getByRole('option', { name: 'Americas' })).toBeInTheDocument()
  })

  it('Region filter has a "Europe" option', () => {
    renderOverview()
    expect(within(getRegionSelect()).getByRole('option', { name: 'Europe' })).toBeInTheDocument()
  })

  it('Region filter has an "Asia" option', () => {
    renderOverview()
    expect(within(getRegionSelect()).getByRole('option', { name: 'Asia' })).toBeInTheDocument()
  })

  it('Region filter has an "Africa" option', () => {
    renderOverview()
    expect(within(getRegionSelect()).getByRole('option', { name: 'Africa' })).toBeInTheDocument()
  })

  it('Region filter has a "Middle East" option', () => {
    renderOverview()
    expect(
      within(getRegionSelect()).getByRole('option', { name: 'Middle East' }),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-28: Score Tier filter options
// ---------------------------------------------------------------------------

describe('PRO-28: Score Tier filter renders with correct options', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('Score Tier filter is present in GlobalOverview when data is loaded', () => {
    renderOverview()
    expect(getTierSelect()).toBeInTheDocument()
  })

  it('Score Tier filter has an "All" option', () => {
    renderOverview()
    expect(within(getTierSelect()).getByRole('option', { name: 'All' })).toBeInTheDocument()
  })

  it('Score Tier filter has a "Stable" option', () => {
    renderOverview()
    expect(within(getTierSelect()).getByRole('option', { name: 'Stable' })).toBeInTheDocument()
  })

  it('Score Tier filter has an "Elevated" option', () => {
    renderOverview()
    expect(within(getTierSelect()).getByRole('option', { name: 'Elevated' })).toBeInTheDocument()
  })

  it('Score Tier filter has a "Critical" option', () => {
    renderOverview()
    expect(within(getTierSelect()).getByRole('option', { name: 'Critical' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-28: Region filter updates visible countries in CountryTable
// ---------------------------------------------------------------------------

describe('PRO-28: Region filter updates the visible countries in CountryTable', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('all 6 countries are visible before any filter is applied', () => {
    renderOverview()
    const names = getVisibleCountryNames()
    expect(names.length).toBe(6)
  })

  it('selecting "Americas" shows only Americas countries (Nicaragua, Brazil)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Americas' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Nicaragua')
    expect(names).toContain('Brazil')
    expect(names).not.toContain('Hungary')
    expect(names).not.toContain('Poland')
    expect(names).not.toContain('India')
    expect(names).not.toContain('Philippines')
  })

  it('selecting "Europe" shows only European countries (Hungary, Poland)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Europe' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Hungary')
    expect(names).toContain('Poland')
    expect(names).not.toContain('Nicaragua')
    expect(names).not.toContain('Brazil')
  })

  it('selecting "Asia" shows only Asian countries (India, Philippines)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Asia' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('India')
    expect(names).toContain('Philippines')
    expect(names).not.toContain('Nicaragua')
    expect(names).not.toContain('Hungary')
  })
})

// ---------------------------------------------------------------------------
// PRO-28: Score Tier filter updates visible countries in CountryTable
// ---------------------------------------------------------------------------

describe('PRO-28: Score Tier filter updates the visible countries in CountryTable', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('selecting "Critical" shows only Critical countries (Nicaragua, Philippines)', () => {
    renderOverview()
    fireEvent.change(getTierSelect(), { target: { value: 'Critical' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Nicaragua')
    expect(names).toContain('Philippines')
    expect(names).not.toContain('Hungary')
    expect(names).not.toContain('Poland')
    expect(names).not.toContain('Brazil')
    expect(names).not.toContain('India')
  })

  it('selecting "Elevated" shows only Elevated countries (Brazil, Hungary, India)', () => {
    renderOverview()
    fireEvent.change(getTierSelect(), { target: { value: 'Elevated' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Brazil')
    expect(names).toContain('Hungary')
    expect(names).toContain('India')
    expect(names).not.toContain('Nicaragua')
    expect(names).not.toContain('Philippines')
    expect(names).not.toContain('Poland')
  })

  it('selecting "Stable" shows only Stable countries (Poland)', () => {
    renderOverview()
    fireEvent.change(getTierSelect(), { target: { value: 'Stable' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Poland')
    expect(names).not.toContain('Nicaragua')
    expect(names).not.toContain('Hungary')
    expect(names).not.toContain('Brazil')
  })
})

// ---------------------------------------------------------------------------
// PRO-28: Both filters active simultaneously (AND logic)
// ---------------------------------------------------------------------------

describe('PRO-28: Both filters can be active simultaneously', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('Americas + Critical shows only Nicaragua (Americas AND Critical)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Americas' } })
    fireEvent.change(getTierSelect(), { target: { value: 'Critical' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Nicaragua')
    expect(names).not.toContain('Brazil') // Americas but Elevated, not Critical
    expect(names).not.toContain('Philippines') // Critical but Asia, not Americas
    expect(names).not.toContain('Hungary')
  })

  it('Europe + Stable shows only Poland (Europe AND Stable)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Europe' } })
    fireEvent.change(getTierSelect(), { target: { value: 'Stable' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('Poland')
    expect(names).not.toContain('Hungary') // Europe but Elevated
    expect(names).not.toContain('Nicaragua')
  })

  it('Asia + Elevated shows only India (Asia AND Elevated)', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Asia' } })
    fireEvent.change(getTierSelect(), { target: { value: 'Elevated' } })
    const names = getVisibleCountryNames()
    expect(names).toContain('India')
    expect(names).not.toContain('Philippines') // Asia but Critical
    expect(names).not.toContain('Brazil')
  })

  it('a combination with no matches shows zero data rows in the table', () => {
    // Americas + Stable: no Americas country in our fixture is Stable
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Americas' } })
    fireEvent.change(getTierSelect(), { target: { value: 'Stable' } })
    const names = getVisibleCountryNames()
    expect(names.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// PRO-28: Selecting "All" resets the filter
// ---------------------------------------------------------------------------

describe('PRO-28: Selecting "All" resets the filter', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
  })

  it('resetting Region filter to "All" after filtering by Americas shows all countries again', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Americas' } })
    expect(getVisibleCountryNames().length).toBe(2) // sanity check

    fireEvent.change(getRegionSelect(), { target: { value: 'All' } })
    expect(getVisibleCountryNames().length).toBe(6)
  })

  it('resetting Score Tier filter to "All" after filtering by Critical shows all countries again', () => {
    renderOverview()
    fireEvent.change(getTierSelect(), { target: { value: 'Critical' } })
    expect(getVisibleCountryNames().length).toBe(2) // sanity check

    fireEvent.change(getTierSelect(), { target: { value: 'All' } })
    expect(getVisibleCountryNames().length).toBe(6)
  })

  it('resetting both filters to "All" after combined filtering shows all countries', () => {
    renderOverview()
    fireEvent.change(getRegionSelect(), { target: { value: 'Europe' } })
    fireEvent.change(getTierSelect(), { target: { value: 'Elevated' } })
    expect(getVisibleCountryNames().length).toBe(1) // only Hungary

    fireEvent.change(getRegionSelect(), { target: { value: 'All' } })
    fireEvent.change(getTierSelect(), { target: { value: 'All' } })
    expect(getVisibleCountryNames().length).toBe(6)
  })
})
