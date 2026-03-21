import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Returns true when the viewport width is below 768px (mobile).
 * SSR-safe: initial value is false to avoid hydration mismatches.
 * Attaches a resize listener and cleans it up on unmount.
 */
export default function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set immediately on mount now that window is available
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}
