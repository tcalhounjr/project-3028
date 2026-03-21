/**
 * S6 Tests — PRO-41: Mobile navigation (hamburger button + slide-in drawer)
 *
 * The hamburger button and MobileDrawer are both owned by TopBar (which holds
 * drawerOpen state). Tests render TopBar (and optionally Sidebar) together.
 * useIsMobile is mocked directly so tests are not sensitive to jsdom's
 * window.innerWidth getter behaviour.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Mock useIsMobile — lets tests flip between mobile and desktop cleanly.
// ---------------------------------------------------------------------------

const mockIsMobile = { value: false }

vi.mock('../../../src/hooks/useIsMobile', () => ({
  default: () => mockIsMobile.value,
}))

// ---------------------------------------------------------------------------
// matchMedia stub — jsdom does not implement it.
// ---------------------------------------------------------------------------

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
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
// Import components AFTER mocks are defined.
// ---------------------------------------------------------------------------

import { Sidebar, TopBar } from '../../../src/components/Layout'

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

const renderLayout = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
      <TopBar title="Nav Test" />
    </MemoryRouter>,
  )

const renderTopBar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar title="Nav Test" />
    </MemoryRouter>,
  )

const NAV_ITEM_LABELS = ['Global Overview', 'Countries', 'Compare', 'Reports']

// ---------------------------------------------------------------------------
// Desktop — sidebar is visible, no hamburger in TopBar
// ---------------------------------------------------------------------------

describe('MobileNav: desktop viewport — sidebar is visible, no hamburger', () => {
  beforeEach(() => {
    stubMatchMedia()
    mockIsMobile.value = false
  })

  it('should render the sidebar on desktop', () => {
    renderLayout()
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('should render all nav items in the sidebar on desktop', () => {
    renderLayout()
    for (const label of NAV_ITEM_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('should NOT render a hamburger/menu button on desktop', () => {
    renderTopBar()
    expect(
      screen.queryByRole('button', { name: /open navigation menu/i }),
    ).not.toBeInTheDocument()
  })

  it('should show the "Democracy Index" brand text on desktop', () => {
    renderLayout()
    expect(screen.getByText('Democracy Index')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Mobile — hamburger renders in TopBar, drawer initially closed
// ---------------------------------------------------------------------------

describe('MobileNav: mobile viewport — hamburger renders, drawer initially closed', () => {
  beforeEach(() => {
    stubMatchMedia()
    mockIsMobile.value = true
  })

  it('should render a hamburger/menu button on mobile', () => {
    renderTopBar()
    expect(
      screen.getByRole('button', { name: /open navigation menu/i }),
    ).toBeInTheDocument()
  })

  it('hamburger button should have at least 44px tap target', () => {
    renderTopBar()
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i })
    const style = hamburger.getAttribute('style') ?? ''
    // Accept width/height 44px or min-width/min-height 44px
    expect(
      style.includes('44px') || hamburger.style.width === '44px' || hamburger.style.minWidth === '44px',
    ).toBe(true)
  })

  it('drawer should NOT be open before hamburger is clicked', () => {
    renderTopBar()
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })
})

// ---------------------------------------------------------------------------
// Clicking hamburger opens the drawer
// ---------------------------------------------------------------------------

describe('MobileNav: clicking hamburger opens the drawer', () => {
  beforeEach(() => {
    stubMatchMedia()
    mockIsMobile.value = true
  })

  it('should open the navigation drawer when the hamburger button is clicked', () => {
    renderTopBar()
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i })
    fireEvent.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')
  })

  it('should show all nav items inside the open drawer', () => {
    renderTopBar()
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    for (const label of NAV_ITEM_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('should show the "Democracy Index" brand text inside the open drawer', () => {
    renderTopBar()
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    expect(screen.getByText('Democracy Index')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Clicking a nav item in the open drawer closes it
// ---------------------------------------------------------------------------

describe('MobileNav: clicking a nav item in the open drawer closes the drawer', () => {
  beforeEach(() => {
    stubMatchMedia()
    mockIsMobile.value = true
  })

  it('should close the drawer after clicking the "Global Overview" nav item', () => {
    renderTopBar('/')
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Global Overview' }))
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })

  it('should close the drawer after clicking the "Compare" nav item', () => {
    renderTopBar('/compare')
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i })
    fireEvent.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })
})

// ---------------------------------------------------------------------------
// Drawer contains the same nav items as the desktop sidebar
// ---------------------------------------------------------------------------

describe('MobileNav: drawer contains all nav items present in the desktop sidebar', () => {
  beforeEach(() => {
    stubMatchMedia()
  })

  it('should render all four nav item labels in the open mobile drawer', () => {
    mockIsMobile.value = true
    renderTopBar()
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    for (const label of NAV_ITEM_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('desktop sidebar and mobile drawer contain the same nav item set', () => {
    // Desktop
    mockIsMobile.value = false
    const { unmount } = renderLayout()
    const desktopLabels = NAV_ITEM_LABELS.filter((l) => screen.queryByText(l))
    expect(desktopLabels).toHaveLength(NAV_ITEM_LABELS.length)
    unmount()

    // Mobile drawer
    mockIsMobile.value = true
    renderTopBar()
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    for (const label of NAV_ITEM_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})
