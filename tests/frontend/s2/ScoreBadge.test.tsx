/**
 * S2 Tests — ScoreBadge
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ScoreBadge from '../../../src/components/GlobalOverview/ScoreBadge'

describe('ScoreBadge', () => {
  it('renders the tier label', () => {
    render(<ScoreBadge tier="stable" tierLabel="Stable" />)
    expect(screen.getByText('Stable')).toBeInTheDocument()
  })

  it('renders critical tier label', () => {
    render(<ScoreBadge tier="critical" tierLabel="Critical Stress" />)
    expect(screen.getByText('Critical Stress')).toBeInTheDocument()
  })

  it('renders elevated tier label', () => {
    render(<ScoreBadge tier="elevated" tierLabel="Elevated Stress" />)
    expect(screen.getByText('Elevated Stress')).toBeInTheDocument()
  })

  it('renders rapid_erosion tier label', () => {
    render(<ScoreBadge tier="rapid_erosion" tierLabel="Rapid Erosion" />)
    expect(screen.getByText('Rapid Erosion')).toBeInTheDocument()
  })

  it('falls back to stable style for unknown tier', () => {
    // TypeScript cast needed since 'unknown' is not a valid Tier
    render(<ScoreBadge tier={'unknown' as never} tierLabel="Unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
