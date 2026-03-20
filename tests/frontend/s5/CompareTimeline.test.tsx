/**
 * S5 Tests — PRO-33: CompareTimeline component
 *
 * Verifies that:
 *   1. With 2 selected countries the chart renders 2 data lines.
 *   2. With 3 selected countries the chart renders 3 data lines.
 *   3. A legend item is rendered for each selected country by name.
 *   4. Band overlays (Safe / Watch / Danger) are referenced in the output.
 *   5. Changing the country set causes a re-render reflecting the new data.
 *
 * Implementation contract assumed:
 *   - CompareTimeline is the default export from
 *     src/components/Compare/CompareTimeline  (or similar path)
 *   - Props: countries — array of CountryData objects (2 or 3 entries)
 *   - Each country's timeline array has entries with { year, composite }
 *   - The chart renders one <Line> per country; recharts is mocked so the
 *     mock receives one Line call per country.
 *   - Band overlays are rendered as labelled reference areas or DOM nodes
 *     containing "Safe", "Watch", and "Danger" (case-insensitive).
 *   - A legend is rendered as a labelled container with each country name.
 *
 * Recharts is mocked at the module boundary so no SVG rendering occurs in
 * jsdom. A Line spy tracks how many times Line is called so we can assert
 * the correct number of series.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CountryData, TimelineEntry } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Line call counter — we need to know how many Line elements are rendered.
// The mock exposes a spy that records each call.
// ---------------------------------------------------------------------------

const lineSpy = vi.fn()

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  // CompareTimeline uses ComposedChart (not LineChart)
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="compare-line-chart">{children}</div>
  ),
  Line: (props: Record<string, unknown>) => {
    lineSpy(props)
    return <div data-testid="chart-line" data-name={props.name as string} />
  },
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceArea: (props: Record<string, unknown>) => (
    <div data-testid="reference-area" data-y1={props.y1 as number} data-y2={props.y2 as number} />
  ),
  ReferenceLine: () => null,
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import CompareTimeline from '../../../src/components/Compare/CompareTimeline'

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

function makeTimeline(baseScore = 60): TimelineEntry[] {
  return [2019, 2020, 2021, 2022, 2023, 2024].map((year) => ({
    year,
    composite: baseScore + (year - 2019),
    tier: 'elevated' as const,
    tier_label: 'Elevated',
    indicators: {},
  }))
}

function makeCountry(
  iso: string,
  name: string,
  overrides: Partial<CountryData> = {},
): CountryData {
  return {
    iso,
    name,
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: 55,
    current_tier: 'elevated' as const,
    current_tier_label: 'Elevated Stress',
    one_year_change: -1.5,
    five_year_change: -5.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: makeTimeline(55),
    ...overrides,
  }
}

const COUNTRY_A = makeCountry('NIC', 'Nicaragua', { timeline: makeTimeline(30) })
const COUNTRY_B = makeCountry('HUN', 'Hungary', { timeline: makeTimeline(55) })
const COUNTRY_C = makeCountry('BRA', 'Brazil', { timeline: makeTimeline(70) })

// ---------------------------------------------------------------------------
// PRO-33: 2 countries — 2 lines
// ---------------------------------------------------------------------------

describe('PRO-33: CompareTimeline with 2 countries renders 2 data lines', () => {
  beforeEach(() => {
    stubMatchMedia()
    lineSpy.mockClear()
  })

  it('renders the chart container without crashing', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    expect(screen.getByTestId('compare-line-chart')).toBeInTheDocument()
  })

  it('renders exactly 2 chart line elements for 2 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    const lines = screen.getAllByTestId('chart-line')
    expect(lines.length).toBe(2)
  })

  it('Line spy is called exactly 2 times for 2 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    expect(lineSpy).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------------------
// PRO-33: 3 countries — 3 lines
// ---------------------------------------------------------------------------

describe('PRO-33: CompareTimeline with 3 countries renders 3 data lines', () => {
  beforeEach(() => {
    stubMatchMedia()
    lineSpy.mockClear()
  })

  it('renders exactly 3 chart line elements for 3 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B, COUNTRY_C]} />)
    const lines = screen.getAllByTestId('chart-line')
    expect(lines.length).toBe(3)
  })

  it('Line spy is called exactly 3 times for 3 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B, COUNTRY_C]} />)
    expect(lineSpy).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// PRO-33: Legend shows country names
// ---------------------------------------------------------------------------

describe('PRO-33: CompareTimeline legend shows each country name', () => {
  beforeEach(() => {
    stubMatchMedia()
    lineSpy.mockClear()
  })

  it('renders country names Nicaragua and Hungary in legend/chart for 2 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    // Name may appear as a data-name attribute on chart-line elements,
    // or as visible legend text — accept either form.
    const container = screen.getByTestId('compare-line-chart').parentElement!
    const html = container.innerHTML
    expect(html).toMatch(/Nicaragua/i)
    expect(html).toMatch(/Hungary/i)
  })

  it('renders all 3 country names in output for 3 countries', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B, COUNTRY_C]} />)
    const container = screen.getByTestId('compare-line-chart').parentElement!
    const html = container.innerHTML
    expect(html).toMatch(/Nicaragua/i)
    expect(html).toMatch(/Hungary/i)
    expect(html).toMatch(/Brazil/i)
  })

  it('each Line element receives the country name as its name prop', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    const callNames = lineSpy.mock.calls.map((call) => call[0].name as string)
    expect(callNames.some((n) => /Nicaragua/i.test(n))).toBe(true)
    expect(callNames.some((n) => /Hungary/i.test(n))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-33: Band overlays (Safe / Watch / Danger)
// ---------------------------------------------------------------------------

describe('PRO-33: CompareTimeline renders Safe / Watch / Danger band overlays', () => {
  beforeEach(() => {
    stubMatchMedia()
    lineSpy.mockClear()
  })

  it('rendered output contains the "Safe" zone label', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    // The zone legend in the header renders text like "Safe (66–100)"
    expect(screen.getByText(/Safe/i)).toBeInTheDocument()
  })

  it('rendered output contains the "Watch" zone label', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    expect(screen.getByText(/Watch/i)).toBeInTheDocument()
  })

  it('rendered output contains the "Danger" zone label', () => {
    render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    expect(screen.getByText(/Danger/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-33: Switching countries causes re-render reflecting new data
// ---------------------------------------------------------------------------

describe('PRO-33: Switching countries updates the chart', () => {
  beforeEach(() => {
    stubMatchMedia()
    lineSpy.mockClear()
  })

  it('re-renders with new country set when props change', () => {
    const { rerender } = render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    lineSpy.mockClear()

    rerender(<CompareTimeline countries={[COUNTRY_B, COUNTRY_C]} />)
    // After rerender with 2 new countries, Line is called 2 more times.
    expect(lineSpy).toHaveBeenCalledTimes(2)
  })

  it('re-render from 2 to 3 countries adds a third line', () => {
    const { rerender } = render(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    lineSpy.mockClear()

    rerender(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B, COUNTRY_C]} />)
    expect(lineSpy).toHaveBeenCalledTimes(3)
  })

  it('re-render from 3 to 2 countries removes the third line', () => {
    const { rerender } = render(
      <CompareTimeline countries={[COUNTRY_A, COUNTRY_B, COUNTRY_C]} />,
    )
    lineSpy.mockClear()

    rerender(<CompareTimeline countries={[COUNTRY_A, COUNTRY_B]} />)
    expect(lineSpy).toHaveBeenCalledTimes(2)
  })
})
