/**
 * S2 Tests — aiInsightsService
 * Unit tests for the mock AI insights service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCountryInsights } from '../../../src/services/aiInsightsService'
import type { CountryData } from '../../../src/types/country'

// Speed up tests by replacing setTimeout
vi.useFakeTimers()

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

describe('getCountryInsights', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  it('resolves with headline and analysis', async () => {
    const country = makeCountry()
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.headline).toBeTruthy()
    expect(result.analysis).toBeTruthy()
  })

  it('uses narrative headline when present', async () => {
    const country = makeCountry({
      narrative: {
        headline: 'Custom headline',
        summary: 'Custom summary',
        bullets: [],
        trend_direction: 'declining',
      },
    })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.headline).toBe('Custom headline')
    expect(result.analysis).toBe('Custom summary')
  })

  it('generates fallback headline when no narrative', async () => {
    const country = makeCountry({ narrative: undefined })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.headline).toContain('Testland')
    expect(result.headline).toContain('55.0')
  })

  it('mentions "declined" when five_year_change is negative', async () => {
    const country = makeCountry({ five_year_change: -8.4, narrative: undefined })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.analysis).toContain('declined')
  })

  it('mentions "improved" when five_year_change is positive', async () => {
    const country = makeCountry({ five_year_change: 5.0, narrative: undefined })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.analysis).toContain('improved')
  })

  it('returns declining/rapidly_declining indicators as watch-points', async () => {
    const country = makeCountry()
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    // judicial_independence (declining), election_quality (rapidly_declining), rhetoric_radar (declining)
    expect(result.watchPoints.length).toBeGreaterThanOrEqual(2)
    expect(result.watchPoints.some((w) => w.includes('Judicial Independence') || w.includes('Election Quality'))).toBe(true)
  })

  it('caps watch-points at 3', async () => {
    const country = makeCountry()
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.watchPoints.length).toBeLessThanOrEqual(3)
  })

  it('returns fallback watch-point when no declining indicators', async () => {
    const country = makeCountry({
      indicators: {
        media_freedom: { label: 'Media Freedom', value: 80.0, trend: 'improving' },
        judicial_independence: { label: 'Judicial Independence', value: 85.0, trend: 'stable' },
        civil_society_space: { label: 'Civil Society Space', value: 90.0, trend: 'improving' },
        election_quality: { label: 'Election Quality', value: 88.0, trend: 'stable' },
        executive_constraints: { label: 'Executive Constraints', value: 82.0, trend: 'improving' },
        rhetoric_radar: { label: 'Rhetoric Radar', value: 75.0, trend: 'stable' },
        civic_protests: { label: 'Civic Protests', value: 78.0, trend: 'improving' },
      },
    })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.watchPoints.length).toBe(1)
    expect(result.watchPoints[0]).toContain('no rapidly deteriorating indicators')
  })

  it('confidence is low when 0 flags', async () => {
    const country = makeCountry({ flags: [] })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.confidence).toBe('low')
  })

  it('confidence is medium when 1–2 flags', async () => {
    const country = makeCountry({
      flags: [
        { flag: 'MEDIA_CAPTURE', label: 'Media Capture', description: 'desc', year_triggered: 2022 },
      ],
    })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.confidence).toBe('medium')
  })

  it('confidence is high when 3+ flags', async () => {
    const country = makeCountry({
      flags: [
        { flag: 'A', label: 'A', description: 'a', year_triggered: 2020 },
        { flag: 'B', label: 'B', description: 'b', year_triggered: 2021 },
        { flag: 'C', label: 'C', description: 'c', year_triggered: 2022 },
      ],
    })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.confidence).toBe('high')
  })

  it('mentions active risk flags count in fallback analysis', async () => {
    const country = makeCountry({
      flags: [{ flag: 'X', label: 'X', description: 'x', year_triggered: 2023 }],
      narrative: undefined,
    })
    const promise = getCountryInsights(country)
    vi.runAllTimers()
    const result = await promise
    expect(result.analysis).toContain('1 active risk flag')
  })
})
