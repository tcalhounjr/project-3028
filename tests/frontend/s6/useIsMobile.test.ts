/**
 * S6 Tests — PRO-41: useIsMobile hook
 *
 * Verifies the hook correctly reads window.innerWidth against the 768px
 * breakpoint and updates when the viewport is resized.
 *
 * Implementation contract assumed:
 *   - useIsMobile() returns false when window.innerWidth >= 768
 *   - useIsMobile() returns true when window.innerWidth < 768
 *   - The hook attaches a 'resize' listener and updates isMobile when
 *     window.innerWidth changes and a resize event fires.
 *   - SSR-safe: initial state before the first useEffect run is false.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useIsMobile from '../../../src/hooks/useIsMobile'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const originalInnerWidth = window.innerWidth

afterEach(() => {
  // Restore original innerWidth so tests don't bleed into each other
  setWindowWidth(originalInnerWidth)
})

// ---------------------------------------------------------------------------
// PRO-41: Hook returns false on desktop widths
// ---------------------------------------------------------------------------

describe('useIsMobile: desktop viewport (>= 768px)', () => {
  beforeEach(() => {
    setWindowWidth(1024)
  })

  it('should return false when window.innerWidth is 1024', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return false when window.innerWidth is exactly 768 (boundary — not mobile)', () => {
    setWindowWidth(768)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return false when window.innerWidth is 1440 (large desktop)', () => {
    setWindowWidth(1440)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PRO-41: Hook returns true on mobile widths
// ---------------------------------------------------------------------------

describe('useIsMobile: mobile viewport (< 768px)', () => {
  beforeEach(() => {
    setWindowWidth(375)
  })

  it('should return true when window.innerWidth is 375 (typical mobile)', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return true when window.innerWidth is 767 (one pixel below breakpoint)', () => {
    setWindowWidth(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return true when window.innerWidth is 320 (small mobile)', () => {
    setWindowWidth(320)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-41: Hook updates when window is resized
// ---------------------------------------------------------------------------

describe('useIsMobile: responds to resize events', () => {
  it('should update from false to true when viewport shrinks below 768', () => {
    setWindowWidth(1024)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      setWindowWidth(375)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  it('should update from true to false when viewport grows to 768 or above', () => {
    setWindowWidth(375)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)

    act(() => {
      setWindowWidth(1024)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(false)
  })

  it('should remain false when resizing between two desktop widths', () => {
    setWindowWidth(1024)
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      setWindowWidth(1280)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(false)
  })

  it('should remain true when resizing between two mobile widths', () => {
    setWindowWidth(375)
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      setWindowWidth(414)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  it('should remove the resize listener on unmount (no state update after unmount)', () => {
    setWindowWidth(1024)
    const { result, unmount } = renderHook(() => useIsMobile())

    unmount()

    // Changing width and firing resize after unmount must not throw
    // (the listener should have been removed)
    expect(() => {
      setWindowWidth(375)
      window.dispatchEvent(new Event('resize'))
    }).not.toThrow()

    // result.current should still reflect the value captured at unmount time
    expect(result.current).toBe(false)
  })
})
