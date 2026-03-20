import 'leaflet/dist/leaflet.css'
import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import type { CountryData, Tier } from '../../types/country'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<Tier, string> = {
  critical: '#C62828',
  elevated: '#F9A825',
  stable: '#78909C',
  rapid_erosion: '#B71C1C',
}

const TIER_LABELS: Record<Tier, string> = {
  critical: 'Critical',
  elevated: 'Elevated',
  stable: 'Stable',
  rapid_erosion: 'Rapid Erosion',
}

// Static coordinates keyed by ISO alpha-3
const COUNTRY_COORDS: Record<string, [number, number]> = {
  HUN: [47.16, 19.50],
  POL: [51.92, 19.14],
  IND: [20.59, 78.96],
  TUR: [38.96, 35.24],
  BRA: [-14.24, -51.93],
  USA: [37.09, -95.71],
  VEN: [6.42, -66.59],
  RUS: [61.52, 105.32],
  NIC: [12.87, -85.21],
  PHL: [12.88, 121.77],
}

const LEGEND_ITEMS: Array<{ tier: Tier; label: string }> = [
  { tier: 'critical', label: 'Critical' },
  { tier: 'elevated', label: 'Elevated' },
  { tier: 'stable', label: 'Stable' },
]

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function TierLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '12px',
        zIndex: 800,
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
      data-testid="tier-legend"
      role="complementary"
      aria-label="Map tier legend"
    >
      {LEGEND_ITEMS.map(({ tier, label }) => (
        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: TIER_COLORS[tier],
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: '#6C6C70',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MapProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Map component
// ---------------------------------------------------------------------------

export default function Map({ countries }: MapProps) {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', height: '420px', borderRadius: '4px', overflow: 'hidden' }}>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {countries.map((country) => {
          const coords = COUNTRY_COORDS[country.iso]
          if (!coords) return null

          const fillColor = TIER_COLORS[country.current_tier] ?? '#78909C'
          const tierLabel = TIER_LABELS[country.current_tier] ?? country.current_tier_label
          const changeSign = country.one_year_change >= 0 ? '+' : ''
          const changeDisplay = `${changeSign}${country.one_year_change.toFixed(1)}`
          const ariaLabel = `${country.name} — ${tierLabel}`

          return (
            <CircleMarker
              key={country.iso}
              center={coords}
              radius={9}
              pathOptions={{
                fillColor,
                fillOpacity: 0.85,
                color: '#FFFFFF',
                weight: 1.5,
              }}
              eventHandlers={{
                click: () => navigate(`/country/${country.iso}`),
              }}
              // aria-label applied via eventHandlers workaround — Leaflet renders
              // SVG path elements; we set the attribute via ref on the layer.
              ref={(layer) => {
                if (layer) {
                  const el = layer.getElement()
                  if (el) {
                    el.setAttribute('aria-label', ariaLabel)
                    el.setAttribute('role', 'img')
                    el.setAttribute('tabindex', '0')
                    el.setAttribute('focusable', 'true')
                  }
                }
              }}
            >
              <Popup>
                <div
                  style={{
                    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                    minWidth: '160px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#1C1C1E',
                      marginBottom: '6px',
                    }}
                  >
                    {country.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#6C6C70', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Score
                      </span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, Fira Code, monospace',
                          fontSize: '13px',
                          color: '#1C1C1E',
                          fontWeight: 400,
                        }}
                      >
                        {country.current_score.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#6C6C70', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Tier
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: fillColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                        }}
                      >
                        {tierLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#6C6C70', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        1-Year
                      </span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, Fira Code, monospace',
                          fontSize: '13px',
                          fontWeight: 400,
                          color: country.one_year_change >= 0 ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {changeDisplay}
                      </span>
                    </div>
                  </div>
                  {/* Click-to-navigate hint */}
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #F2F2F7',
                      fontSize: '11px',
                      color: '#1565C0',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/country/${country.iso}`)}
                  >
                    View country page →
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <TierLegend />
    </div>
  )
}
