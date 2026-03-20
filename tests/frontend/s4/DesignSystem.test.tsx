/**
 * S4 Tests — PRO-26: Civic Vigil design system
 *
 * Verifies that:
 *   1. index.css defines the required Civic Vigil CSS custom properties.
 *   2. CountryTable renders with font-family referencing Manrope.
 *   3. CountryPage header renders with a flag image sourced from flagcdn.com.
 *   4. Manrope font is referenced in either index.css or index.html.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import * as fs from 'fs'
import * as path from 'path'
import type { CountryData, DataJson } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mocks — prevent leaflet/recharts/geminiService from crashing jsdom
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
  default: () => <div data-testid="mock-ml-gauge" />,
}))

vi.mock('../../../src/components/CountryPage/AIInsightsPanel', () => ({
  default: () => <div data-testid="mock-ai-insights" />,
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { Route, Routes } from 'react-router-dom'
import CountryTable from '../../../src/components/GlobalOverview/CountryTable'
import CountryPage from '../../../src/pages/CountryPage'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const INDEX_CSS = path.join(PROJECT_ROOT, 'src/index.css')
const INDEX_HTML = path.join(PROJECT_ROOT, 'index.html')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCountry(overrides: Partial<CountryData> = {}): CountryData {
  return {
    iso: 'NIC',
    name: 'Nicaragua',
    flag_url: 'https://flagcdn.com/w80/ni.png',
    current_score: 28.5,
    current_tier: 'critical',
    current_tier_label: 'Critical Stress',
    one_year_change: -3.2,
    five_year_change: -12.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    ...overrides,
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
// PRO-26: index.css CSS custom properties
// ---------------------------------------------------------------------------

describe('PRO-26: index.css defines Civic Vigil CSS custom properties', () => {
  let cssSource: string

  beforeAll(() => {
    cssSource = fs.readFileSync(INDEX_CSS, 'utf-8')
  })

  it('defines --color-navy', () => {
    expect(cssSource).toMatch(/--color-navy\s*:/)
  })

  it('defines --color-critical', () => {
    expect(cssSource).toMatch(/--color-critical\s*:/)
  })

  it('defines --color-elevated', () => {
    expect(cssSource).toMatch(/--color-elevated\s*:/)
  })

  it('defines --color-stable', () => {
    expect(cssSource).toMatch(/--color-stable\s*:/)
  })

  it('defines --color-bg', () => {
    expect(cssSource).toMatch(/--color-bg\s*:/)
  })

  it('defines --color-surface', () => {
    expect(cssSource).toMatch(/--color-surface\s*:/)
  })
})

// ---------------------------------------------------------------------------
// PRO-26: Manrope font reference
// ---------------------------------------------------------------------------

describe('PRO-26: Manrope font is referenced in the project', () => {
  it('index.css contains a reference to Manrope font', () => {
    const cssSource = fs.readFileSync(INDEX_CSS, 'utf-8')
    expect(cssSource).toMatch(/Manrope/)
  })

  it('index.html or index.css references Manrope (at least one location)', () => {
    const cssSource = fs.readFileSync(INDEX_CSS, 'utf-8')
    const htmlSource = fs.readFileSync(INDEX_HTML, 'utf-8')
    const manropeInCss = /Manrope/.test(cssSource)
    const manropeInHtml = /Manrope/.test(htmlSource)
    expect(manropeInCss || manropeInHtml).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-26: CountryTable renders with Manrope font-family in its container
// ---------------------------------------------------------------------------

describe('PRO-26: CountryTable applies Manrope font-family', () => {
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

  it('CountryTable renders a table element', () => {
    render(
      <MemoryRouter>
        <CountryTable countries={[makeCountry()]} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('CountryTable table element has font-family including Manrope', () => {
    render(
      <MemoryRouter>
        <CountryTable countries={[makeCountry()]} />
      </MemoryRouter>,
    )
    const table = screen.getByRole('table')
    // The inline style on the table element references Manrope
    expect(table.style.fontFamily).toMatch(/Manrope/i)
  })
})

// ---------------------------------------------------------------------------
// PRO-26: CountryPage header renders with flag image and country name heading
// ---------------------------------------------------------------------------

describe('PRO-26: CountryPage header renders design system elements', () => {
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

  function renderCountryPage(iso: string, data: DataJson | null) {
    return render(
      <MemoryRouter initialEntries={[`/country/${iso}`]}>
        <DataContext.Provider value={data}>
          <Routes>
            <Route path="/country/:iso" element={<CountryPage />} />
          </Routes>
        </DataContext.Provider>
      </MemoryRouter>,
    )
  }

  it('CountryPage header renders the country name as an h1', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    expect(screen.getByRole('heading', { level: 1, name: 'Nicaragua' })).toBeInTheDocument()
  })

  it('CountryPage header renders a flag image with src containing flagcdn.com', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const flagImg = screen.getAllByRole('img').find(
      (img) => (img as HTMLImageElement).src.includes('flagcdn.com'),
    )
    expect(flagImg).toBeDefined()
    expect((flagImg as HTMLImageElement).src).toMatch(/flagcdn\.com/)
  })

  it('CountryPage renders with Manrope font-family on the main element', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const main = screen.getByRole('main')
    expect(main.style.fontFamily).toMatch(/Manrope/i)
  })
})
