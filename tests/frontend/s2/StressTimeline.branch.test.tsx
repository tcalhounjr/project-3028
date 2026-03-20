/**
 * S3 Branch Coverage — StressTimeline CustomTooltip
 * ===================================================
 * The CustomTooltip internal component is not exported but is exercised
 * by extracting the tooltip content prop from the rendered Recharts Tooltip.
 * We test the tooltip directly by rendering it as a standalone component
 * to cover the branches in lines 52-85 that are missed by the main tests.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// We need to render CustomTooltip directly. Since it's not exported, we
// use a test that renders StressTimeline with an unmocked Tooltip so the
// CustomTooltip receives props from a simulated active state.
//
// Strategy: render the tooltip branches by importing the module and
// locating the tooltip via a shallower render that passes real prop shapes.
// We can do this by not mocking recharts.Tooltip and instead passing the
// tooltip content component via a full render with simulated tooltip state.
//
// Because Recharts in jsdom does not fire real hover events, we test the
// CustomTooltip by extracting it from the module and rendering it directly.
// Since it's not exported, we access it by mocking recharts.Tooltip to
// capture and render its content prop.
// ---------------------------------------------------------------------------

import type { TimelineEntry, CountryEvent } from '../../../src/types/country'

// Capture the content prop passed to Tooltip by StressTimeline
let capturedContent: React.ReactNode = null

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
  Tooltip: ({ content }: { content: React.ReactElement }) => {
    // Capture the content element so tests can render it directly
    capturedContent = content
    return null
  },
  ReferenceArea: () => null,
  ReferenceLine: () => null,
}))

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

import StressTimeline from '../../../src/components/CountryPage/StressTimeline'

function makeTimeline(): TimelineEntry[] {
  return [2020, 2021, 2022, 2023].map((year) => ({
    year,
    composite: 55.0,
    tier: 'elevated' as const,
    tier_label: 'Elevated',
    indicators: {},
  }))
}

function makeEvent(overrides: Partial<CountryEvent> = {}): CountryEvent {
  return {
    date: '2022-06-01',
    description: 'Test event description.',
    affected_indicators: ['media_freedom'],
    ...overrides,
  }
}

describe('StressTimeline — CustomTooltip branch coverage', () => {
  beforeEach(() => {
    stubMatchMedia(false)
    capturedContent = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('CustomTooltip renders null when active is false', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(capturedContent).not.toBeNull()
    // Render the tooltip with active=false — should return null
    const { container } = render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: false,
        payload: [{ value: 55.0, dataKey: 'composite', payload: { year: 2022, composite: 55.0 } }],
        label: 2022,
      })
    )
    expect(container.firstChild).toBeNull()
  })

  it('CustomTooltip renders null when payload is empty', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(capturedContent).not.toBeNull()
    const { container } = render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: true,
        payload: [],
        label: 2022,
      })
    )
    expect(container.firstChild).toBeNull()
  })

  it('CustomTooltip renders null when payload is undefined', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(capturedContent).not.toBeNull()
    const { container } = render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: true,
        payload: undefined,
        label: 2022,
      })
    )
    expect(container.firstChild).toBeNull()
  })

  it('CustomTooltip renders score when active with payload and no events', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(capturedContent).not.toBeNull()
    render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: true,
        payload: [{ value: 62.5, dataKey: 'composite', payload: { year: 2021, composite: 62.5 } }],
        label: 2021,
      })
    )
    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText('62.5')).toBeInTheDocument()
  })

  it('CustomTooltip renders event descriptions when events are present', () => {
    const events = [makeEvent({ date: '2022-06-01' })]
    render(<StressTimeline timeline={makeTimeline()} events={events} />)
    expect(capturedContent).not.toBeNull()
    render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: true,
        payload: [{
          value: 55.0,
          dataKey: 'composite',
          payload: {
            year: 2022,
            composite: 55.0,
            events: [{ description: 'Test event description.', affected_indicators: ['media_freedom'] }],
          },
        }],
        label: 2022,
      })
    )
    expect(screen.getByText('Test event description.')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('CustomTooltip renders without events section when events array is empty', () => {
    render(<StressTimeline timeline={makeTimeline()} />)
    expect(capturedContent).not.toBeNull()
    render(
      React.cloneElement(capturedContent as React.ReactElement, {
        active: true,
        payload: [{
          value: 55.0,
          dataKey: 'composite',
          payload: { year: 2020, composite: 55.0, events: [] },
        }],
        label: 2020,
      })
    )
    // "Events" header only appears when events.length > 0
    expect(screen.queryByText('Events')).not.toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })
})
