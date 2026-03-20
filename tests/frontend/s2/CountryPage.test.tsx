/**
 * S2 Tests — CountryPage page
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { DataJson, CountryData } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mock '../../../src/App' to avoid importing the old monolith (which depends
// on @google/genai unavailable in the test env). Factory must not reference
// variables declared outside because vi.mock is hoisted to top of file.
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

// ---------------------------------------------------------------------------
// Mock heavy sub-components
// ---------------------------------------------------------------------------

vi.mock('../../../src/components/CountryPage/StressTimeline', () => ({
  default: () => <div data-testid="mock-stress-timeline" />,
}))

vi.mock('../../../src/components/CountryPage/IndicatorBreakdown', () => ({
  default: () => <div data-testid="mock-indicator-breakdown" />,
}))

vi.mock('../../../src/services/aiInsightsService', () => ({
  getCountryInsights: vi.fn().mockResolvedValue({
    headline: 'AI headline',
    analysis: 'AI analysis',
    watchPoints: ['Watch A'],
    confidence: 'low' as const,
  }),
}))

// ---------------------------------------------------------------------------
// Import page and the mocked DataContext AFTER mocks are established
// ---------------------------------------------------------------------------

import CountryPage from '../../../src/pages/CountryPage'
import { DataContext } from '../../../src/App'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCountry(overrides: Partial<CountryData> = {}): CountryData {
  return {
    iso: 'NIC',
    name: 'Nicaragua',
    flag_url: 'https://example.com/flag/w80/nic.png',
    current_score: 28.4,
    current_tier: 'critical',
    current_tier_label: 'Critical Stress',
    one_year_change: -8.3,
    five_year_change: -15.2,
    latest_year: 2024,
    flags: [],
    indicators: {
      media_freedom: { label: 'Media Freedom', value: 20.0, trend: 'rapidly_declining' },
      judicial_independence: { label: 'Judicial Independence', value: 18.0, trend: 'declining' },
      civil_society_space: { label: 'Civil Society Space', value: 15.0, trend: 'rapidly_declining' },
      election_quality: { label: 'Election Quality', value: 12.0, trend: 'declining' },
      executive_constraints: { label: 'Executive Constraints', value: 10.0, trend: 'rapidly_declining' },
      rhetoric_radar: { label: 'Rhetoric Radar', value: 25.0, trend: 'declining' },
      civic_protests: { label: 'Civic Protests', value: 30.0, trend: 'stable' },
    },
    timeline: [
      { year: 2020, composite: 40.0, tier: 'critical', tier_label: 'Critical', indicators: {} },
      { year: 2024, composite: 28.4, tier: 'critical', tier_label: 'Critical', indicators: {} },
    ],
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

function renderPage(iso: string, data: DataJson | null) {
  return render(
    <MemoryRouter initialEntries={[`/country/${iso}`]}>
      <DataContext.Provider value={data}>
        <Routes>
          <Route path="/country/:iso" element={<CountryPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </DataContext.Provider>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CountryPage', () => {
  it('shows loading state when data is null', () => {
    renderPage('NIC', null)
    expect(screen.getByText('Loading data…')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows "Country data not available" when ISO is not found in data', () => {
    const data = makeDataJson([makeCountry({ iso: 'USA', name: 'United States' })])
    renderPage('ZZZ', data)
    expect(screen.getByText('Country data not available')).toBeInTheDocument()
  })

  it('shows a "Back to Global Overview" link when country is not found', () => {
    const data = makeDataJson([makeCountry({ iso: 'USA', name: 'United States' })])
    renderPage('ZZZ', data)
    expect(screen.getByRole('link', { name: 'Back to Global Overview' })).toBeInTheDocument()
  })

  it('renders the country name when found', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByRole('heading', { name: 'Nicaragua' })).toBeInTheDocument()
  })

  it('renders the country score', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByText('28.4')).toBeInTheDocument()
  })

  it('renders "Global Overview" back navigation link', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByRole('link', { name: /Global Overview/i })).toBeInTheDocument()
  })

  it('renders StressTimeline component', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByTestId('mock-stress-timeline')).toBeInTheDocument()
  })

  it('renders IndicatorBreakdown component', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByTestId('mock-indicator-breakdown')).toBeInTheDocument()
  })

  it('renders "No active risk flags" when flags is empty', () => {
    const data = makeDataJson([makeCountry({ flags: [] })])
    renderPage('NIC', data)
    expect(screen.getByText('No active risk flags')).toBeInTheDocument()
  })

  it('renders risk flag labels when flags are present', () => {
    const country = makeCountry({
      flags: [
        { flag: 'MEDIA_CAPTURE', label: 'Media Capture', description: 'State capture of media', year_triggered: 2020 },
      ],
    })
    const data = makeDataJson([country])
    renderPage('NIC', data)
    expect(screen.getByText('Media Capture')).toBeInTheDocument()
  })

  it('renders narrative headline and summary when narrative is present', () => {
    const country = makeCountry({
      narrative: {
        headline: 'Custom Narrative Headline',
        summary: 'Custom narrative summary text.',
        bullets: ['Bullet one', 'Bullet two'],
        trend_direction: 'declining',
      },
    })
    const data = makeDataJson([country])
    renderPage('NIC', data)
    expect(screen.getByText('Custom Narrative Headline')).toBeInTheDocument()
    expect(screen.getByText('Custom narrative summary text.')).toBeInTheDocument()
  })

  it('renders narrative bullets when present', () => {
    const country = makeCountry({
      narrative: {
        headline: 'Headline',
        summary: 'Summary',
        bullets: ['Point alpha', 'Point beta'],
        trend_direction: 'declining',
      },
    })
    const data = makeDataJson([country])
    renderPage('NIC', data)
    expect(screen.getByText('Point alpha')).toBeInTheDocument()
    expect(screen.getByText('Point beta')).toBeInTheDocument()
  })

  it('does not render narrative headline when narrative is absent', () => {
    const country = makeCountry({ narrative: undefined })
    const data = makeDataJson([country])
    renderPage('NIC', data)
    expect(screen.queryByText('Custom Narrative Headline')).not.toBeInTheDocument()
  })

  it('renders the latest year label', () => {
    const data = makeDataJson([makeCountry({ latest_year: 2024 })])
    renderPage('NIC', data)
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('renders the AI insights section label', async () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument()
    })
  })

  it('ISO lookup is case-insensitive (lowercase iso in URL)', () => {
    const data = makeDataJson([makeCountry({ iso: 'NIC' })])
    renderPage('nic', data)
    expect(screen.getByRole('heading', { name: 'Nicaragua' })).toBeInTheDocument()
  })

  it('renders the "Active Risk Flags" section label', () => {
    const data = makeDataJson([makeCountry()])
    renderPage('NIC', data)
    expect(screen.getByText('Active Risk Flags')).toBeInTheDocument()
  })

  it('does not render list items when narrative bullets array is empty', () => {
    const country = makeCountry({
      narrative: {
        headline: 'Headline with no bullets',
        summary: 'Summary text.',
        bullets: [],
        trend_direction: 'stable',
      },
    })
    const data = makeDataJson([country])
    renderPage('NIC', data)
    expect(screen.getByText('Headline with no bullets')).toBeInTheDocument()
    // No list items rendered for empty bullets
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
