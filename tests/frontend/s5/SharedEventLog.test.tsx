/**
 * S5 Tests — PRO-35: SharedEventLog component
 *
 * Verifies that:
 *   1. Events from both selected countries appear in the log.
 *   2. Events are sorted reverse-chronologically (most recent date first).
 *   3. Each event has a country-origin label (country name or ISO visible
 *      alongside or inside the event entry).
 *   4. A source link is NOT rendered when the URL fails a basic safety check
 *      (non-https scheme, or known unsafe pattern).
 *   5. An empty state message is rendered when no events exist.
 *
 * Implementation contract assumed:
 *   - SharedEventLog is the default export from
 *     src/components/Compare/SharedEventLog  (or similar path)
 *   - Props: countries — array of 2 or 3 CountryData objects with events
 *   - Each CountryEvent has: date (ISO string), description, source_url?
 *   - The component merges events from all countries, tags each with the
 *     originating country name or ISO code, and sorts descending by date.
 *   - When source_url is present AND passes the safety check, a link is
 *     rendered. Otherwise plain text is shown.
 *   - Safety check: URL must start with "https://" (rejects http://, mailto:,
 *     javascript:, data:, relative paths, etc.)
 *   - Empty state: if all countries have no events, a message is shown
 *     (e.g. "No events", "No events recorded", similar).
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CountryData, CountryEvent } from '../../../src/types/country'

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import SharedEventLog from '../../../src/components/Compare/SharedEventLog'

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

function makeEvent(overrides: Partial<CountryEvent> = {}): CountryEvent {
  return {
    date: '2023-01-01',
    description: 'Generic event description.',
    affected_indicators: [],
    ...overrides,
  }
}

function makeCountry(
  iso: string,
  name: string,
  events: CountryEvent[] = [],
): CountryData {
  return {
    iso,
    name,
    flag_url: `https://flagcdn.com/w80/${iso.toLowerCase().slice(0, 2)}.png`,
    current_score: 55,
    current_tier: 'elevated' as const,
    current_tier_label: 'Elevated Stress',
    one_year_change: -1.0,
    five_year_change: -3.0,
    latest_year: 2024,
    flags: [],
    indicators: {},
    timeline: [],
    events,
  }
}

// ---------------------------------------------------------------------------
// PRO-35: Events from both countries appear
// ---------------------------------------------------------------------------

describe('PRO-35: SharedEventLog shows events from all selected countries', () => {
  beforeEach(stubMatchMedia)

  it('renders an event description from the first selected country', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ date: '2023-03-01', description: 'Press freedom law enacted in Nicaragua.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ date: '2023-01-15', description: 'Judicial reform passed in Hungary.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(screen.getByText('Press freedom law enacted in Nicaragua.')).toBeInTheDocument()
  })

  it('renders an event description from the second selected country', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ date: '2023-03-01', description: 'Press freedom law enacted in Nicaragua.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ date: '2023-01-15', description: 'Judicial reform passed in Hungary.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(screen.getByText('Judicial reform passed in Hungary.')).toBeInTheDocument()
  })

  it('renders events from all 3 countries when 3 are provided', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ description: 'Nicaragua event A.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ description: 'Hungary event B.' }),
    ])
    const countryC = makeCountry('BRA', 'Brazil', [
      makeEvent({ description: 'Brazil event C.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB, countryC]} />)
    expect(screen.getByText('Nicaragua event A.')).toBeInTheDocument()
    expect(screen.getByText('Hungary event B.')).toBeInTheDocument()
    expect(screen.getByText('Brazil event C.')).toBeInTheDocument()
  })

  it('renders multiple events from a single country that has more than one', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ date: '2023-06-01', description: 'First Nicaragua event.' }),
      makeEvent({ date: '2022-06-01', description: 'Second Nicaragua event.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(screen.getByText('First Nicaragua event.')).toBeInTheDocument()
    expect(screen.getByText('Second Nicaragua event.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-35: Sorted reverse-chronologically
// ---------------------------------------------------------------------------

describe('PRO-35: SharedEventLog displays events in reverse chronological order', () => {
  beforeEach(stubMatchMedia)

  it('the most recent event appears before older events in the DOM', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ date: '2021-01-01', description: 'Oldest event.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ date: '2023-06-15', description: 'Most recent event.' }),
      makeEvent({ date: '2022-03-10', description: 'Middle event.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    const allText = document.body.innerHTML
    const posRecent = allText.indexOf('Most recent event.')
    const posMiddle = allText.indexOf('Middle event.')
    const posOldest = allText.indexOf('Oldest event.')
    expect(posRecent).toBeLessThan(posMiddle)
    expect(posMiddle).toBeLessThan(posOldest)
  })

  it('events with the same date maintain stable ordering without crashing', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ date: '2023-03-01', description: 'Same date event A.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ date: '2023-03-01', description: 'Same date event B.' }),
    ])
    expect(() => {
      render(<SharedEventLog countries={[countryA, countryB]} />)
    }).not.toThrow()
    expect(screen.getByText('Same date event A.')).toBeInTheDocument()
    expect(screen.getByText('Same date event B.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PRO-35: Each event has a country-origin label
// ---------------------------------------------------------------------------

describe('PRO-35: Each event entry has a country-origin label', () => {
  beforeEach(stubMatchMedia)

  it('Nicaragua is labelled alongside its event', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ description: 'Nicaragua event.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ description: 'Hungary event.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    // Country name or ISO must appear somewhere in the rendered output
    expect(document.body.innerHTML).toMatch(/Nicaragua|NIC/i)
  })

  it('Hungary is labelled alongside its event', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ description: 'Nicaragua event.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [
      makeEvent({ description: 'Hungary event.' }),
    ])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(document.body.innerHTML).toMatch(/Hungary|HUN/i)
  })

  it('both country origin labels are present when 2 countries have events', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [makeEvent({ description: 'Event A.' })])
    const countryB = makeCountry('HUN', 'Hungary', [makeEvent({ description: 'Event B.' })])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    // Both labels must be present in the DOM (as text or attribute values)
    expect(document.body.innerHTML).toMatch(/Nicaragua|NIC/i)
    expect(document.body.innerHTML).toMatch(/Hungary|HUN/i)
  })
})

// ---------------------------------------------------------------------------
// PRO-35: Source link safety check
// ---------------------------------------------------------------------------

describe('PRO-35: Source links are only rendered when URL passes safety check', () => {
  beforeEach(stubMatchMedia)

  it('renders a link when source_url is a valid https URL', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({
        description: 'Safe link event.',
        source_url: 'https://www.example.com/article',
      }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    const link = screen.queryByRole('link', { name: /safe link event/i })
    expect(link).not.toBeNull()
    expect(link).toHaveAttribute('href', 'https://www.example.com/article')
  })

  it('does NOT render a link when source_url uses http:// (insecure)', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({
        description: 'Insecure link event.',
        source_url: 'http://www.example.com/article',
      }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    expect(screen.queryByRole('link', { name: /insecure link event/i })).toBeNull()
  })

  it('does NOT render a link when source_url uses javascript: scheme', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({
        description: 'XSS event.',
        source_url: 'javascript:alert(1)',
      }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    expect(screen.queryByRole('link', { name: /xss event/i })).toBeNull()
  })

  it('does NOT render a link when source_url uses data: scheme', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({
        description: 'Data URI event.',
        source_url: 'data:text/html,<h1>oops</h1>',
      }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    expect(screen.queryByRole('link', { name: /data uri event/i })).toBeNull()
  })

  it('renders event description as plain text when the URL fails the safety check', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({
        description: 'Unsafe URL event description.',
        source_url: 'http://unsafe.example.com',
      }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    expect(screen.getByText('Unsafe URL event description.')).toBeInTheDocument()
  })

  it('does NOT render a link when source_url is absent', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ description: 'No URL event.', source_url: undefined }),
    ])
    render(<SharedEventLog countries={[countryA, makeCountry('HUN', 'Hungary')]} />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// PRO-35: Empty state
// ---------------------------------------------------------------------------

describe('PRO-35: SharedEventLog renders an empty state when no events exist', () => {
  beforeEach(stubMatchMedia)

  it('renders an empty-state message when both countries have no events', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [])
    const countryB = makeCountry('HUN', 'Hungary', [])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(screen.getByText(/no events/i)).toBeInTheDocument()
  })

  it('renders an empty-state message when countries have no events property', () => {
    const countryA: CountryData = {
      iso: 'NIC',
      name: 'Nicaragua',
      flag_url: 'https://flagcdn.com/w80/ni.png',
      current_score: 30,
      current_tier: 'critical',
      current_tier_label: 'Critical Stress',
      one_year_change: -2,
      five_year_change: -10,
      latest_year: 2024,
      flags: [],
      indicators: {},
      timeline: [],
      // events intentionally omitted
    }
    const countryB: CountryData = {
      iso: 'HUN',
      name: 'Hungary',
      flag_url: 'https://flagcdn.com/w80/hu.png',
      current_score: 55,
      current_tier: 'elevated',
      current_tier_label: 'Elevated Stress',
      one_year_change: -1,
      five_year_change: -3,
      latest_year: 2024,
      flags: [],
      indicators: {},
      timeline: [],
    }
    render(<SharedEventLog countries={[countryA, countryB]} />)
    expect(screen.getByText(/no events/i)).toBeInTheDocument()
  })

  it('does NOT render the empty-state message when events exist', () => {
    const countryA = makeCountry('NIC', 'Nicaragua', [
      makeEvent({ description: 'An actual event.' }),
    ])
    const countryB = makeCountry('HUN', 'Hungary', [])
    render(<SharedEventLog countries={[countryA, countryB]} />)
    // Empty state message must not appear alongside real events.
    expect(screen.queryByText(/no events/i)).not.toBeInTheDocument()
  })
})
