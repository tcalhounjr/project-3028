/**
 * S6 Tests — PRO-43: Responsive page layouts
 *
 * Verifies that GlobalOverview, CountryPage, and ComparePage apply correct
 * responsive layout styles on mobile vs desktop viewports.
 *
 * ACs:
 *   PRO-43-a: GlobalOverview main content area has marginLeft 0 on mobile,
 *             240px on desktop (sidebar takes no space when hidden).
 *   PRO-43-b: CountryPage events+ML grid collapses to single column on mobile.
 *   PRO-43-c: ComparePage selector+results grid collapses to single column
 *             on mobile.
 *
 * Approach:
 *   - window.innerWidth is set before each describe block.
 *   - useIsMobile is NOT mocked — the hook reads window.innerWidth directly
 *     so setting the property produces the correct hook output.
 *   - All child components with external dependencies (recharts, leaflet,
 *     motion) are mocked at the module boundary.
 *   - DataContext is mocked using the same pattern as the s2 and s5 tests
 *     (vi.mock factory using require('react').createContext(null)).
 *
 * Layout assertions use .style property on container elements. The responsive
 * implementation is expected to apply inline styles (matching the existing
 * pattern in the codebase) that differ by breakpoint. If the implementation
 * uses CSS classes instead of inline styles, the tests must be updated —
 * do not modify the application code; report to business-analyst.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { CountryData, DataJson } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mock '../../../src/App' — avoid importing the monolith / @google/genai
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

// ---------------------------------------------------------------------------
// Mock recharts — jsdom cannot render SVG from recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rc">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Area: () => null,
  Radar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  ReferenceArea: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
}))

// ---------------------------------------------------------------------------
// Mock react-leaflet — Map component uses it; jsdom has no canvas/WebGL
// ---------------------------------------------------------------------------

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="circle-marker">{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ---------------------------------------------------------------------------
// Mock motion/react — avoid animation timing issues in jsdom
// ---------------------------------------------------------------------------

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...rest
    }: {
      children: React.ReactNode
      [key: string]: unknown
    }) => <div {...(rest as Record<string, unknown>)}>{children}</div>,
    nav: ({
      children,
      ...rest
    }: {
      children: React.ReactNode
      [key: string]: unknown
    }) => <nav {...(rest as Record<string, unknown>)}>{children}</nav>,
    aside: ({
      children,
      ...rest
    }: {
      children: React.ReactNode
      [key: string]: unknown
    }) => <aside {...(rest as Record<string, unknown>)}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Mock GlobalOverview heavy child components (Map, TopMovers, CountryTable,
// FilterBar) — this test is about layout, not component content.
// ---------------------------------------------------------------------------

vi.mock('../../../src/components/GlobalOverview/Map', () => ({
  default: () => <div data-testid="mock-map" />,
}))

vi.mock('../../../src/components/GlobalOverview/TopMovers', () => ({
  default: () => <div data-testid="mock-top-movers" />,
}))

vi.mock('../../../src/components/GlobalOverview/CountryTable', () => ({
  default: () => <div data-testid="mock-country-table" />,
}))

vi.mock('../../../src/components/GlobalOverview/FilterBar', () => ({
  default: () => <div data-testid="mock-filter-bar" />,
}))

// ---------------------------------------------------------------------------
// Mock CountryPage heavy child components
// ---------------------------------------------------------------------------

vi.mock('../../../src/components/CountryPage/StressTimeline', () => ({
  default: () => <div data-testid="mock-stress-timeline" />,
}))

vi.mock('../../../src/components/CountryPage/IndicatorBreakdown', () => ({
  default: () => <div data-testid="mock-indicator-breakdown" />,
}))

vi.mock('../../../src/components/CountryPage/EventsWidget', () => ({
  default: () => <div data-testid="mock-events-widget" />,
}))

vi.mock('../../../src/components/CountryPage/MLScoreGauge', () => ({
  default: () => <div data-testid="mock-ml-score-gauge" />,
}))

vi.mock('../../../src/components/CountryPage/AIInsightsPanel', () => ({
  default: () => <div data-testid="mock-ai-insights" />,
}))

vi.mock('../../../src/components/GlobalOverview/ScoreBadge', () => ({
  default: () => <div data-testid="mock-score-badge" />,
}))

// ---------------------------------------------------------------------------
// Mock ComparePage sub-components
// ---------------------------------------------------------------------------

vi.mock('../../../src/components/Compare/CountrySelector', () => ({
  default: ({ onConfirm }: { onConfirm: (isos: string[]) => void }) => (
    <div data-testid="mock-country-selector" />
  ),
}))

vi.mock('../../../src/components/Compare/CompareTimeline', () => ({
  default: () => <div data-testid="mock-compare-timeline" />,
}))

vi.mock('../../../src/components/Compare/IndicatorTable', () => ({
  default: () => <div data-testid="mock-indicator-table" />,
}))

vi.mock('../../../src/components/Compare/SharedEventLog', () => ({
  default: () => <div data-testid="mock-shared-event-log" />,
}))

// ---------------------------------------------------------------------------
// Imports AFTER all mocks
// ---------------------------------------------------------------------------

import GlobalOverview from '../../../src/pages/GlobalOverview'
import CountryPage from '../../../src/pages/CountryPage'
import ComparePage from '../../../src/pages/ComparePage'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
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

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

function makeCountry(iso: string, name: string): CountryData {
  return {
    iso,
    name,
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: 55.0,
    current_tier: 'elevated' as const,
    current_tier_label: 'Elevated Stress',
    one_year_change: -1.0,
    five_year_change: -3.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    events: [],
    ml_score: null,
    narrative: {
      headline: 'Test headline',
      summary: 'Test summary.',
      bullets: [],
      trend_direction: 'falling' as const,
    },
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

// ---------------------------------------------------------------------------
// PRO-43-a: GlobalOverview — main content container marginLeft
// ---------------------------------------------------------------------------

describe('MobileLayout — GlobalOverview: main content left margin', () => {
  beforeEach(stubMatchMedia)

  it('should apply marginLeft 0 to the main content area on mobile (width 375)', () => {
    setWindowWidth(375)
    window.dispatchEvent(new Event('resize'))

    const data = makeDataJson([makeCountry('HUN', 'Hungary')])

    render(
      <MemoryRouter initialEntries={['/']}>
        <DataContext.Provider value={data}>
          <GlobalOverview />
        </DataContext.Provider>
      </MemoryRouter>,
    )

    // The content wrapper div (sibling of the sidebar/nav area) should have
    // no left margin on mobile so it fills the full viewport width.
    // The implementation is expected to set marginLeft: '0' or marginLeft: 0
    // on the flex child that wraps TopBar + main.
    const main = screen.getByRole('main')
    const contentWrapper = main.parentElement as HTMLElement

    // Check the content wrapper (which sits next to the sidebar slot)
    // has marginLeft of 0 on mobile. The implementation may apply this to
    // the direct parent of <main> or to a wrapping div — we walk up one level.
    const wrapperStyle = contentWrapper?.style?.marginLeft ?? ''
    // Accept '0', '0px', or empty string (meaning default / not set, which
    // also means no sidebar offset is applied)
    expect(['0', '0px', '']).toContain(wrapperStyle)
  })

  it('should apply marginLeft 240px to the main content area on desktop (width 1024)', () => {
    setWindowWidth(1024)
    window.dispatchEvent(new Event('resize'))

    const data = makeDataJson([makeCountry('HUN', 'Hungary')])

    render(
      <MemoryRouter initialEntries={['/']}>
        <DataContext.Provider value={data}>
          <GlobalOverview />
        </DataContext.Provider>
      </MemoryRouter>,
    )

    const main = screen.getByRole('main')
    const contentWrapper = main.parentElement as HTMLElement

    expect(contentWrapper?.style?.marginLeft).toBe('240px')
  })
})

// ---------------------------------------------------------------------------
// PRO-43-b: CountryPage — events+ML grid collapses to single column on mobile
// ---------------------------------------------------------------------------

describe('MobileLayout — CountryPage: events+ML grid column count', () => {
  beforeEach(stubMatchMedia)

  function renderCountryPage(width: number) {
    setWindowWidth(width)
    window.dispatchEvent(new Event('resize'))

    const nic = makeCountry('NIC', 'Nicaragua')
    const data = makeDataJson([nic])

    return render(
      <MemoryRouter initialEntries={['/country/nic']}>
        <DataContext.Provider value={data}>
          <Routes>
            <Route path="/country/:iso" element={<CountryPage />} />
          </Routes>
        </DataContext.Provider>
      </MemoryRouter>,
    )
  }

  it('should render the events+ML grid as single column on mobile (width 375)', () => {
    renderCountryPage(375)

    // The grid that wraps EventsWidget and MLScoreGauge should use a single
    // column on mobile. We locate it by finding the parent of both mocked
    // child components.
    const eventsWidget = screen.getByTestId('mock-events-widget')
    const mlGauge = screen.getByTestId('mock-ml-score-gauge')

    // Both elements must share the same grid container parent
    const gridContainer = eventsWidget.parentElement as HTMLElement
    expect(gridContainer).toBe(mlGauge.parentElement)

    // On mobile the grid should collapse to a single column
    const cols = gridContainer?.style?.gridTemplateColumns ?? ''
    // Accept '1fr', 'repeat(1, 1fr)', or a single-track template
    expect(cols).toMatch(/^(1fr|repeat\(1,\s*1fr\))$/)
  })

  it('should render the events+ML grid as two columns on desktop (width 1024)', () => {
    renderCountryPage(1024)

    const eventsWidget = screen.getByTestId('mock-events-widget')
    const gridContainer = eventsWidget.parentElement as HTMLElement

    const cols = gridContainer?.style?.gridTemplateColumns ?? ''
    // On desktop the grid is expected to be 2-column: '1fr 1fr' or equivalent
    expect(cols).toMatch(/^(1fr 1fr|repeat\(2,\s*1fr\))$/)
  })
})

// ---------------------------------------------------------------------------
// PRO-43-c: ComparePage — selector+results grid collapses to single column
// ---------------------------------------------------------------------------

describe('MobileLayout — ComparePage: selector+results grid column count', () => {
  beforeEach(stubMatchMedia)

  function renderComparePage(width: number) {
    setWindowWidth(width)
    window.dispatchEvent(new Event('resize'))

    const data = makeDataJson([
      makeCountry('NIC', 'Nicaragua'),
      makeCountry('HUN', 'Hungary'),
    ])

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

  it('should render the selector+results grid as single column on mobile (width 375)', () => {
    renderComparePage(375)

    // The grid wrapping CountrySelector (left) and the results panel (right)
    // should collapse to a single column on mobile.
    const selector = screen.getByTestId('mock-country-selector')

    // Walk up to find the grid container (direct parent of the selector wrapper)
    const selectorWrapper = selector.parentElement as HTMLElement
    const gridContainer = selectorWrapper?.parentElement as HTMLElement

    const cols = gridContainer?.style?.gridTemplateColumns ?? ''
    // Accept '1fr', 'repeat(1, 1fr)', or any single-track template
    expect(cols).toMatch(/^(1fr|repeat\(1,\s*1fr\))$/)
  })

  it('should render the selector+results grid as two columns on desktop (width 1024)', () => {
    renderComparePage(1024)

    const selector = screen.getByTestId('mock-country-selector')
    const selectorWrapper = selector.parentElement as HTMLElement
    const gridContainer = selectorWrapper?.parentElement as HTMLElement

    const cols = gridContainer?.style?.gridTemplateColumns ?? ''
    // On desktop the grid is '280px 1fr' (fixed selector width + flexible results)
    expect(cols).toMatch(/^280px/)
  })
})
