import React, { useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { DataContext } from '../App'
import { Sidebar, TopBar } from '../components/Layout'
import type { DataJson } from '../types/country'
import ScoreBadge from '../components/GlobalOverview/ScoreBadge'
import StressTimeline from '../components/CountryPage/StressTimeline'
import IndicatorBreakdown from '../components/CountryPage/IndicatorBreakdown'
import EventsWidget from '../components/CountryPage/EventsWidget'
import MLScoreGauge from '../components/CountryPage/MLScoreGauge'
import AIInsightsPanel from '../components/CountryPage/AIInsightsPanel'
import useIsMobile from '../hooks/useIsMobile'

// ---------------------------------------------------------------------------
// Card surface style (shared across sections)
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  padding: '24px',
  marginBottom: '24px',
}

// ---------------------------------------------------------------------------
// Country Page
// PRO-43: single column on mobile, responsive header typography and padding.
// ---------------------------------------------------------------------------

export default function CountryPage() {
  const { iso } = useParams<{ iso: string }>()
  const data = useContext(DataContext) as DataJson | null
  const isMobile = useIsMobile()

  const shell = (title: string, subtitle: string, content: React.ReactNode) => (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FA' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : '240px', minHeight: '100vh' }}>
        <TopBar title={title} subtitle={subtitle} />
        {content}
      </div>
    </div>
  )

  if (!data) {
    return shell('Country', 'Democratic Stress Dashboard',
      <main aria-labelledby="page-heading-country" aria-busy="true"
        style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif', padding: isMobile ? '16px' : '32px' }}>
        <p style={{ color: '#6C6C70', fontSize: '14px' }}>Loading data…</p>
      </main>
    )
  }

  const country = data.countries.find((c) => c.iso === iso?.toUpperCase())

  if (!country) {
    return shell('Country Not Found', 'Democratic Stress Dashboard',
      <main aria-labelledby="page-heading-country"
        style={{
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px',
        }}>
        <p style={{ fontSize: '20px', fontWeight: 600, color: '#C62828', marginBottom: '16px' }}>
          Country data not available
        </p>
        <Link to="/" style={{ color: '#1565C0', fontSize: '14px', textDecoration: 'none' }}>
          Back to Global Overview
        </Link>
      </main>
    )
  }

  return shell(country.name, country.current_tier_label,
    <main
      aria-labelledby="page-heading-country"
      style={{
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        // PRO-43: 32px desktop → 16px mobile
        padding: isMobile ? '16px' : '32px',
        maxWidth: '1600px',
      }}
    >
      {/* Back navigation — stays at top on both layouts */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#6C6C70',
          fontSize: '14px',
          textDecoration: 'none',
          marginBottom: '20px',
          // PRO-45: 44px minimum tap target height on mobile
          minHeight: isMobile ? '44px' : undefined,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.color = '#1A237E'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.color = '#6C6C70'
        }}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Global Overview
      </Link>

      {/* Country Header
          PRO-43: flag + name + score stack vertically on mobile */}
      <div
        style={{
          display: 'flex',
          // PRO-43: column on mobile, row on desktop
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          gap: isMobile ? '16px' : '24px',
          marginBottom: '24px',
        }}
      >
        <img
          src={country.flag_url.replace('/w80/', '/w160/')}
          alt={`${country.name} flag`}
          width={160}
          style={{
            height: 'auto',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            flexShrink: 0,
            display: 'block',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            id="page-heading-country"
            style={{
              // PRO-43: 32px desktop → 24px mobile
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
              color: '#1A237E',
              margin: 0,
            }}
          >
            {country.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                // PRO-43: 48px desktop → 36px mobile
                fontSize: isMobile ? '36px' : '48px',
                fontWeight: 400,
                color: '#1C1C1E',
                lineHeight: 1.1,
              }}
            >
              {country.current_score.toFixed(1)}
            </span>
            <ScoreBadge tier={country.current_tier} tierLabel={country.current_tier_label} />
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#6C6C70',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            Last updated: {country.latest_year}
          </span>
        </div>
      </div>

      {/* AI Narrative Summary */}
      {country.narrative && (
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
              color: '#1A237E',
              marginBottom: '16px',
              marginTop: 0,
            }}
          >
            {country.narrative.headline}
          </h2>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#1C1C1E',
              marginBottom: '16px',
              marginTop: 0,
            }}
          >
            {country.narrative.summary}
          </p>
          {country.narrative.bullets.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {country.narrative.bullets.map((bullet, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: '#3A3A3C',
                  }}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* AI Insights Panel */}
      <AIInsightsPanel country={country} />

      {/* Risk Flags Panel */}
      <div style={cardStyle}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: '#6C6C70',
            marginBottom: '12px',
            marginTop: 0,
          }}
        >
          Active Risk Flags
        </p>

        {country.flags.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6C6C70', margin: 0 }}>No active risk flags</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {country.flags.map((flag) => (
              <div
                key={flag.flag}
                title={flag.description}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  border: '1px solid #C62828',
                  borderRadius: '2px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                }}
              >
                <AlertTriangle size={14} aria-hidden="true" />
                {flag.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stress Timeline */}
      <div style={{ marginBottom: '24px' }}>
        <StressTimeline timeline={country.timeline} events={country.events} />
      </div>

      {/* Indicator Breakdown */}
      <div style={{ marginBottom: '24px' }}>
        <IndicatorBreakdown indicators={country.indicators} timeline={country.timeline} />
      </div>

      {/* Events Widget + ML Score Gauge
          PRO-43: two-column grid on desktop → single column on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        <EventsWidget events={country.events} />
        <MLScoreGauge mlScore={country.ml_score} />
      </div>
    </main>
  )
}
