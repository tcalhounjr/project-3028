import React from 'react'
import type { Tier } from '../../types/country'

// ---------------------------------------------------------------------------
// ScoreBadge — colored pill matching Civic Vigil design system.
// Used in CountryTable and elsewhere.
// ---------------------------------------------------------------------------

interface ScoreBadgeProps {
  tier: Tier
  tierLabel: string
}

const BADGE_STYLES: Record<Tier, React.CSSProperties> = {
  stable: {
    backgroundColor: '#ECEFF1',
    color: '#78909C',
    border: '1px solid #78909C',
  },
  elevated: {
    backgroundColor: '#FFFDE7',
    color: '#F9A825',
    border: '1px solid #F9A825',
  },
  critical: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    border: '1px solid #C62828',
  },
  rapid_erosion: {
    backgroundColor: '#B71C1C',
    color: '#FFFFFF',
    border: 'none',
  },
}

export default function ScoreBadge({ tier, tierLabel }: ScoreBadgeProps) {
  const style = BADGE_STYLES[tier] ?? BADGE_STYLES.stable

  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '4px',
        paddingTop: '2px',
        paddingBottom: '2px',
        paddingLeft: '8px',
        paddingRight: '8px',
        fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {tierLabel}
    </span>
  )
}
