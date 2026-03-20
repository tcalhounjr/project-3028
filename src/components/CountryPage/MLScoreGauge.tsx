import React from 'react'
import type { MLScore } from '../../types/country'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MLScoreGaugeProps {
  mlScore?: MLScore
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MLScoreGauge({ mlScore }: MLScoreGaugeProps) {
  const hasScore = mlScore && mlScore.value !== null && mlScore.value !== undefined
  const scoreValue = hasScore ? mlScore!.value as number : null

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
        ML Erosion Risk
      </h2>

      {scoreValue === null ? (
        <p
          style={{
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            color: '#6C6C70',
          }}
        >
          Score not available
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Large percentage value — distinct from ScoreBadge, using mono font directly */}
          <div
            style={{
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontSize: '48px',
              fontWeight: 400,
              color: '#1C1C1E',
              lineHeight: 1.1,
            }}
          >
            {Math.round(scoreValue)}%
          </div>

          {/* Progress bar — using viz.series.1 blue, NOT tier status colors */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#F2F2F7',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={Math.round(scoreValue)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`ML erosion probability: ${Math.round(scoreValue)}%`}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, scoreValue))}%`,
                height: '100%',
                backgroundColor: '#1565C0',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Always-visible uncertainty label — required by PRO-20 acceptance criteria */}
          <p
            style={{
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
              fontSize: '12px',
              color: '#6C6C70',
              margin: 0,
            }}
          >
            Experimental 3-year erosion probability
          </p>

          {/* Beta label */}
          {mlScore?.label && (
            <span
              style={{
                fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                fontSize: '11px',
                color: '#C7C7CC',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              {mlScore.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
