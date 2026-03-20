/**
 * S2 Tests — IndicatorBreakdown
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CountryData, TimelineEntry } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mock recharts to avoid SVG rendering issues in jsdom
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  Tooltip: () => null,
}))

// ---------------------------------------------------------------------------
// Import component AFTER mock
// ---------------------------------------------------------------------------

import IndicatorBreakdown from '../../../src/components/CountryPage/IndicatorBreakdown'

// ---------------------------------------------------------------------------
// jsdom does not implement window.matchMedia — provide a default stub
// ---------------------------------------------------------------------------

function stubMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
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
// Helpers
// ---------------------------------------------------------------------------

function makeIndicators(): CountryData['indicators'] {
  return {
    media_freedom: { label: 'Media Freedom', value: 60.0, trend: 'stable' },
    judicial_independence: { label: 'Judicial Independence', value: 45.0, trend: 'declining' },
    civil_society_space: { label: 'Civil Society Space', value: 70.0, trend: 'improving' },
    election_quality: { label: 'Election Quality', value: 50.0, trend: 'rapidly_declining' },
    executive_constraints: { label: 'Executive Constraints', value: 55.0, trend: 'stable' },
    rhetoric_radar: { label: 'Rhetoric Radar', value: 40.0, trend: 'declining' },
    civic_protests: { label: 'Civic Protests', value: 65.0, trend: 'improving' },
  }
}

function makeTimeline(): TimelineEntry[] {
  return [2020, 2021, 2022, 2023, 2024].map((year) => ({
    year,
    composite: 55.0,
    tier: 'elevated' as const,
    tier_label: 'Elevated',
    indicators: {
      media_freedom: 60,
      judicial_independence: 45,
      civil_society_space: 70,
      election_quality: 50,
      executive_constraints: 55,
      rhetoric_radar: 40,
      civic_protests: 65,
    },
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IndicatorBreakdown', () => {
  beforeEach(() => {
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders heading "Indicator Breakdown"', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    expect(screen.getByRole('heading', { name: 'Indicator Breakdown' })).toBeInTheDocument()
  })

  it('renders all 7 indicator labels', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    // Labels appear at least once (the list panel renders them)
    expect(screen.getAllByText('Media Freedom').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Judicial Independence').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Civil Society Space').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Election Quality').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Executive Constraints').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Rhetoric Radar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Civic Protests').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Improving" trend badge for improving indicators', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    // TREND_LABELS maps 'improving' -> 'Improving'; CSS text-transform:uppercase is visual only
    const badges = screen.getAllByText('Improving')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Declining" trend badge for declining indicators', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    const badges = screen.getAllByText('Declining')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Rapidly Declining" trend badge for rapidly_declining indicators', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    expect(screen.getByText('Rapidly Declining')).toBeInTheDocument()
  })

  it('renders "Stable" trend badge for stable indicators', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    const badges = screen.getAllByText('Stable')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('does not crash when an indicator key is missing from the indicators object', () => {
    // Omit civic_protests — component returns null for missing keys without throwing
    const partial: CountryData['indicators'] = {
      media_freedom: { label: 'Media Freedom', value: 60.0, trend: 'stable' },
      judicial_independence: { label: 'Judicial Independence', value: 45.0, trend: 'declining' },
      civil_society_space: { label: 'Civil Society Space', value: 70.0, trend: 'improving' },
      election_quality: { label: 'Election Quality', value: 50.0, trend: 'rapidly_declining' },
      executive_constraints: { label: 'Executive Constraints', value: 55.0, trend: 'stable' },
      rhetoric_radar: { label: 'Rhetoric Radar', value: 40.0, trend: 'declining' },
      // civic_protests intentionally omitted
    }
    render(<IndicatorBreakdown indicators={partial} timeline={makeTimeline()} />)
    expect(screen.getByRole('heading', { name: 'Indicator Breakdown' })).toBeInTheDocument()
    // The omitted key should not appear in the list panel
    expect(screen.queryByText('Civic Protests')).not.toBeInTheDocument()
  })

  it('renders current score values as formatted decimals', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    // media_freedom value is 60.0 — rendered as "60.0"
    expect(screen.getByText('60.0')).toBeInTheDocument()
  })

  it('prefers-reduced-motion branch: reads window.matchMedia when matches is true', () => {
    stubMatchMedia(true)
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    expect(window.matchMedia as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    )
    expect(screen.getByRole('heading', { name: 'Indicator Breakdown' })).toBeInTheDocument()
  })

  it('renders the radar chart container', () => {
    render(<IndicatorBreakdown indicators={makeIndicators()} timeline={makeTimeline()} />)
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
  })
})
