import React from 'react'
import { Calendar } from 'lucide-react'
import type { CountryData, CountryEvent } from '../../types/country'
import { INDICATOR_LABELS } from '../../constants/indicators'

// ---------------------------------------------------------------------------
// URL safety guard — only permit http(s) hrefs to prevent javascript: XSS.
// Defined outside JSX so it is not recreated on every render.
// ---------------------------------------------------------------------------

const isSafeUrl = (url: string) => /^https:\/\//.test(url)

// ---------------------------------------------------------------------------
// toW40Url
// ---------------------------------------------------------------------------

function toW40Url(flagUrl: string): string {
  return flagUrl.replace('/w80/', '/w40/')
}

// ---------------------------------------------------------------------------
// Merged event shape — event + originating country metadata
// ---------------------------------------------------------------------------

interface MergedEvent {
  event: CountryEvent
  countryName: string
  countryIso: string
  countryFlagUrl: string
  sortKey: string  // ISO date string for sorting
}

// ---------------------------------------------------------------------------
// Build sorted merged event list
// ---------------------------------------------------------------------------

function buildMergedEvents(countries: CountryData[]): MergedEvent[] {
  const all: MergedEvent[] = []

  for (const country of countries) {
    if (!country.events || country.events.length === 0) continue
    for (const event of country.events) {
      all.push({
        event,
        countryName: country.name,
        countryIso: country.iso,
        countryFlagUrl: country.flag_url,
        sortKey: event.date,
      })
    }
  }

  // Reverse-chronological: newest first
  all.sort((a, b) => {
    if (b.sortKey > a.sortKey) return 1
    if (b.sortKey < a.sortKey) return -1
    return 0
  })

  return all
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SharedEventLogProps {
  countries: CountryData[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SharedEventLog({ countries }: SharedEventLogProps) {
  const mergedEvents = buildMergedEvents(countries)
  const hasEvents = mergedEvents.length > 0

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: '#1A237E',
          marginBottom: '4px',
          marginTop: 0,
        }}
      >
        Shared Event Log
      </h2>
      <p
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
          color: '#6C6C70',
          marginBottom: '20px',
          marginTop: 0,
        }}
      >
        Events from all selected countries, newest first.
      </p>

      {/* Empty state */}
      {!hasEvents && (
        <p
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            color: '#6C6C70',
            fontStyle: 'italic',
          }}
        >
          No events available for the selected countries.
        </p>
      )}

      {/* Event list */}
      {hasEvents && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {mergedEvents.map((item, idx) => {
            const { event, countryName, countryIso, countryFlagUrl } = item
            const hasSource = !!event.source_url && isSafeUrl(event.source_url)

            return (
              <div
                key={`${countryIso}-${event.date}-${idx}`}
                style={{
                  paddingTop: idx === 0 ? 0 : '16px',
                  paddingBottom: '16px',
                  borderBottom: idx < mergedEvents.length - 1 ? '1px solid #F2F2F7' : 'none',
                }}
              >
                {/* Top row: date + country badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#6C6C70" aria-hidden="true" />
                    <span
                      style={{
                        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6C6C70',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {event.date}
                    </span>
                  </div>

                  {/* Country origin badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#E8EAF0',
                      border: '1px solid #C5CAE9',
                      borderRadius: '4px',
                      padding: '3px 8px',
                    }}
                    aria-label={`Event from ${countryName}`}
                  >
                    <img
                      src={toW40Url(countryFlagUrl)}
                      alt={`Flag of ${countryName}`}
                      width={20}
                      height={14}
                      style={{
                        objectFit: 'cover',
                        borderRadius: '1px',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='14' viewBox='0 0 20 14'%3E%3Crect width='20' height='14' fill='%23e5e7eb'/%3E%3C/svg%3E"
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#1A237E',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}
                    >
                      {countryName}
                    </span>
                  </div>
                </div>

                {/* Description — linked if source URL is safe */}
                <p
                  style={{
                    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: '#1C1C1E',
                    margin: '0 0 10px 0',
                  }}
                >
                  {hasSource ? (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#1565C0',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'
                      }}
                    >
                      {event.description}
                    </a>
                  ) : (
                    event.description
                  )}
                </p>

                {/* Affected indicators */}
                {event.affected_indicators && event.affected_indicators.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {event.affected_indicators.map((indKey) => (
                      <span
                        key={indKey}
                        style={{
                          backgroundColor: '#F2F2F7',
                          color: '#6C6C70',
                          borderRadius: '2px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                          fontWeight: 600,
                          letterSpacing: '0.4px',
                        }}
                      >
                        {INDICATOR_LABELS[indKey] ?? indKey}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
