/**
 * S1-06 Tests — Leaflet Map Component
 * =====================================
 * Tests for the GlobalMap (or equivalent) component that renders the Leaflet
 * choropleth / marker map on the Global Overview page.
 *
 * Leaflet is mocked via the setup file so jsdom can run these tests without
 * real DOM APIs. See tests/frontend/s1-06/setup.ts for the mock definitions.
 *
 * Fixture: tests/fixtures/frontend_data.json
 *   - 3 countries: Nicaragua (Critical), Hungary (Elevated), USA (Stable)
 *   - one country per tier to exercise all tier colours in the legend
 *
 * Component contract assumed:
 *   - Default export from src/components/GlobalMap.tsx (or similar path)
 *   - Accepts a `countries` prop (array of country records)
 *   - Renders a map container, one Marker per country, and a tier legend
 *   - Each Marker has an aria-label containing the country name and tier label
 *   - The legend contains tier labels: Critical, Elevated, Stable
 *   - No element uses Leaflet's default blue marker icon class (.leaflet-div-icon
 *     with default blue styling) — custom icons are used instead
 */

// Load mocks BEFORE any component imports
import './setup'

import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

import fixtureData from '../../fixtures/frontend_data.json'

// ---------------------------------------------------------------------------
// Dynamic component import — adjust this path when the component is created.
// The test is written against the public contract; the exact file path is the
// only thing that changes when the developer names the file.
// ---------------------------------------------------------------------------

// We use a lazy import pattern so the test file does not hard-fail at module
// load time when the component file does not yet exist. Instead it fails with
// a clear "module not found" error only when the tests actually run.
let GlobalMap: React.ComponentType<{ countries: typeof fixtureData.countries }>

beforeAll(async () => {
  try {
    const mod = await import('../../../src/components/GlobalOverview/Map')
    GlobalMap = mod.default ?? mod.GlobalMap
  } catch {
    // Component not yet created — tests below will fail with a descriptive
    // message rather than an opaque module error
    GlobalMap = () =>
      React.createElement(
        'div',
        null,
        'COMPONENT NOT YET IMPLEMENTED — src/components/GlobalMap.tsx missing'
      )
  }
})

const COUNTRIES = fixtureData.countries
// Expected: NIC=Critical, HUN=Elevated, USA=Stable
const CRITICAL_COUNTRY = COUNTRIES.find((c) => c.current_tier === 'critical')!
const ELEVATED_COUNTRY = COUNTRIES.find((c) => c.current_tier === 'elevated')!
const STABLE_COUNTRY = COUNTRIES.find((c) => c.current_tier === 'stable')!

// ---------------------------------------------------------------------------
// S1-06-01: Map container renders
// ---------------------------------------------------------------------------

describe('S1-06 — map container', () => {
  it('should render the map container element', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const container = screen.getByTestId('map-container')
    expect(container).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// S1-06-02: One marker per country
// ---------------------------------------------------------------------------

describe('S1-06 — markers', () => {
  it('should render exactly 3 marker elements (one per country in fixture)', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const markers = screen.getAllByTestId('map-marker')
    expect(markers).toHaveLength(3)
  })

  it('should render a marker with aria-label containing the Critical country name and tier', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const criticalName = CRITICAL_COUNTRY.name
    const criticalTier = CRITICAL_COUNTRY.current_tier_label
    // aria-label must contain both name and tier — case-insensitive
    const marker = screen.getByRole('button', {
      name: new RegExp(`${criticalName}.*${criticalTier}|${criticalTier}.*${criticalName}`, 'i'),
    })
    expect(marker).toBeInTheDocument()
  })

  it('should render a marker with aria-label containing the Elevated country name and tier', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const elevatedName = ELEVATED_COUNTRY.name
    const elevatedTier = ELEVATED_COUNTRY.current_tier_label
    const marker = screen.getByRole('button', {
      name: new RegExp(`${elevatedName}.*${elevatedTier}|${elevatedTier}.*${elevatedName}`, 'i'),
    })
    expect(marker).toBeInTheDocument()
  })

  it('should render a marker with aria-label containing the Stable country name and tier', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const stableName = STABLE_COUNTRY.name
    const stableTier = STABLE_COUNTRY.current_tier_label
    const marker = screen.getByRole('button', {
      name: new RegExp(`${stableName}.*${stableTier}|${stableTier}.*${stableName}`, 'i'),
    })
    expect(marker).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// S1-06-03: Tier legend renders with all three tier labels
// ---------------------------------------------------------------------------

describe('S1-06 — tier legend', () => {
  it('should render a tier legend element', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    // The legend must have a recognisable role or data-testid
    // Accept either aria role="complementary"/region or data-testid="tier-legend"
    const legend =
      screen.queryByTestId('tier-legend') ??
      screen.queryByRole('complementary') ??
      screen.queryByRole('region', { name: /legend/i })
    expect(legend, 'Tier legend element not found — expected data-testid="tier-legend" or role="complementary"').not.toBeNull()
  })

  it('should display the "Critical" tier label in the legend', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const legend = screen.getByTestId('tier-legend')
    expect(within(legend).getByText(/critical/i)).toBeInTheDocument()
  })

  it('should display the "Elevated" tier label in the legend', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const legend = screen.getByTestId('tier-legend')
    expect(within(legend).getByText(/elevated/i)).toBeInTheDocument()
  })

  it('should display the "Stable" tier label in the legend', () => {
    render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    const legend = screen.getByTestId('tier-legend')
    expect(within(legend).getByText(/stable/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// S1-06-04: No default Leaflet blue marker icon class
// ---------------------------------------------------------------------------

describe('S1-06 — custom marker icons', () => {
  it('should not use the Leaflet default blue marker icon class on any element', () => {
    const { container } = render(
    React.createElement(MemoryRouter, null,
      React.createElement(GlobalMap, { countries: COUNTRIES })
    )
  )
    // Leaflet's default icon applies the class "leaflet-default-icon-path"
    // and the img gets class "leaflet-marker-icon" without a custom icon set
    const defaultIconElements = container.querySelectorAll('.leaflet-default-icon-path')
    expect(defaultIconElements).toHaveLength(0)
  })
})
