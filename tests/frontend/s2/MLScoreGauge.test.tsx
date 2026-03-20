/**
 * S2 Tests — MLScoreGauge
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MLScoreGauge from '../../../src/components/CountryPage/MLScoreGauge'

describe('MLScoreGauge', () => {
  it('shows "Score not available" when mlScore is undefined', () => {
    render(<MLScoreGauge />)
    expect(screen.getByText('Score not available')).toBeInTheDocument()
  })

  it('shows "Score not available" when mlScore.value is null', () => {
    render(
      <MLScoreGauge
        mlScore={{ value: null, label: 'Beta', description: '', unit: '%', is_stub: true }}
      />,
    )
    expect(screen.getByText('Score not available')).toBeInTheDocument()
  })

  it('renders the percentage value when score is present', () => {
    render(
      <MLScoreGauge
        mlScore={{ value: 73, label: 'Beta', description: '', unit: '%', is_stub: false }}
      />,
    )
    expect(screen.getByText('73%')).toBeInTheDocument()
  })

  it('renders progressbar with correct aria attributes', () => {
    render(
      <MLScoreGauge
        mlScore={{ value: 42, label: 'Beta', description: '', unit: '%', is_stub: false }}
      />,
    )
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders the beta label when provided', () => {
    render(
      <MLScoreGauge
        mlScore={{ value: 50, label: 'Beta v0.1', description: '', unit: '%', is_stub: false }}
      />,
    )
    expect(screen.getByText('Beta v0.1')).toBeInTheDocument()
  })

  it('renders the uncertainty disclaimer', () => {
    render(
      <MLScoreGauge
        mlScore={{ value: 60, label: 'Beta', description: '', unit: '%', is_stub: false }}
      />,
    )
    expect(screen.getByText(/Experimental 3-year erosion probability/i)).toBeInTheDocument()
  })

  it('renders heading "ML Erosion Risk"', () => {
    render(<MLScoreGauge />)
    expect(screen.getByRole('heading', { name: /ML Erosion Risk/i })).toBeInTheDocument()
  })
})
