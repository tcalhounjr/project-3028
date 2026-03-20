/**
 * S1-06 Leaflet Mock Setup
 * =========================
 * Leaflet and react-leaflet rely on browser APIs (SVG, canvas, ResizeObserver,
 * getBoundingClientRect) that jsdom does not provide. This setup file mocks
 * both packages at the module boundary so component tests can assert on
 * rendered accessible HTML without real map rendering.
 *
 * Import this file via the `setupFiles` option in a per-test vitest config,
 * or import it at the top of the test file.
 */

import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Stub browser APIs that Leaflet needs but jsdom does not provide
// ---------------------------------------------------------------------------

// Leaflet internally calls createElementNS for SVG — jsdom supports this,
// but getBoundingClientRect returns zeros, which is fine for our assertions.

// ResizeObserver stub — Leaflet uses it to track container size changes
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// ---------------------------------------------------------------------------
// Mock leaflet module
// ---------------------------------------------------------------------------

vi.mock('leaflet', () => {
  const icon = vi.fn(() => ({ options: {} }))
  const divIcon = vi.fn((opts: Record<string, unknown>) => ({ options: opts }))
  const latLng = vi.fn((lat: number, lng: number) => ({ lat, lng }))
  const latLngBounds = vi.fn(() => ({ isValid: () => true }))

  // Stub the default icon used by Leaflet markers
  const Icon = {
    Default: {
      prototype: { options: { iconUrl: '' } },
      mergeOptions: vi.fn(),
    },
  }

  const map = vi.fn(() => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setView: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getZoom: vi.fn(() => 2),
    getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  }))

  const tileLayer = vi.fn(() => ({
    addTo: vi.fn(),
  }))

  return {
    default: {
      icon,
      divIcon,
      latLng,
      latLngBounds,
      Icon,
      map,
      tileLayer,
      Marker: { prototype: { options: {} } },
    },
    icon,
    divIcon,
    latLng,
    latLngBounds,
    Icon,
    map,
    tileLayer,
  }
})

// ---------------------------------------------------------------------------
// Mock react-leaflet module
// ---------------------------------------------------------------------------

vi.mock('react-leaflet', () => {
  const React = require('react')

  /**
   * MapContainer — renders a div with data-testid="map-container"
   */
  const MapContainer = ({
    children,
    ...rest
  }: {
    children?: React.ReactNode
    [key: string]: unknown
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'map-container', ...rest },
      children
    )

  /**
   * TileLayer — renders nothing visible; just a marker for tile presence
   */
  const TileLayer = () => React.createElement('div', { 'data-testid': 'tile-layer', hidden: true })

  /**
   * Marker — renders a button with aria-label so tests can assert on it.
   * The component under test must forward the position and aria-label props
   * to react-leaflet's Marker. The mock surfaces them on the rendered element.
   */
  const Marker = ({
    children,
    position,
    ...rest
  }: {
    children?: React.ReactNode
    position?: [number, number]
    [key: string]: unknown
  }) =>
    React.createElement(
      'button',
      {
        'data-testid': 'map-marker',
        'data-lat': position?.[0],
        'data-lng': position?.[1],
        ...rest,
      },
      children
    )

  /**
   * CircleMarker — same shape as Marker stub. The Map component uses
   * CircleMarker instead of Marker; this mock surfaces position and
   * aria-label on a button element so assertions work without real SVG
   * rendering.
   *
   * The application code passes a ref callback that calls layer.getElement().
   * We use forwardRef so React passes the ref to us, then we call it with an
   * object that has a getElement() stub returning null. The Map component
   * guards with `if (el)` so null causes the aria-label block to be skipped
   * cleanly — the markers are still rendered and queryable by testid.
   */
  const CircleMarker = React.forwardRef(function CircleMarker(
    {
      children,
      center,
      ...rest
    }: {
      children?: React.ReactNode
      center?: [number, number]
      [key: string]: unknown
    },
    ref: React.Ref<unknown>
  ) {
    // Call the ref with a stub Leaflet-layer-like object so the application's
    // ref callback can call getElement() without throwing.
    React.useEffect(() => {
      if (typeof ref === 'function') {
        ref({ getElement: () => null })
        return () => ref(null)
      }
    }, [ref])

    return React.createElement(
      'button',
      {
        'data-testid': 'map-marker',
        'data-lat': center?.[0],
        'data-lng': center?.[1],
        ...rest,
      },
      children
    )
  })

  /**
   * Popup — renders its children inside a div
   */
  const Popup = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'map-popup' }, children)

  const Tooltip = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'map-tooltip' }, children)

  /**
   * useMap — returns a minimal map stub so components that call useMap() do
   * not throw
   */
  const useMap = vi.fn(() => ({
    setView: vi.fn(),
    getZoom: vi.fn(() => 2),
    getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
    fitBounds: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }))

  return { MapContainer, TileLayer, Marker, CircleMarker, Popup, Tooltip, useMap }
})
