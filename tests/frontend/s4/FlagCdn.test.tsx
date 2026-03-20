/**
 * S4 Tests — PRO-29: Flag CDN
 *
 * Verifies that:
 *   1. Every country in data.json has a flag_url field matching the flagcdn.com
 *      pattern: https://flagcdn.com/w{size}/{2-letter-iso}.png
 *   2. CountryPage header renders an <img> with src containing flagcdn.com.
 *   3. CountryTable rows render flag images with correct descriptive alt text
 *      ("Flag of {Country Name}").
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as fs from 'fs'
import * as path from 'path'
import type { CountryData, DataJson } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mocks — prevent leaflet / heavy sub-components from crashing jsdom
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

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

import CountryTable from '../../../src/components/GlobalOverview/CountryTable'
import CountryPage from '../../../src/pages/CountryPage'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const DATA_JSON_PATH = path.join(PROJECT_ROOT, 'public/data.json')

// Flag CDN URL pattern: https://flagcdn.com/w{width}/{2-letter-code}.png
const FLAG_CDN_PATTERN = /^https:\/\/flagcdn\.com\/w\d+\/[a-z]{2}\.png$/

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

const THREE_COUNTRIES: CountryData[] = [
  makeCountry({ iso: 'NIC', name: 'Nicaragua', flag_url: 'https://flagcdn.com/w80/ni.png' }),
  makeCountry({ iso: 'HUN', name: 'Hungary', flag_url: 'https://flagcdn.com/w80/hu.png', current_tier: 'elevated', current_tier_label: 'Elevated Stress' }),
  makeCountry({ iso: 'USA', name: 'United States', flag_url: 'https://flagcdn.com/w80/us.png', current_tier: 'elevated', current_tier_label: 'Elevated Stress' }),
]

// ---------------------------------------------------------------------------
// PRO-29: data.json flag_url field
// ---------------------------------------------------------------------------

describe('PRO-29: data.json flag_url fields match the flagcdn.com pattern', () => {
  let countries: CountryData[]

  beforeAll(() => {
    const raw = fs.readFileSync(DATA_JSON_PATH, 'utf-8')
    const json = JSON.parse(raw) as DataJson
    countries = json.countries
  })

  it('data.json contains at least one country', () => {
    expect(countries.length).toBeGreaterThan(0)
  })

  it('every country has a flag_url field', () => {
    for (const country of countries) {
      expect(
        country.flag_url,
        `Country "${country.name}" (${country.iso}) is missing flag_url`,
      ).toBeTruthy()
    }
  })

  it('every country flag_url matches https://flagcdn.com/w{size}/{2-letter-code}.png', () => {
    for (const country of countries) {
      expect(
        FLAG_CDN_PATTERN.test(country.flag_url),
        `Country "${country.name}" flag_url "${country.flag_url}" does not match the flagcdn.com pattern`,
      ).toBe(true)
    }
  })

  it('flag_url 2-letter code is lowercase', () => {
    for (const country of countries) {
      const match = country.flag_url.match(/\/([a-z]{2})\.png$/)
      expect(
        match,
        `Country "${country.name}" flag_url "${country.flag_url}" ISO code is not lowercase`,
      ).toBeTruthy()
    }
  })

  it('NIC (Nicaragua) flag_url points to ni.png', () => {
    const nic = countries.find((c) => c.iso === 'NIC')
    expect(nic).toBeDefined()
    expect(nic!.flag_url).toMatch(/\/ni\.png$/)
  })

  it('USA flag_url points to us.png', () => {
    const usa = countries.find((c) => c.iso === 'USA')
    expect(usa).toBeDefined()
    expect(usa!.flag_url).toMatch(/\/us\.png$/)
  })

  it('HUN (Hungary) flag_url points to hu.png', () => {
    const hun = countries.find((c) => c.iso === 'HUN')
    expect(hun).toBeDefined()
    expect(hun!.flag_url).toMatch(/\/hu\.png$/)
  })
})

// ---------------------------------------------------------------------------
// PRO-29: CountryPage renders flag image from flagcdn.com
// ---------------------------------------------------------------------------

describe('PRO-29: CountryPage header renders a flagcdn.com flag image', () => {
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

  it('CountryPage renders an img element when country data is available', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('CountryPage flag img src contains flagcdn.com', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const flagImg = screen
      .getAllByRole('img')
      .find((img) => (img as HTMLImageElement).src.includes('flagcdn.com'))
    expect(flagImg).toBeDefined()
    expect((flagImg as HTMLImageElement).src).toMatch(/flagcdn\.com/)
  })

  it('CountryPage flag img src matches the flagcdn.com pattern', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const flagImg = screen
      .getAllByRole('img')
      .find((img) => (img as HTMLImageElement).src.includes('flagcdn.com')) as HTMLImageElement
    expect(FLAG_CDN_PATTERN.test(flagImg.src)).toBe(true)
  })

  it('CountryPage flag img uses the larger size variant for the header (w160)', () => {
    // CountryPage replaces w80 with w160 for the header display.
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    const flagImg = screen
      .getAllByRole('img')
      .find((img) => (img as HTMLImageElement).src.includes('flagcdn.com')) as HTMLImageElement
    expect(flagImg.src).toMatch(/\/w160\//)
  })

  it('CountryPage flag img has a descriptive alt attribute containing the country name', () => {
    const country = makeCountry()
    renderCountryPage('NIC', makeDataJson([country]))
    // The alt should reference the country name (e.g. "Nicaragua flag" or similar)
    const flagImg = screen
      .getAllByRole('img')
      .find((img) => (img as HTMLImageElement).src.includes('flagcdn.com')) as HTMLImageElement
    expect(flagImg.alt).toMatch(/nicaragua/i)
  })

  it('CountryPage flag renders for Hungary (HUN → hu.png)', () => {
    const country = makeCountry({
      iso: 'HUN',
      name: 'Hungary',
      flag_url: 'https://flagcdn.com/w80/hu.png',
      current_tier: 'elevated',
      current_tier_label: 'Elevated Stress',
    })
    renderCountryPage('HUN', makeDataJson([country]))
    const flagImg = screen
      .getAllByRole('img')
      .find((img) => (img as HTMLImageElement).src.includes('flagcdn.com')) as HTMLImageElement
    expect(flagImg.src).toMatch(/\/hu\.png$/)
  })
})

// ---------------------------------------------------------------------------
// PRO-29: CountryTable rows render flag images with correct alt text
// ---------------------------------------------------------------------------

describe('PRO-29: CountryTable rows render flag images with correct alt text', () => {
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

  function renderTable(countries: CountryData[] = THREE_COUNTRIES) {
    return render(
      <MemoryRouter>
        <CountryTable countries={countries} />
      </MemoryRouter>,
    )
  }

  it('CountryTable renders a flag image for each country', () => {
    renderTable()
    const images = screen.getAllByRole('img')
    expect(images.length).toBe(THREE_COUNTRIES.length)
  })

  it('CountryTable renders flag image with alt "Flag of Nicaragua"', () => {
    renderTable()
    expect(screen.getByAltText('Flag of Nicaragua')).toBeInTheDocument()
  })

  it('CountryTable renders flag image with alt "Flag of Hungary"', () => {
    renderTable()
    expect(screen.getByAltText('Flag of Hungary')).toBeInTheDocument()
  })

  it('CountryTable renders flag image with alt "Flag of United States"', () => {
    renderTable()
    expect(screen.getByAltText('Flag of United States')).toBeInTheDocument()
  })

  it('CountryTable flag image src contains flagcdn.com', () => {
    renderTable()
    const imgs = screen.getAllByRole('img') as HTMLImageElement[]
    for (const img of imgs) {
      expect(img.src).toMatch(/flagcdn\.com/)
    }
  })

  it('CountryTable Nicaragua flag img src points to ni.png', () => {
    renderTable()
    const img = screen.getByAltText('Flag of Nicaragua') as HTMLImageElement
    expect(img.src).toMatch(/\/ni\.png$/)
  })

  it('CountryTable flag alt text format is "Flag of {Country Name}" for each row', () => {
    renderTable()
    for (const country of THREE_COUNTRIES) {
      expect(screen.getByAltText(`Flag of ${country.name}`)).toBeInTheDocument()
    }
  })

  it('CountryTable renders correctly when a single country is provided', () => {
    const single = [makeCountry()]
    renderTable(single)
    expect(screen.getByAltText('Flag of Nicaragua')).toBeInTheDocument()
  })
})
