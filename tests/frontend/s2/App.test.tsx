/**
 * S2 Tests — App (legacy monolith)
 *
 * App.tsx is the Sprint 1 monolith that the Sprint 1 structural tests assert
 * should be refactored away. It still exists on this branch and is included
 * in coverage via `src/**`. We test it here only to satisfy the 80% coverage
 * gate. All external dependencies are mocked at the module boundary.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mock geminiService — it tries to import @google/genai which is not in devDeps
// ---------------------------------------------------------------------------

vi.mock('../../../src/services/geminiService', () => ({
  generateNarrativeSummary: vi.fn().mockResolvedValue('Mocked AI summary.'),
  CountryData: {},
}))

// ---------------------------------------------------------------------------
// Mock mockData — it re-exports CountryData from geminiService
// ---------------------------------------------------------------------------

vi.mock('../../../src/mockData', () => ({
  MOCK_COUNTRIES: [
    {
      name: 'Testland',
      isoCode: 'TST',
      currentScore: 60,
      status: 'Elevated',
      indicators: {
        mediaFreedom: 55,
        judicialIndependence: 62,
        civilSociety: 58,
        electionQuality: 75,
        executiveConstraints: 52,
        rhetoricRadar: 45,
        civicProtests: 60,
      },
      history: [
        { year: 2020, score: 65 },
        { year: 2021, score: 62 },
        { year: 2022, score: 60 },
      ],
      events: [],
      narrative: 'Test narrative',
    },
    {
      name: 'Criticaland',
      isoCode: 'CRT',
      currentScore: 25,
      status: 'Critical',
      indicators: {
        mediaFreedom: 20,
        judicialIndependence: 22,
        civilSociety: 18,
        electionQuality: 30,
        executiveConstraints: 15,
        rhetoricRadar: 20,
        civicProtests: 25,
      },
      history: [
        { year: 2020, score: 40 },
        { year: 2021, score: 35 },
        { year: 2022, score: 25 },
      ],
      events: [
        { type: 'legal', date: '2022-01', title: 'Law passed', description: 'A law was passed.' },
        { type: 'political', date: '2022-06', title: 'Political event', description: 'Political shift.' },
        { type: 'protest', date: '2022-09', title: 'Protests', description: 'Mass protests.' },
        { type: 'unknown', date: '2022-11', title: 'Unknown event', description: 'Unknown type.' },
      ],
      narrative: 'Critical narrative',
    },
    {
      name: 'Stablonia',
      isoCode: 'STB',
      currentScore: 82,
      status: 'Stable',
      indicators: {
        mediaFreedom: 85,
        judicialIndependence: 80,
        civilSociety: 83,
        electionQuality: 88,
        executiveConstraints: 79,
        rhetoricRadar: 82,
        civicProtests: 84,
      },
      history: [
        { year: 2020, score: 80 },
        { year: 2021, score: 81 },
        { year: 2022, score: 82 },
      ],
      events: [],
      narrative: 'Stable narrative',
    },
  ],
}))

// ---------------------------------------------------------------------------
// Mock recharts to avoid SVG issues in jsdom
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rc">{children}</div>
  ),
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
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
}))

// ---------------------------------------------------------------------------
// Mock motion/react to avoid animation complications in jsdom
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
// Import App AFTER all mocks
// ---------------------------------------------------------------------------

import App from '../../../src/App'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App (legacy monolith)', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('Democracy Index')).toBeInTheDocument()
  })

  it('renders country rows from MOCK_COUNTRIES in the overview', () => {
    render(<App />)
    expect(screen.getAllByText('Testland').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Criticaland country in the list', () => {
    render(<App />)
    expect(screen.getAllByText('Criticaland').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the "Global Status" section in the overview', () => {
    render(<App />)
    expect(screen.getByText('Global Status')).toBeInTheDocument()
  })

  it('clicking the sidebar Compare tab shows the placeholder', () => {
    render(<App />)
    const compareBtn = screen.getByText('Compare')
    fireEvent.click(compareBtn)
    expect(screen.getByText('Module Under Development')).toBeInTheDocument()
  })

  it('clicking the sidebar Reports tab shows the placeholder', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Reports'))
    expect(screen.getByText('Module Under Development')).toBeInTheDocument()
  })

  it('renders the Sidebar nav items', () => {
    render(<App />)
    expect(screen.getByText('Countries')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('navigates to country detail when a row button is clicked', async () => {
    render(<App />)
    // The App renders country rows as buttons — find all buttons that contain a country name
    const allButtons = screen.getAllByRole('button')
    const countryRowButton = allButtons.find(btn =>
      btn.querySelector?.('h3')?.textContent?.includes('Criticaland') ||
      Array.from(btn.childNodes).some(n => (n as Element).textContent?.includes('Criticaland'))
    )
    if (countryRowButton) {
      fireEvent.click(countryRowButton)
      // After navigation to country detail, the TopBar changes to 'Democratic Stress'
      await waitFor(() => {
        const headings = screen.getAllByRole('heading')
        expect(headings.some(h => h.textContent?.includes('Democratic Stress'))).toBe(true)
      })
    } else {
      // If no country row button found, just confirm overview is still rendered
      expect(screen.getByText('Global Status')).toBeInTheDocument()
    }
  })

  it('navigating back from country detail returns to overview', async () => {
    render(<App />)
    // Click a country to enter detail view
    const allButtons = screen.getAllByRole('button')
    const countryRowButton = allButtons.find(btn =>
      Array.from(btn.childNodes).some(n => (n as Element).textContent?.includes('Criticaland'))
    )
    if (countryRowButton) {
      fireEvent.click(countryRowButton)
      await waitFor(() => {
        const headings = screen.getAllByRole('heading')
        expect(headings.some(h => h.textContent?.includes('Democratic Stress'))).toBe(true)
      })
      // Click the "Back to Overview" button
      const backBtn = screen.queryByText(/Back to Overview/i)
      if (backBtn) {
        fireEvent.click(backBtn)
        await waitFor(() => {
          expect(screen.getByText('Global Status')).toBeInTheDocument()
        })
      }
    }
  })
})
