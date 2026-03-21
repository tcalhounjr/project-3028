import React, { useContext, useState } from 'react'
import { DataContext } from '../App'
import { Sidebar, TopBar } from '../components/Layout'
import CountrySelector from '../components/Compare/CountrySelector'
import CompareTimeline from '../components/Compare/CompareTimeline'
import IndicatorTable from '../components/Compare/IndicatorTable'
import SharedEventLog from '../components/Compare/SharedEventLog'
import useIsMobile from '../hooks/useIsMobile'
import type { CountryData } from '../types/country'

// ---------------------------------------------------------------------------
// ComparePage — /compare route.
// Hosts CountrySelector and all Compare Mode sub-components.
// Country selection is confirmed via CountrySelector's onConfirm callback,
// which updates the downstream components simultaneously.
// PRO-44: single-column layout on mobile; horizontal scroll for wide tables.
// ---------------------------------------------------------------------------

export default function ComparePage() {
  const data = useContext(DataContext)
  const [selectedCountries, setSelectedCountries] = useState<CountryData[]>([])
  const isMobile = useIsMobile()

  function handleConfirm(isos: string[]) {
    if (!data) return
    const countries = isos
      .map((iso) => data.countries.find((c) => c.iso === iso))
      .filter((c): c is CountryData => c !== undefined)
    setSelectedCountries(countries)
  }

  const hasSelection = selectedCountries.length >= 2

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F5F7FA',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <Sidebar />

      <main
        style={{ flex: 1, marginLeft: isMobile ? 0 : '240px', minHeight: '100vh' }}
        aria-labelledby="compare-page-heading"
      >
        <TopBar title="Compare Mode" subtitle="Side-by-side country analysis" />

        <div
          style={{
            padding: isMobile ? '16px' : '32px',
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          {/* Page heading (visually hidden — TopBar serves as visual heading) */}
          <h1
            id="compare-page-heading"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
            }}
          >
            Compare Mode
          </h1>

          {/* PRO-44: 2-column grid on desktop → single column on mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* CountrySelector — stacks above results on mobile */}
            <div>
              <CountrySelector onConfirm={handleConfirm} />
            </div>

            {/* Right column: downstream compare components */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {!hasSelection ? (
                /* Placeholder shown before any countries are confirmed */
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    padding: '48px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: '#9E9E9E',
                    textAlign: 'center',
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ opacity: 0.3 }}
                  >
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      margin: 0,
                    }}
                  >
                    Select 2–3 countries and click Compare
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#BDBDBD',
                      margin: 0,
                      maxWidth: '280px',
                    }}
                  >
                    The timeline, indicator table, and event log will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* PRO-33: Overlaid Composite Score Timeline
                      PRO-44: wrap in overflow-x:auto on mobile */}
                  <div style={isMobile ? { overflowX: 'auto' } : undefined}>
                    <CompareTimeline countries={selectedCountries} />
                  </div>

                  {/* PRO-34: Indicator Comparison Table
                      PRO-44: wrap in overflow-x:auto on mobile */}
                  <div>
                    <h2
                      style={{
                        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#1A237E',
                        marginBottom: '12px',
                        marginTop: 0,
                      }}
                    >
                      Indicator Comparison
                    </h2>
                    <div style={isMobile ? { overflowX: 'auto' } : undefined}>
                      <IndicatorTable countries={selectedCountries} />
                    </div>
                  </div>

                  {/* PRO-35: Shared Event Log */}
                  <SharedEventLog countries={selectedCountries} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
