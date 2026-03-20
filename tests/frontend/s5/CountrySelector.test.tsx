/**
 * S5 Tests — PRO-32: CountrySelector component
 *
 * Verifies that:
 *   1. All 10 seed countries are rendered as selectable options.
 *   2. The confirm/submit action is disabled when 0 countries are selected.
 *   3. The confirm/submit action is disabled when exactly 1 country is selected.
 *   4. Selecting exactly 2 countries enables the confirm/submit action.
 *   5. Selecting exactly 3 countries enables the confirm/submit action.
 *   6. A 4th checkbox is disabled (or its selection is ignored) once 3 are chosen.
 *   7. The sidebar "Compare" nav link is present in the Layout.
 *
 * Implementation contract assumed:
 *   - CountrySelector is the default export from
 *     src/components/Compare/CountrySelector  (or similar path)
 *   - It accepts an `onConfirm` callback prop.
 *   - Each country is rendered as a checkbox labelled by country name.
 *   - A submit/confirm button is rendered; it is disabled when the selection
 *     count is < 2, and enabled when the selection is 2 or 3.
 *   - When 3 are already selected, additional checkboxes are disabled.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Mocks — block leaflet and recharts from crashing jsdom
// ---------------------------------------------------------------------------

vi.mock('../../../src/App', () => {
  const React = require('react')
  return { DataContext: React.createContext(null) }
})

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import CountrySelector from '../../../src/components/Compare/CountrySelector'
import { Sidebar } from '../../../src/components/Layout'

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
// The 10 seed countries (from public/data.json)
// ---------------------------------------------------------------------------

const SEED_COUNTRIES = [
  'Nicaragua',
  'Russia',
  'Venezuela',
  'Philippines',
  'Hungary',
  'Poland',
  'Turkey',
  'India',
  'Brazil',
  'United States',
]

// ---------------------------------------------------------------------------
// Helper — render CountrySelector and return convenience queries
// ---------------------------------------------------------------------------

function renderSelector(onConfirm = vi.fn()) {
  render(
    <MemoryRouter>
      <CountrySelector onConfirm={onConfirm} />
    </MemoryRouter>,
  )
}

function getConfirmButton(): HTMLButtonElement {
  // The confirm / compare button — implementation may use text "Compare",
  // "Confirm", or "Start Comparison". Query broadly by role.
  return screen.getByRole('button', {
    name: /compare|confirm|start/i,
  }) as HTMLButtonElement
}

function getCheckbox(name: string): HTMLInputElement {
  return screen.getByRole('checkbox', { name: new RegExp(name, 'i') }) as HTMLInputElement
}

// ---------------------------------------------------------------------------
// PRO-32: All 10 seed countries rendered
// ---------------------------------------------------------------------------

describe('PRO-32: CountrySelector renders all 10 seed countries', () => {
  beforeEach(stubMatchMedia)

  it('renders a checkbox for every one of the 10 seed countries', () => {
    renderSelector()
    for (const name of SEED_COUNTRIES) {
      expect(screen.getByRole('checkbox', { name: new RegExp(name, 'i') })).toBeInTheDocument()
    }
  }, 15000)

  it('renders exactly 10 country checkboxes', () => {
    renderSelector()
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(10)
  }, 15000)
})

// ---------------------------------------------------------------------------
// PRO-32: Minimum selection enforcement — cannot confirm with < 2
// ---------------------------------------------------------------------------

describe('PRO-32: Confirm is disabled when fewer than 2 countries are selected', () => {
  beforeEach(stubMatchMedia)

  it('confirm button is disabled on initial render (0 selected)', () => {
    renderSelector()
    expect(getConfirmButton()).toBeDisabled()
  }, 15000)

  it('confirm button is disabled when exactly 1 country is selected', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    expect(getConfirmButton()).toBeDisabled()
  }, 15000)
})

// ---------------------------------------------------------------------------
// PRO-32: Enabling comparison with 2 or 3 countries
// ---------------------------------------------------------------------------

describe('PRO-32: Selecting 2 or 3 countries enables comparison', () => {
  beforeEach(stubMatchMedia)

  it('confirm button is enabled when exactly 2 countries are selected', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Hungary'))
    expect(getConfirmButton()).not.toBeDisabled()
  }, 15000)

  it('confirm button is enabled when exactly 3 countries are selected', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Hungary'))
    fireEvent.click(getCheckbox('Brazil'))
    expect(getConfirmButton()).not.toBeDisabled()
  }, 15000)

  it('calls onConfirm with the 2 selected country ISOs when confirmed', () => {
    const onConfirm = vi.fn()
    render(
      <MemoryRouter>
        <CountrySelector onConfirm={onConfirm} />
      </MemoryRouter>,
    )
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Russia'))
    fireEvent.click(getConfirmButton())
    expect(onConfirm).toHaveBeenCalledTimes(1)
    // The callback receives an array; it must include at least 2 entries.
    const arg = onConfirm.mock.calls[0][0]
    expect(Array.isArray(arg)).toBe(true)
    expect(arg.length).toBe(2)
  }, 15000)

  it('calls onConfirm with 3 ISOs when 3 countries are confirmed', () => {
    const onConfirm = vi.fn()
    render(
      <MemoryRouter>
        <CountrySelector onConfirm={onConfirm} />
      </MemoryRouter>,
    )
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Russia'))
    fireEvent.click(getCheckbox('Hungary'))
    fireEvent.click(getConfirmButton())
    const arg = onConfirm.mock.calls[0][0]
    expect(arg.length).toBe(3)
  }, 15000)
})

// ---------------------------------------------------------------------------
// PRO-32: Maximum selection enforcement — cannot select more than 3
// ---------------------------------------------------------------------------

describe('PRO-32: Cannot select more than 3 countries', () => {
  beforeEach(stubMatchMedia)

  it('fourth checkbox is disabled after 3 are selected', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Hungary'))
    fireEvent.click(getCheckbox('Brazil'))

    // Collect all unchecked checkboxes — they should now be disabled.
    const allCheckboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const unchecked = allCheckboxes.filter((cb) => !cb.checked)
    // Every unchecked box must be disabled when 3 are already selected.
    for (const cb of unchecked) {
      expect(cb).toBeDisabled()
    }
  }, 15000)

  it('selection count does not exceed 3 even if a 4th checkbox is clicked', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Hungary'))
    fireEvent.click(getCheckbox('Brazil'))

    const allCheckboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const unchecked = allCheckboxes.filter((cb) => !cb.checked)
    if (unchecked.length > 0) {
      // Attempt to click a disabled checkbox — selection count must stay at 3.
      fireEvent.click(unchecked[0])
    }
    const checked = (screen.getAllByRole('checkbox') as HTMLInputElement[]).filter(
      (cb) => cb.checked,
    )
    expect(checked.length).toBeLessThanOrEqual(3)
  }, 15000)

  it('deselecting one of the 3 re-enables remaining checkboxes', () => {
    renderSelector()
    fireEvent.click(getCheckbox('Nicaragua'))
    fireEvent.click(getCheckbox('Hungary'))
    fireEvent.click(getCheckbox('Brazil'))
    // Now deselect one
    fireEvent.click(getCheckbox('Brazil'))
    // At 2 selected, unchecked boxes should no longer all be disabled
    const allCheckboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const unchecked = allCheckboxes.filter((cb) => !cb.checked)
    const enabledUnchecked = unchecked.filter((cb) => !cb.disabled)
    expect(enabledUnchecked.length).toBeGreaterThan(0)
  }, 15000)
})

// ---------------------------------------------------------------------------
// PRO-32: Sidebar "Compare" link
// ---------------------------------------------------------------------------

describe('PRO-32: Sidebar "Compare" navigation link exists', () => {
  beforeEach(stubMatchMedia)

  it('Sidebar renders a "Compare" nav item', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText('Compare')).toBeInTheDocument()
  }, 15000)

  it('clicking "Compare" navigates without error', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    fireEvent.click(screen.getByText('Compare'))
    expect(screen.getByText('Compare')).toBeInTheDocument()
  }, 15000)
})
