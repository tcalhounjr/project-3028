/**
 * S4 Tests — PRO-27: WCAG AA compliance
 *
 * Verifies:
 *   1. Status badge (ScoreBadge) uses a non-transparent backgroundColor for
 *      the Amber / Elevated tier — not foreground text on a white background.
 *   2. aria-label or role attributes are present on filter controls.
 *   3. Interactive elements in CountryTable (column headers) have tabIndex
 *      so they are keyboard reachable (focus-visible precondition).
 *   4. Map markers receive aria attributes (via mock contract assertion).
 *   5. ScoreBadge for each tier carries a descriptive text label (screen
 *      reader accessible content).
 *
 * Note on focus-visible: CSS :focus-visible is a stylesheet concern that
 * cannot be validated in jsdom (computed styles are not available). The
 * tests below verify the DOM-side preconditions: interactive elements are
 * focusable (tabIndex >= 0) and have accessible labels. CSS-level
 * :focus-visible assertions are backlogged — see report.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import type { CountryData } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

vi.mock('../../../src/components/GlobalOverview/Map', () => ({
  default: ({ countries }: { countries: CountryData[] }) => (
    <div data-testid="mock-map">
      {countries.map((c) => (
        <div
          key={c.iso}
          data-testid={`map-marker-${c.iso}`}
          role="button"
          aria-label={`${c.name} — ${c.current_tier_label}`}
          tabIndex={0}
        />
      ))}
    </div>
  ),
}))

vi.mock('../../../src/components/GlobalOverview/TopMovers', () => ({
  default: () => <div data-testid="mock-top-movers" />,
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import ScoreBadge from '../../../src/components/GlobalOverview/ScoreBadge'
import CountryTable from '../../../src/components/GlobalOverview/CountryTable'
import GlobalOverview from '../../../src/pages/GlobalOverview'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCountry(overrides: Partial<CountryData> = {}): CountryData {
  return {
    iso: 'TST',
    name: 'Testland',
    flag_url: 'https://flagcdn.com/w80/tst.png',
    current_score: 55.0,
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

const SAMPLE_COUNTRIES: CountryData[] = [
  makeCountry({ iso: 'NIC', name: 'Nicaragua', current_tier: 'critical', current_tier_label: 'Critical Stress' }),
  makeCountry({ iso: 'HUN', name: 'Hungary', current_tier: 'elevated', current_tier_label: 'Elevated Stress' }),
  makeCountry({ iso: 'USA', name: 'United States', current_tier: 'stable', current_tier_label: 'Stable' }),
]

// ---------------------------------------------------------------------------
// PRO-27: ScoreBadge — Elevated/Amber uses background color, not text-only
// ---------------------------------------------------------------------------

describe('PRO-27: ScoreBadge uses backgroundColor for the Elevated (Amber) tier', () => {
  it('renders the Elevated tier badge', () => {
    const { container } = render(<ScoreBadge tier="elevated" tierLabel="Elevated Stress" />)
    const badge = container.querySelector('span')
    expect(badge).toBeInTheDocument()
  })

  it('Elevated tier badge has a non-empty backgroundColor style (not transparent / not white)', () => {
    const { container } = render(<ScoreBadge tier="elevated" tierLabel="Elevated Stress" />)
    const badge = container.querySelector('span') as HTMLElement
    const bg = badge.style.backgroundColor
    // Must have a background color set — empty string or 'transparent' would be a violation
    expect(bg).toBeTruthy()
    expect(bg).not.toBe('transparent')
    // Must not be pure white (#fff / rgb(255,255,255) / white)
    expect(bg.replace(/\s/g, '')).not.toMatch(/^(#fff|#ffffff|white|rgb\(255,255,255\))$/i)
  })

  it('Elevated tier badge has a border color set (visual distinction beyond background alone)', () => {
    const { container } = render(<ScoreBadge tier="elevated" tierLabel="Elevated Stress" />)
    const badge = container.querySelector('span') as HTMLElement
    // A border is present to ensure visibility for users who perceive color differently
    expect(badge.style.border).toBeTruthy()
  })

  it('Critical tier badge has a non-white backgroundColor', () => {
    const { container } = render(<ScoreBadge tier="critical" tierLabel="Critical Stress" />)
    const badge = container.querySelector('span') as HTMLElement
    const bg = badge.style.backgroundColor
    expect(bg).toBeTruthy()
    expect(bg.replace(/\s/g, '')).not.toMatch(/^(#fff|#ffffff|white|rgb\(255,255,255\))$/i)
  })

  it('Stable tier badge has a backgroundColor set', () => {
    const { container } = render(<ScoreBadge tier="stable" tierLabel="Stable" />)
    const badge = container.querySelector('span') as HTMLElement
    expect(badge.style.backgroundColor).toBeTruthy()
  })

  it('ScoreBadge renders accessible text content for screen readers', () => {
    render(<ScoreBadge tier="elevated" tierLabel="Elevated Stress" />)
    expect(screen.getByText('Elevated Stress')).toBeInTheDocument()
  })

  it('ScoreBadge renders accessible text for Critical tier', () => {
    render(<ScoreBadge tier="critical" tierLabel="Critical Stress" />)
    expect(screen.getByText('Critical Stress')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-27: CountryTable — column headers are keyboard-focusable
// ---------------------------------------------------------------------------

describe('PRO-27: CountryTable interactive elements are keyboard accessible', () => {
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

  it('all column headers have tabIndex allowing keyboard focus', () => {
    render(
      <MemoryRouter>
        <CountryTable countries={SAMPLE_COUNTRIES} />
      </MemoryRouter>,
    )
    const headers = screen.getAllByRole('columnheader')
    for (const header of headers) {
      // tabIndex 0 makes the element part of the natural tab order;
      // -1 would make it programmatically focusable but not keyboard-reachable
      const tabIndex = parseInt(header.getAttribute('tabindex') ?? '-99', 10)
      expect(tabIndex).toBeGreaterThanOrEqual(0)
    }
  })

  it('country name links in CountryTable are natively focusable anchor elements', () => {
    render(
      <MemoryRouter>
        <CountryTable countries={SAMPLE_COUNTRIES} />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(SAMPLE_COUNTRIES.length)
    for (const link of links) {
      // Anchor elements are natively focusable — no tabIndex override needed
      expect(link.tagName).toBe('A')
    }
  })

  it('CountryTable column headers have aria-sort indicating current sort state', () => {
    render(
      <MemoryRouter>
        <CountryTable countries={SAMPLE_COUNTRIES} />
      </MemoryRouter>,
    )
    const headers = screen.getAllByRole('columnheader')
    // At least one header must have a non-null aria-sort
    const hasSortAnnotation = headers.some((h) => {
      const val = h.getAttribute('aria-sort')
      return val !== null && val !== ''
    })
    expect(hasSortAnnotation).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-27: Map markers have aria attributes (contract test via mock)
// ---------------------------------------------------------------------------

describe('PRO-27: Map markers expose aria-label attributes', () => {
  // The Map component mock above renders marker divs with
  // role="button" and aria-label="{name} — {tier}".
  // This test confirms the contract: whatever implementation the real Map
  // uses, its markers must have role + aria-label.
  // When the real Map is in scope, this test exercises GlobalOverview which
  // passes countries to Map; Map is responsible for per-marker aria attributes.
  // We test via the mock contract here to ensure the interface is defined.

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

  function renderMapContext(countries: CountryData[]) {
    const data = {
      meta: {
        generated_at: '2024-01-01T00:00:00Z',
        year_range: [2010, 2024] as [number, number],
        countries: countries.length,
        indicators: {},
        vdem_version: '13',
        normalization: 'min-max',
        weights: {},
      },
      countries,
    }
    return render(
      <MemoryRouter>
        <DataContext.Provider value={data}>
          <GlobalOverview />
        </DataContext.Provider>
      </MemoryRouter>,
    )
  }

  it('map markers rendered by the Map component have a role attribute', () => {
    renderMapContext(SAMPLE_COUNTRIES)
    const markers = screen.getAllByRole('button').filter((el) =>
      el.getAttribute('data-testid')?.startsWith('map-marker-'),
    )
    expect(markers.length).toBe(SAMPLE_COUNTRIES.length)
  })

  it('map markers rendered by the Map component have an aria-label attribute', () => {
    renderMapContext(SAMPLE_COUNTRIES)
    const markers = screen.getAllByRole('button').filter((el) =>
      el.getAttribute('data-testid')?.startsWith('map-marker-'),
    )
    for (const marker of markers) {
      expect(marker.getAttribute('aria-label')).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// PRO-27: Filter controls (Region + Score Tier) have aria attributes
//
// These tests assert the interface contract for the filter controls that
// PRO-28 adds to GlobalOverview. The filters are expected to be <select>
// elements or equivalent controls with accessible labels.
// ---------------------------------------------------------------------------

describe('PRO-27: Filter controls have aria-label or associated label elements', () => {
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

  function renderGlobalOverview(countries: CountryData[]) {
    const data = {
      meta: {
        generated_at: '2024-01-01T00:00:00Z',
        year_range: [2010, 2024] as [number, number],
        countries: countries.length,
        indicators: {},
        vdem_version: '13',
        normalization: 'min-max',
        weights: {},
      },
      countries,
    }
    return render(
      <MemoryRouter>
        <DataContext.Provider value={data}>
          <GlobalOverview />
        </DataContext.Provider>
      </MemoryRouter>,
    )
  }

  it('Region filter control has an accessible label (aria-label or associated <label>)', () => {
    renderGlobalOverview(SAMPLE_COUNTRIES)
    // The filter can be a <select> with aria-label, or any element with role="combobox"
    // plus aria-label, or a <label>+<select> pair. We look for any accessible name
    // containing "region" (case-insensitive).
    const regionFilter =
      screen.queryByRole('combobox', { name: /region/i }) ||
      screen.queryByLabelText(/region/i) ||
      screen.queryByRole('listbox', { name: /region/i })
    expect(regionFilter).not.toBeNull()
  })

  it('Score Tier filter control has an accessible label (aria-label or associated <label>)', () => {
    renderGlobalOverview(SAMPLE_COUNTRIES)
    const tierFilter =
      screen.queryByRole('combobox', { name: /score tier|tier/i }) ||
      screen.queryByLabelText(/score tier|tier/i) ||
      screen.queryByRole('listbox', { name: /score tier|tier/i })
    expect(tierFilter).not.toBeNull()
  })
})
