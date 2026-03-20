/**
 * S2 Tests — StressTimeline
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { TimelineEntry, CountryEvent } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Mock recharts to avoid SVG rendering issues in jsdom
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceArea: () => null,
  ReferenceLine: () => null,
}))

// ---------------------------------------------------------------------------
// Import component AFTER mock is established
// ---------------------------------------------------------------------------

import StressTimeline from '../../../src/components/CountryPage/StressTimeline'

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

function makeTimeline(years: number[] = [2020, 2021, 2022, 2023, 2024]): TimelineEntry[] {
  return years.map((year) => ({
    year,
    composite: 55.0 + year - 2020,
    tier: 'elevated' as const,
    tier_label: 'Elevated',
    indicators: {},
  }))
}

function makeEvent(overrides: Partial<CountryEvent> = {}): CountryEvent {
  return {
    date: '2022-06-01',
    description: 'Media law amended restricting independent outlets.',
    affected_indicators: ['media_freedom'],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StressTimeline', () => {
  beforeEach(() => {
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders heading "Democratic Stress Timeline"', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(
      screen.getByRole('heading', { name: 'Democratic Stress Timeline' }),
    ).toBeInTheDocument()
  })

  it('renders without events prop (events omitted)', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('renders with events prop containing entries', () => {
    const events = [
      makeEvent({ date: '2022-03-15' }),
      makeEvent({ date: '2023-07-20', description: 'Election irregularities reported.' }),
    ]
    render(<StressTimeline timeline={makeTimeline()} events={events} />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Democratic Stress Timeline' })).toBeInTheDocument()
  })

  it('renders with an empty events array without crashing', () => {
    render(<StressTimeline timeline={makeTimeline()} events={[]} />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('prefers-reduced-motion branch: reads window.matchMedia when matches is true', () => {
    stubMatchMedia(true)
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(window.matchMedia as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    )
    expect(screen.getByRole('heading', { name: 'Democratic Stress Timeline' })).toBeInTheDocument()
  })

  it('prefers-reduced-motion branch: reads window.matchMedia when matches is false', () => {
    stubMatchMedia(false)
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(window.matchMedia as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    )
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('renders with a single timeline entry without crashing', () => {
    render(<StressTimeline timeline={makeTimeline([2024])} />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('renders event with invalid year string without crashing', () => {
    const badEvent = makeEvent({ date: 'invalid-date' })
    render(<StressTimeline timeline={makeTimeline()} events={[badEvent]} />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })
})
