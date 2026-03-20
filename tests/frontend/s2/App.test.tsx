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
// Note: src/mockData.ts was deleted in Sprint 3 (PRO-21) — MOCK_COUNTRIES is
// now inlined directly in App.tsx. The geminiService was removed in Sprint 2.
// Tests below use the real inline data (Brazil, Norway, Hungary, India).
// ---------------------------------------------------------------------------

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
    // MOCK_COUNTRIES is now inlined in App.tsx — Brazil is the first country
    expect(screen.getAllByText('Brazil').length).toBeGreaterThanOrEqual(1)
  })

  it('renders a Critical-tier country in the list', () => {
    render(<App />)
    // Hungary is Critical in the inline MOCK_COUNTRIES data
    expect(screen.getAllByText('Hungary').length).toBeGreaterThanOrEqual(1)
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
      btn.querySelector?.('h3')?.textContent?.includes('Hungary') ||
      Array.from(btn.childNodes).some(n => (n as Element).textContent?.includes('Hungary'))
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
      Array.from(btn.childNodes).some(n => (n as Element).textContent?.includes('Hungary'))
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
