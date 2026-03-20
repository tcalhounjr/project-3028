/**
 * S2 Tests — EventsWidget
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import EventsWidget from '../../../src/components/CountryPage/EventsWidget'
import type { CountryEvent } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CountryEvent> = {}): CountryEvent {
  return {
    date: '2023-04-15',
    description: 'Parliament passed emergency powers legislation.',
    affected_indicators: ['media_freedom', 'judicial_independence'],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventsWidget', () => {
  it('renders "No events recorded" when no events prop is provided', () => {
    render(<EventsWidget />)
    expect(screen.getByText('No events recorded')).toBeInTheDocument()
  })

  it('renders "No events recorded" when events is an empty array', () => {
    render(<EventsWidget events={[]} />)
    expect(screen.getByText('No events recorded')).toBeInTheDocument()
  })

  it('renders event description as a link when source_url is present', () => {
    const event = makeEvent({
      source_url: 'https://example.com/article',
      description: 'Emergency powers bill signed into law.',
    })
    render(<EventsWidget events={[event]} />)
    const link = screen.getByRole('link', { name: 'Emergency powers bill signed into law.' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/article')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders event description as plain text when source_url is absent', () => {
    const event = makeEvent({
      source_url: undefined,
      description: 'Opposition leader detained without charges.',
    })
    render(<EventsWidget events={[event]} />)
    expect(screen.getByText('Opposition leader detained without charges.')).toBeInTheDocument()
    // No link element should be present
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders human-readable labels for known affected_indicators keys', () => {
    const event = makeEvent({
      affected_indicators: ['media_freedom', 'election_quality'],
    })
    render(<EventsWidget events={[event]} />)
    expect(screen.getByText('Media Freedom')).toBeInTheDocument()
    expect(screen.getByText('Election Quality')).toBeInTheDocument()
  })

  it('falls back to raw key for unknown indicator keys', () => {
    const event = makeEvent({
      affected_indicators: ['unknown_indicator_xyz'],
    })
    render(<EventsWidget events={[event]} />)
    expect(screen.getByText('unknown_indicator_xyz')).toBeInTheDocument()
  })

  it('renders the event date', () => {
    const event = makeEvent({ date: '2022-11-08' })
    render(<EventsWidget events={[event]} />)
    expect(screen.getByText('2022-11-08')).toBeInTheDocument()
  })

  it('renders multiple events', () => {
    const events = [
      makeEvent({ description: 'First event.', affected_indicators: [] }),
      makeEvent({ description: 'Second event.', affected_indicators: [] }),
    ]
    render(<EventsWidget events={events} />)
    expect(screen.getByText('First event.')).toBeInTheDocument()
    expect(screen.getByText('Second event.')).toBeInTheDocument()
  })

  it('renders all 7 known indicator labels when all are present', () => {
    const event = makeEvent({
      affected_indicators: [
        'media_freedom',
        'judicial_independence',
        'civil_society_space',
        'election_quality',
        'executive_constraints',
        'rhetoric_radar',
        'civic_protests',
      ],
    })
    render(<EventsWidget events={[event]} />)
    expect(screen.getByText('Media Freedom')).toBeInTheDocument()
    expect(screen.getByText('Judicial Independence')).toBeInTheDocument()
    expect(screen.getByText('Civil Society Space')).toBeInTheDocument()
    expect(screen.getByText('Election Quality')).toBeInTheDocument()
    expect(screen.getByText('Executive Constraints')).toBeInTheDocument()
    expect(screen.getByText('Rhetoric Radar')).toBeInTheDocument()
    expect(screen.getByText('Civic Protests')).toBeInTheDocument()
  })

  it('renders heading "Democratic Events & Rhetoric"', () => {
    render(<EventsWidget />)
    expect(
      screen.getByRole('heading', { name: /Democratic Events.*Rhetoric/i }),
    ).toBeInTheDocument()
  })

  it('link onMouseEnter and onMouseLeave handlers do not throw', () => {
    const event = makeEvent({
      source_url: 'https://example.com/article',
      description: 'Law passed.',
    })
    render(<EventsWidget events={[event]} />)
    const link = screen.getByRole('link', { name: 'Law passed.' })
    expect(() => {
      fireEvent.mouseEnter(link)
      fireEvent.mouseLeave(link)
    }).not.toThrow()
  })
})
