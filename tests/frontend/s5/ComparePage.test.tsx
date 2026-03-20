/**
 * S5 Tests — PRO-32–35: ComparePage integration
 *
 * Verifies that the full /compare route renders without crash and that all
 * four sub-components (CountrySelector, CompareTimeline, IndicatorTable,
 * SharedEventLog) are composed into a single page.
 *
 * The test exercises the full page mount under realistic routing and DataContext
 * conditions. Each sub-component is mocked so the page render does not depend
 * on recharts SVG or complex internal logic — those are exercised in their
 * dedicated unit tests.
 *
 * Implementation contract assumed:
 *   - A ComparePage (or equivalent) component exists at
 *     src/pages/ComparePage  or is exported from src/App.tsx routing
 *   - The page is reachable at the /compare path in the router.
 *   - On initial load it shows CountrySelector so the user can choose countries.
 *   - After confirming a selection, it shows CompareTimeline, IndicatorTable,
 *     and SharedEventLog.
 *   - The component reads from DataContext to populate CountrySelector options.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { CountryData, DataJson } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mocks — all four sub-components are stubbed so ComparePage integration
// tests exercise routing, context, and composition only.
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

vi.mock('../../../src/components/Compare/CountrySelector', () => ({
  default: ({
    onConfirm,
  }: {
    onConfirm: (isos: string[]) => void
  }) => (
    <div data-testid="mock-country-selector">
      <button
        onClick={() => onConfirm(['NIC', 'HUN'])}
        data-testid="mock-confirm-2"
      >
        Compare 2
      </button>
      <button
        onClick={() => onConfirm(['NIC', 'HUN', 'BRA'])}
        data-testid="mock-confirm-3"
      >
        Compare 3
      </button>
    </div>
  ),
}))

vi.mock('../../../src/components/Compare/CompareTimeline', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-compare-timeline" data-count={countries.length} />
  ),
}))

vi.mock('../../../src/components/Compare/IndicatorTable', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-indicator-table" data-count={countries.length} />
  ),
}))

vi.mock('../../../src/components/Compare/SharedEventLog', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-shared-event-log" data-count={countries.length} />
  ),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import ComparePage from '../../../src/pages/ComparePage'
import { DataContext } from '../../../src/App'

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
// Fixtures
// ---------------------------------------------------------------------------

function makeCountry(iso: string, name: string): CountryData {
  return {
    iso,
    name,
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: 55,
    current_tier: 'elevated' as const,
    current_tier_label: 'Elevated Stress',
    one_year_change: -1.0,
    five_year_change: -3.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    events: [],
  }
}

const ALL_COUNTRIES: CountryData[] = [
  makeCountry('NIC', 'Nicaragua'),
  makeCountry('RUS', 'Russia'),
  makeCountry('VEN', 'Venezuela'),
  makeCountry('PHL', 'Philippines'),
  makeCountry('HUN', 'Hungary'),
  makeCountry('POL', 'Poland'),
  makeCountry('TUR', 'Turkey'),
  makeCountry('IND', 'India'),
  makeCountry('BRA', 'Brazil'),
  makeCountry('USA', 'United States'),
]

function makeDataJson(): DataJson {
  return {
    meta: {
      generated_at: '2024-01-01T00:00:00Z',
      year_range: [2010, 2024],
      countries: ALL_COUNTRIES.length,
      indicators: {},
      vdem_version: '13',
      normalization: 'min-max',
      weights: {},
    },
    countries: ALL_COUNTRIES,
  }
}

function renderComparePage(data: DataJson | null = makeDataJson()) {
  return render(
    <MemoryRouter initialEntries={['/compare']}>
      <DataContext.Provider value={data}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </DataContext.Provider>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// PRO-32: /compare route renders without crash
// ---------------------------------------------------------------------------

describe('ComparePage: /compare route renders without crash', () => {
  beforeEach(stubMatchMedia)

  it('mounts at /compare without throwing', () => {
    expect(() => renderComparePage()).not.toThrow()
  })

  it('renders the CountrySelector on initial load', () => {
    renderComparePage()
    expect(screen.getByTestId('mock-country-selector')).toBeInTheDocument()
  })

  it('renders without crash when DataContext is null (no data loaded yet)', () => {
    expect(() => renderComparePage(null)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// PRO-32–33–34–35: After selection, all 3 sub-components are shown
// ---------------------------------------------------------------------------

describe('ComparePage: after confirming selection, comparison sub-components render', () => {
  beforeEach(stubMatchMedia)

  it('CompareTimeline is rendered after confirming 2 countries', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-compare-timeline')).toBeInTheDocument()
    })
  })

  it('IndicatorTable is rendered after confirming 2 countries', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-indicator-table')).toBeInTheDocument()
    })
  })

  it('SharedEventLog is rendered after confirming 2 countries', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-shared-event-log')).toBeInTheDocument()
    })
  })

  it('CompareTimeline receives 2 countries after confirming 2', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      const timeline = screen.getByTestId('mock-compare-timeline')
      expect(timeline.getAttribute('data-count')).toBe('2')
    })
  })

  it('all 3 sub-components receive 3 countries after confirming 3', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-3'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-compare-timeline').getAttribute('data-count')).toBe('3')
      expect(screen.getByTestId('mock-indicator-table').getAttribute('data-count')).toBe('3')
      expect(screen.getByTestId('mock-shared-event-log').getAttribute('data-count')).toBe('3')
    })
  })
})

// ---------------------------------------------------------------------------
// PRO-32: CountrySelector remains visible alongside comparison components
// ---------------------------------------------------------------------------

describe('ComparePage: CountrySelector remains visible after selection is confirmed', () => {
  beforeEach(stubMatchMedia)

  it('CountrySelector is still present after confirming a selection', async () => {
    renderComparePage()
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-compare-timeline')).toBeInTheDocument()
    })
    // The left-column CountrySelector stays mounted at all times.
    expect(screen.getByTestId('mock-country-selector')).toBeInTheDocument()
  })

  it('user can re-confirm a different selection without resetting manually', async () => {
    renderComparePage()
    // First confirmation
    fireEvent.click(screen.getByTestId('mock-confirm-2'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-compare-timeline')).toBeInTheDocument()
    })
    // Second confirmation (e.g. now 3 countries)
    fireEvent.click(screen.getByTestId('mock-confirm-3'))
    await waitFor(() => {
      expect(screen.getByTestId('mock-compare-timeline').getAttribute('data-count')).toBe('3')
    })
  })
})
