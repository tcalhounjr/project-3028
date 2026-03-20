/**
 * S2 Tests — App routing
 *
 * Tests the top-level App routing. The / route now renders GlobalOverviewPage
 * (real data from DataContext), not LegacyAppContent.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mock recharts
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
// Mock react-leaflet
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
// Mock motion/react
// ---------------------------------------------------------------------------

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...(rest as Record<string, unknown>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Mock data.json fetch
// ---------------------------------------------------------------------------

const MOCK_DATA = {
  countries: [
    {
      iso: 'HUN',
      name: 'Hungary',
      flag_url: 'https://flagcdn.com/w80/hu.png',
      flag_url_large: 'https://flagcdn.com/w160/hu.png',
      current_score: 44.9,
      current_tier: 'elevated' as const,
      current_tier_label: 'Elevated',
      one_year_change: -1.2,
      five_year_change: -3.7,
      latest_year: 2023,
      region: 'Europe',
      flags: [],
      indicators: {},
      timeline: [],
      events: [],
      ml_score: null,
      narrative: { headline: 'Hungary: elevated stress', summary: 'Summary.', bullets: [], trend_direction: 'falling' },
    },
    {
      iso: 'BRA',
      name: 'Brazil',
      flag_url: 'https://flagcdn.com/w80/br.png',
      flag_url_large: 'https://flagcdn.com/w160/br.png',
      current_score: 54.6,
      current_tier: 'elevated' as const,
      current_tier_label: 'Elevated',
      one_year_change: 1.0,
      five_year_change: -2.0,
      latest_year: 2023,
      region: 'Americas',
      flags: [],
      indicators: {},
      timeline: [],
      events: [],
      ml_score: null,
      narrative: { headline: 'Brazil: elevated stress', summary: 'Summary.', bullets: [], trend_direction: 'rising' },
    },
  ],
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_DATA,
  }) as unknown as typeof fetch
})

// ---------------------------------------------------------------------------
// Import App AFTER all mocks
// ---------------------------------------------------------------------------

import App from '../../../src/App'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App routing', () => {
  it('renders without crashing', async () => {
    render(<App />)
    // App shell renders immediately
    expect(document.body).toBeTruthy()
  })

  it('loads data and renders country table with fetched countries', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByText('Hungary').length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })

  it('renders Brazil from fetched data', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByText('Brazil').length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })

  it('renders the map container', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('renders filter controls', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByLabelText('Region')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
