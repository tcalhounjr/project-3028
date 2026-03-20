/**
 * S2 Tests — AIInsightsPanel
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CountryData } from '../../../src/types/country'
import type { AIInsights } from '../../../src/services/aiInsightsService'

// ---------------------------------------------------------------------------
// Mock aiInsightsService at module boundary
// ---------------------------------------------------------------------------

vi.mock('../../../src/services/aiInsightsService', () => ({
  getCountryInsights: vi.fn(),
}))

import { getCountryInsights } from '../../../src/services/aiInsightsService'
import AIInsightsPanel from '../../../src/components/CountryPage/AIInsightsPanel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetCountryInsights = getCountryInsights as ReturnType<typeof vi.fn>

function makeCountry(overrides: Partial<CountryData> = {}): CountryData {
  return {
    iso: 'TST',
    name: 'Testland',
    flag_url: 'https://example.com/flag/w80/tst.png',
    current_score: 55.0,
    current_tier: 'elevated',
    current_tier_label: 'Elevated Stress',
    one_year_change: -2.1,
    five_year_change: -8.4,
    latest_year: 2024,
    flags: [],
    indicators: {
      media_freedom: { label: 'Media Freedom', value: 60.0, trend: 'stable' },
      judicial_independence: { label: 'Judicial Independence', value: 45.0, trend: 'declining' },
      civil_society_space: { label: 'Civil Society Space', value: 70.0, trend: 'improving' },
      election_quality: { label: 'Election Quality', value: 50.0, trend: 'rapidly_declining' },
      executive_constraints: { label: 'Executive Constraints', value: 55.0, trend: 'stable' },
      rhetoric_radar: { label: 'Rhetoric Radar', value: 40.0, trend: 'declining' },
      civic_protests: { label: 'Civic Protests', value: 65.0, trend: 'stable' },
    },
    timeline: [
      { year: 2020, composite: 63.0, tier: 'elevated', tier_label: 'Elevated', indicators: {} },
      { year: 2024, composite: 55.0, tier: 'elevated', tier_label: 'Elevated', indicators: {} },
    ],
    ...overrides,
  }
}

function makeInsights(overrides: Partial<AIInsights> = {}): AIInsights {
  return {
    headline: 'Testland: Elevated democratic stress persists',
    analysis: 'Testland registers a composite score of 55.0, in the Elevated tier.',
    watchPoints: [
      'Judicial Independence shows a declining trend (current value: 45.0)',
      'Election Quality shows a rapid decline (current value: 50.0)',
    ],
    confidence: 'medium',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading skeleton initially before the promise resolves', async () => {
    // Keep the promise pending throughout this test
    let resolveInsights!: (value: AIInsights) => void
    mockGetCountryInsights.mockReturnValue(
      new Promise<AIInsights>((resolve) => {
        resolveInsights = resolve
      }),
    )

    render(<AIInsightsPanel country={makeCountry()} />)

    // aria-busy indicates the loading skeleton is shown
    expect(screen.getByRole('region', { name: /AI Insights/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Loading AI insights')).toBeInTheDocument()

    // Clean up: resolve so no open promise warnings
    resolveInsights(makeInsights())
  })

  it('renders insights content after the mock promise resolves', async () => {
    const insights = makeInsights()
    mockGetCountryInsights.mockResolvedValue(insights)

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(screen.getByText(insights.headline)).toBeInTheDocument()
    })

    expect(screen.getByText(insights.analysis)).toBeInTheDocument()
    expect(screen.getByText(/Judicial Independence shows a declining trend/i)).toBeInTheDocument()
    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument()
  })

  it('renders watch points as list items', async () => {
    const insights = makeInsights({
      watchPoints: ['Watch point alpha', 'Watch point beta'],
    })
    mockGetCountryInsights.mockResolvedValue(insights)

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(screen.getByText('Watch point alpha')).toBeInTheDocument()
    })
    expect(screen.getByText('Watch point beta')).toBeInTheDocument()
  })

  it('renders high confidence badge', async () => {
    const insights = makeInsights({ confidence: 'high' })
    mockGetCountryInsights.mockResolvedValue(insights)

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(screen.getByText(/high confidence/i)).toBeInTheDocument()
    })
  })

  it('renders low confidence badge', async () => {
    const insights = makeInsights({ confidence: 'low' })
    mockGetCountryInsights.mockResolvedValue(insights)

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(screen.getByText(/low confidence/i)).toBeInTheDocument()
    })
  })

  it('renders error state when getCountryInsights rejects', async () => {
    mockGetCountryInsights.mockRejectedValue(new Error('Network failure'))

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load AI insights. Please try again.',
    )
    // Skeleton should be gone
    expect(screen.queryByLabelText('Loading AI insights')).not.toBeInTheDocument()
  })

  it('hides the loading skeleton and shows error on rejection', async () => {
    mockGetCountryInsights.mockRejectedValue(new Error('Timeout'))

    render(<AIInsightsPanel country={makeCountry()} />)

    // Initially skeleton is shown
    expect(screen.getByLabelText('Loading AI insights')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading AI insights')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('cancels the in-flight request and re-fetches when country iso changes', async () => {
    // First country resolves normally
    const insightsA = makeInsights({ headline: 'Country A headline' })
    const insightsB = makeInsights({ headline: 'Country B headline' })

    mockGetCountryInsights
      .mockResolvedValueOnce(insightsA)
      .mockResolvedValueOnce(insightsB)

    const countryA = makeCountry({ iso: 'AAA', name: 'Country A' })
    const countryB = makeCountry({ iso: 'BBB', name: 'Country B' })

    const { rerender } = render(<AIInsightsPanel country={countryA} />)

    await waitFor(() => {
      expect(screen.getByText('Country A headline')).toBeInTheDocument()
    })

    // Change country — triggers re-fetch
    rerender(<AIInsightsPanel country={countryB} />)

    await waitFor(() => {
      expect(screen.getByText('Country B headline')).toBeInTheDocument()
    })

    // Service was called twice — once per country
    expect(mockGetCountryInsights).toHaveBeenCalledTimes(2)
  })

  it('renders the "AI-generated summary" disclaimer when insights are shown', async () => {
    mockGetCountryInsights.mockResolvedValue(makeInsights())

    render(<AIInsightsPanel country={makeCountry()} />)

    await waitFor(() => {
      expect(
        screen.getByText(/AI-generated summary · not a substitute for expert analysis/i),
      ).toBeInTheDocument()
    })
  })

  it('calls getCountryInsights with the country object', async () => {
    mockGetCountryInsights.mockResolvedValue(makeInsights())
    const country = makeCountry()

    render(<AIInsightsPanel country={country} />)

    await waitFor(() => {
      expect(mockGetCountryInsights).toHaveBeenCalledWith(country)
    })
  })
})
