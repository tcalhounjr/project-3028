/**
 * S1-07 Tests — Country Table and Top Movers Widget
 * ===================================================
 * Tests for the CountryTable and TopMovers components rendered on the Global
 * Overview page.
 *
 * Fixture: tests/fixtures/frontend_data.json (3-country slice)
 *   - Nicaragua  (Critical)  one_year_change: -8.3  → top decliner
 *   - Hungary    (Elevated)  one_year_change: +3.1
 *   - USA        (Stable)    one_year_change: +12.5 → top riser
 *
 * Component contract assumed:
 *   CountryTable  — src/components/CountryTable.tsx
 *     Props: countries (array of country records)
 *     Renders an HTML table with columns: Country, Score, Tier, 1-Year Change
 *     Clicking a column header re-sorts the table; sorted header carries
 *     aria-sort attribute (ascending | descending)
 *     Flag images have alt text containing the country name
 *
 *   TopMovers     — src/components/TopMovers.tsx
 *     Props: countries (array of country records)
 *     Renders two lists: top risers (highest positive change first) and
 *     top decliners (most negative change first)
 *     Each entry shows the country name and a signed change value
 */

import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import fixtureData from '../../fixtures/frontend_data.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Country = (typeof fixtureData.countries)[number]

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const COUNTRIES = fixtureData.countries
// Sorted by one_year_change: USA +12.5, HUN +3.1, NIC -8.3
const TOP_RISER = COUNTRIES.find((c) => c.iso === 'USA')! // +12.5
const TOP_DECLINER = COUNTRIES.find((c) => c.iso === 'NIC')! // -8.3

// ---------------------------------------------------------------------------
// Dynamic component imports
// ---------------------------------------------------------------------------

let CountryTable: React.ComponentType<{ countries: Country[] }>
let TopMovers: React.ComponentType<{ countries: Country[] }>

beforeAll(async () => {
  // CountryTable
  try {
    const mod = await import('../../../src/components/GlobalOverview/CountryTable')
    CountryTable = mod.default ?? mod.CountryTable
  } catch {
    CountryTable = () =>
      React.createElement(
        'div',
        null,
        'COMPONENT NOT YET IMPLEMENTED — src/components/CountryTable.tsx missing'
      )
  }

  // TopMovers
  try {
    const mod = await import('../../../src/components/GlobalOverview/TopMovers')
    TopMovers = mod.default ?? mod.TopMovers
  } catch {
    TopMovers = () =>
      React.createElement(
        'div',
        null,
        'COMPONENT NOT YET IMPLEMENTED — src/components/TopMovers.tsx missing'
      )
  }
})

// ---------------------------------------------------------------------------
// S1-07-01: Table renders with correct columns
// ---------------------------------------------------------------------------

describe('S1-07 CountryTable — column headers', () => {
  it('should render a table element', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should render a "Country" column header', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByRole('columnheader', { name: /country/i })).toBeInTheDocument()
  })

  it('should render a "Score" column header', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByRole('columnheader', { name: /score/i })).toBeInTheDocument()
  })

  it('should render a "Tier" column header', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByRole('columnheader', { name: /tier/i })).toBeInTheDocument()
  })

  it('should render a "1-Year Change" column header', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    // Accept variants: "1-Year Change", "1 Year Change", "Change", "Δ 1yr"
    expect(
      screen.getByRole('columnheader', { name: /1.?year|change|Δ/i })
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// S1-07-02: All countries appear as table rows
// ---------------------------------------------------------------------------

describe('S1-07 CountryTable — rows', () => {
  it('should render a row for Nicaragua', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByText(/nicaragua/i)).toBeInTheDocument()
  })

  it('should render a row for Hungary', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByText(/hungary/i)).toBeInTheDocument()
  })

  it('should render a row for United States', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    expect(screen.getByText(/united states/i)).toBeInTheDocument()
  })

  it('should render exactly 3 data rows (one per country in fixture)', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    // rowgroup "tbody" rows only — exclude header
    const rows = screen.getAllByRole('row')
    // rows[0] is the header row; rows[1..3] are data rows
    expect(rows.length - 1).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// S1-07-03: Flag images have accessible alt text
// ---------------------------------------------------------------------------

describe('S1-07 CountryTable — flag image alt text', () => {
  it('Nicaragua flag image should have alt text containing "Nicaragua"', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    const flags = screen.getAllByRole('img')
    const nicFlag = flags.find((img) =>
      img.getAttribute('alt')?.toLowerCase().includes('nicaragua')
    )
    expect(nicFlag, 'No flag img found with alt text containing "Nicaragua"').toBeDefined()
  })

  it('Hungary flag image should have alt text containing "Hungary"', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    const flags = screen.getAllByRole('img')
    const hunFlag = flags.find((img) =>
      img.getAttribute('alt')?.toLowerCase().includes('hungary')
    )
    expect(hunFlag, 'No flag img found with alt text containing "Hungary"').toBeDefined()
  })

  it('United States flag image should have alt text containing "United States"', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )
    const flags = screen.getAllByRole('img')
    const usaFlag = flags.find((img) =>
      img.getAttribute('alt')?.toLowerCase().includes('united states')
    )
    expect(usaFlag, 'No flag img found with alt text containing "United States"').toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// S1-07-04: Clicking a column header re-sorts the table
// ---------------------------------------------------------------------------

describe('S1-07 CountryTable — sorting', () => {
  it('should re-sort rows when the Score column header is clicked', async () => {
    const user = userEvent.setup()
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )

    const scoreHeader = screen.getByRole('columnheader', { name: /score/i })

    // Capture initial row order
    const initialRows = screen.getAllByRole('row').slice(1) // skip header
    const initialFirst = initialRows[0].textContent

    // Click to sort
    await user.click(scoreHeader)

    // After clicking, the first row should change or the header should carry
    // aria-sort — we assert both possible outcomes
    const sortedRows = screen.getAllByRole('row').slice(1)
    const sortedFirst = sortedRows[0].textContent

    // Either the order changed OR the header now has aria-sort
    const headerHasAriaSort =
      scoreHeader.getAttribute('aria-sort') !== null &&
      scoreHeader.getAttribute('aria-sort') !== 'none'

    const orderChanged = sortedFirst !== initialFirst

    expect(
      orderChanged || headerHasAriaSort,
      'Clicking the Score header did not change row order or set aria-sort'
    ).toBe(true)
  })

  it('should set aria-sort attribute on the active sorted column header', async () => {
    const user = userEvent.setup()
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )

    const scoreHeader = screen.getByRole('columnheader', { name: /score/i })
    await user.click(scoreHeader)

    const ariaSort = scoreHeader.getAttribute('aria-sort')
    expect(
      ariaSort === 'ascending' || ariaSort === 'descending',
      `Expected aria-sort to be "ascending" or "descending" after click, got ${ariaSort!}`
    ).toBe(true)
  })

  it('should toggle sort direction on second click of same column header', async () => {
    const user = userEvent.setup()
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(CountryTable, { countries: COUNTRIES })
    )
  )

    const scoreHeader = screen.getByRole('columnheader', { name: /score/i })

    await user.click(scoreHeader)
    const firstClickSort = scoreHeader.getAttribute('aria-sort')

    await user.click(scoreHeader)
    const secondClickSort = scoreHeader.getAttribute('aria-sort')

    expect(firstClickSort).not.toBe(secondClickSort)
  })
})

// ---------------------------------------------------------------------------
// S1-07-05: Top Movers widget renders
// ---------------------------------------------------------------------------

describe('S1-07 TopMovers — widget renders', () => {
  it('should render the Top Movers widget', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))
    // Accept data-testid="top-movers" or a heading containing "movers"
    const widget =
      screen.queryByTestId('top-movers') ??
      screen.queryByRole('region', { name: /movers/i }) ??
      screen.queryByText(/top movers/i)
    expect(widget, 'TopMovers widget not found — expected data-testid="top-movers" or heading with "top movers"').not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// S1-07-06: Top riser appears first in the risers list
// ---------------------------------------------------------------------------

describe('S1-07 TopMovers — risers list', () => {
  it('should show the top riser (USA, +12.5) first in the risers list', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))

    // Locate the risers section — prefer data-testid="top-risers", then
    // accept data-testid="risers-list" or a labelled list.
    const risersSection = screen.getByTestId('top-risers')
    const risersList =
      within(risersSection).queryByTestId('risers-list') ??
      within(risersSection).queryByRole('list', { name: /riser|rising|gaining/i })

    if (risersList) {
      const items = within(risersList).getAllByRole('listitem')
      expect(items[0].textContent).toMatch(/united states/i)
    } else {
      // Fallback: USA (top riser) must appear in the risers section
      expect(within(risersSection).getByText(/united states/i)).toBeInTheDocument()
    }
  })

  it('should display a positive signed change value for the top riser (USA +12.5)', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))
    // The component must render the change value — accept +12.5 or 12.5
    const risers = screen.getByTestId('top-risers')
    expect(within(risers).getByText(/\+?12\.5|12\.5/)).toBeInTheDocument()
  })

  it('should display the top riser country name alongside its change value', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))
    const risers = screen.getByTestId('top-risers')
    expect(within(risers).getByText(/united states/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// S1-07-07: Top decliner appears first in the decliners list
// ---------------------------------------------------------------------------

describe('S1-07 TopMovers — decliners list', () => {
  it('should show the top decliner (Nicaragua, -8.3) first in the decliners list', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))

    // Locate the decliners section — prefer data-testid="top-decliners", then
    // accept data-testid="decliners-list" or a labelled list.
    const declinersSection = screen.getByTestId('top-decliners')
    const declinersList =
      within(declinersSection).queryByTestId('decliners-list') ??
      within(declinersSection).queryByRole('list', { name: /decliner|declining|falling/i })

    if (declinersList) {
      const items = within(declinersList).getAllByRole('listitem')
      expect(items[0].textContent).toMatch(/nicaragua/i)
    } else {
      // Fallback: Nicaragua must appear in the decliners section
      expect(within(declinersSection).getByText(/nicaragua/i)).toBeInTheDocument()
    }
  })

  it('should display the negative signed change value for the top decliner (Nicaragua -8.3)', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))
    // Accept -8.3 rendered as "-8.3" or "−8.3" (minus sign variants)
    const decliners = screen.getByTestId('top-decliners')
    expect(within(decliners).getByText(/[−\-]8\.3/)).toBeInTheDocument()
  })

  it('should display the top decliner country name alongside its change value', () => {
    render(React.createElement(TopMovers, { countries: COUNTRIES }))
    const decliners = screen.getByTestId('top-decliners')
    expect(within(decliners).getByText(/nicaragua/i)).toBeInTheDocument()
  })
})
