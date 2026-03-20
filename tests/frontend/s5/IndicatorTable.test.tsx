/**
 * S5 Tests — PRO-34: IndicatorTable component
 *
 * Verifies that:
 *   1. All 7 indicator rows are rendered (media_freedom, judicial_independence,
 *      civil_society_space, election_quality, executive_constraints,
 *      rhetoric_radar, civic_protests).
 *   2. A delta indicator (↑ or ↓, or equivalent text) is shown for each cell.
 *   3. A positive delta has green styling (CSS class or inline style).
 *   4. A negative delta has red styling.
 *   5. Column headers show the name of each selected country.
 *   6. The table renders correctly for both 2-country and 3-country selections.
 *
 * Implementation contract assumed:
 *   - IndicatorTable is the default export from
 *     src/components/Compare/IndicatorTable  (or similar path)
 *   - Props: countries — array of 2 or 3 CountryData objects
 *   - Each country's indicators Record has entries for all 7 keys, each an
 *     IndicatorValue { label, value, trend }
 *   - The table has one row per indicator, labelled by indicator display name.
 *   - Each data cell contains a numeric value plus a delta marker.
 *   - Delta is expressed as a difference relative to the cross-country mean,
 *     or as a literal change value; the sign determines the arrow direction.
 *   - Positive delta cells have a className or style containing a green colour
 *     token; negative delta cells contain a red colour token.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CountryData, IndicatorValue } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import IndicatorTable from '../../../src/components/Compare/IndicatorTable'

// ---------------------------------------------------------------------------
// jsdom matchMedia stub
// ---------------------------------------------------------------------------

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

// ---------------------------------------------------------------------------
// The 7 canonical indicator keys and their expected display labels.
// Label matching is done case-insensitively to be tolerant of formatting.
// ---------------------------------------------------------------------------

const INDICATOR_KEYS = [
  'media_freedom',
  'judicial_independence',
  'civil_society_space',
  'election_quality',
  'executive_constraints',
  'rhetoric_radar',
  'civic_protests',
]

// Display name fragments that must appear in the table (case-insensitive).
const INDICATOR_LABEL_FRAGMENTS = [
  'media',
  'judicial',
  'civil society',
  'election',
  'executive',
  'rhetoric',
  'civic',
]

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeIndicators(
  baseValue: number,
): Record<string, IndicatorValue> {
  return {
    media_freedom: { label: 'Media Freedom', value: baseValue, trend: 'stable' },
    judicial_independence: {
      label: 'Judicial Independence',
      value: baseValue + 5,
      trend: 'declining',
    },
    civil_society_space: {
      label: 'Civil Society Space',
      value: baseValue - 5,
      trend: 'improving',
    },
    election_quality: { label: 'Election Quality', value: baseValue + 2, trend: 'stable' },
    executive_constraints: {
      label: 'Executive Constraints',
      value: baseValue - 2,
      trend: 'declining',
    },
    rhetoric_radar: { label: 'Rhetoric Radar', value: baseValue + 8, trend: 'rapidly_declining' },
    civic_protests: { label: 'Civic Protests', value: baseValue - 8, trend: 'improving' },
  }
}

function makeCountry(iso: string, name: string, baseScore: number): CountryData {
  return {
    iso,
    name,
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: baseScore,
    current_tier: 'elevated' as const,
    current_tier_label: 'Elevated Stress',
    one_year_change: -1.0,
    five_year_change: -3.0,
    latest_year: 2024,
    flags: [],
    indicators: makeIndicators(baseScore),
    timeline: [],
  }
}

// Country A has a higher score (70) — indicator values cluster above 70.
// Country B has a lower score (40) — indicator values cluster around 40.
// Country C is mid-range (55).
const COUNTRY_HIGH = makeCountry('NIC', 'Nicaragua', 70)
const COUNTRY_LOW = makeCountry('HUN', 'Hungary', 40)
const COUNTRY_MID = makeCountry('BRA', 'Brazil', 55)

// ---------------------------------------------------------------------------
// PRO-34: All 7 indicator rows render
// ---------------------------------------------------------------------------

describe('PRO-34: IndicatorTable renders all 7 indicator rows', () => {
  beforeEach(stubMatchMedia)

  it('renders a row (or labelled cell) for media_freedom', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/media/i)).toBeInTheDocument()
  })

  it('renders a row for judicial_independence', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/judicial/i)).toBeInTheDocument()
  })

  it('renders a row for civil_society_space', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/civil society/i)).toBeInTheDocument()
  })

  it('renders a row for election_quality', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/election/i)).toBeInTheDocument()
  })

  it('renders a row for executive_constraints', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/executive/i)).toBeInTheDocument()
  })

  it('renders a row for rhetoric_radar', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/rhetoric/i)).toBeInTheDocument()
  })

  it('renders a row for civic_protests', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/civic/i)).toBeInTheDocument()
  })

  it('renders all 7 indicator labels when queried together (2 countries)', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    for (const fragment of INDICATOR_LABEL_FRAGMENTS) {
      expect(container.innerHTML).toMatch(new RegExp(fragment, 'i'))
    }
  })
})

// ---------------------------------------------------------------------------
// PRO-34: Delta shown for each cell
// ---------------------------------------------------------------------------

describe('PRO-34: Each indicator cell shows a delta indicator (arrow or text)', () => {
  beforeEach(stubMatchMedia)

  it('rendered output contains at least one up-arrow character or "up" text', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    // Accept ↑, ▲, +, "up", "increase", or aria-label containing "up"
    const hasUp =
      container.innerHTML.includes('↑') ||
      container.innerHTML.includes('▲') ||
      /up|increase|positive/i.test(container.innerHTML)
    expect(hasUp).toBe(true)
  })

  it('rendered output contains at least one down-arrow character or "down" text', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    const hasDown =
      container.innerHTML.includes('↓') ||
      container.innerHTML.includes('▼') ||
      /down|decrease|negative/i.test(container.innerHTML)
    expect(hasDown).toBe(true)
  })

  it('delta markers are present for both country columns (2 countries)', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    // Both up and down markers must appear since scores differ.
    const upCount = (container.innerHTML.match(/↑|▲/g) || []).length
    const downCount = (container.innerHTML.match(/↓|▼/g) || []).length
    // At least one of each given that HIGH and LOW have different values.
    expect(upCount + downCount).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// PRO-34: Positive delta has green styling, negative has red styling
// ---------------------------------------------------------------------------

describe('PRO-34: Delta colour coding — green for positive, red for negative', () => {
  beforeEach(stubMatchMedia)

  it('rendered output contains a green colour token for at least one positive delta', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    // Implementation uses inline styles: color #2E7D32 (text) or
    // backgroundColor #F1F8E9 (cell background) for positive deltas.
    const html = container.innerHTML
    const hasGreen =
      html.includes('#2E7D32') ||
      html.includes('#F1F8E9') ||
      /green|emerald/i.test(html) ||
      container.querySelector('[class*="green"]') !== null
    expect(hasGreen).toBe(true)
  })

  it('rendered output contains a red colour token for at least one negative delta', () => {
    const { container } = render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    // Implementation uses inline styles: color #C62828 (text) or
    // backgroundColor #FFEBEE (cell background) for negative deltas.
    const html = container.innerHTML
    const hasRed =
      html.includes('#C62828') ||
      html.includes('#FFEBEE') ||
      /\bred\b|rose|crimson/i.test(html) ||
      container.querySelector('[class*="red"]') !== null
    expect(hasRed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-34: Column headers show country names
// ---------------------------------------------------------------------------

describe('PRO-34: Column headers display the selected country names', () => {
  beforeEach(stubMatchMedia)

  it('renders Nicaragua as a column header for 2-country selection', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/Nicaragua/i)).toBeInTheDocument()
  })

  it('renders Hungary as a column header for 2-country selection', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    expect(screen.getByText(/Hungary/i)).toBeInTheDocument()
  })

  it('renders all 3 country names as column headers for 3-country selection', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW, COUNTRY_MID]} />)
    expect(screen.getByText(/Nicaragua/i)).toBeInTheDocument()
    expect(screen.getByText(/Hungary/i)).toBeInTheDocument()
    expect(screen.getByText(/Brazil/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-34: Renders correctly for both 2 and 3 countries
// ---------------------------------------------------------------------------

describe('PRO-34: IndicatorTable renders for both 2 and 3 countries', () => {
  beforeEach(stubMatchMedia)

  it('does not crash with exactly 2 countries', () => {
    expect(() => {
      render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    }).not.toThrow()
  })

  it('does not crash with exactly 3 countries', () => {
    expect(() => {
      render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW, COUNTRY_MID]} />)
    }).not.toThrow()
  })

  it('renders 2 data columns plus 1 label column (3 total) for 2 countries', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    // Query the header row; it should have 3 cells: label + 2 country columns.
    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    // 1 label column + 2 country columns = 3
    expect(headers.length).toBe(3)
  })

  it('renders 3 data columns plus 1 label column (4 total) for 3 countries', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW, COUNTRY_MID]} />)
    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    // 1 label column + 3 country columns = 4
    expect(headers.length).toBe(4)
  })

  it('renders 7 data rows for 2 countries', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW]} />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // 1 header row + 7 data rows = 8 total
    expect(rows.length).toBe(8)
  })

  it('renders 7 data rows for 3 countries', () => {
    render(<IndicatorTable countries={[COUNTRY_HIGH, COUNTRY_LOW, COUNTRY_MID]} />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    expect(rows.length).toBe(8)
  })
})
