import React from 'react'
import { Calendar } from 'lucide-react'
import type { CountryEvent } from '../../types/country'

// ---------------------------------------------------------------------------
// Indicator display label map (same as IndicatorBreakdown)
// ---------------------------------------------------------------------------

const INDICATOR_LABELS: Record<string, string> = {
  media_freedom: 'Media Freedom',
  judicial_independence: 'Judicial Independence',
  civil_society_space: 'Civil Society Space',
  election_quality: 'Election Quality',
  executive_constraints: 'Executive Constraints',
  rhetoric_radar: 'Rhetoric Radar',
  civic_protests: 'Civic Protests',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EventsWidgetProps {
  events?: CountryEvent[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventsWidget({ events }: EventsWidgetProps) {
  const hasEvents = events && events.length > 0

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px',
        height: '100%',
      }}
    >
      <h2
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          lineHeight: 1.4,
          letterSpacing: '-0.2px',
          color: '#1A237E',
          marginBottom: '16px',
        }}
      >
        Democratic Events &amp; Rhetoric
      </h2>

      {!hasEvents ? (
        <p
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            color: '#6C6C70',
          }}
        >
          No events recorded
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((evt, idx) => (
            <div
              key={`${evt.date}-${idx}`}
              style={{
                paddingTop: idx === 0 ? 0 : '16px',
                paddingBottom: '16px',
                borderBottom: idx < events.length - 1 ? '1px solid #F2F2F7' : 'none',
              }}
            >
              {/* Date row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <Calendar size={16} color="#6C6C70" aria-hidden="true" />
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
                  {evt.date}
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: '#1C1C1E',
                  marginBottom: '10px',
                  marginTop: 0,
                }}
              >
                {evt.source_url ? (
                  <a
                    href={evt.source_url}
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
                    {evt.description}
                  </a>
                ) : (
                  evt.description
                )}
              </p>

              {/* Affected indicators */}
              {evt.affected_indicators.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {evt.affected_indicators.map((indKey) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
