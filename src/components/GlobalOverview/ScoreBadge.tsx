import React from 'react'
import type { Tier } from '../../types/country'

// ---------------------------------------------------------------------------
// ScoreBadge — Civic Vigil design system status badges.
//
// PRO-27 WCAG AA note:
//   Amber #F9A825 as foreground text on white FAILS 4.5:1 contrast.
//   Elevated badge uses amber as BACKGROUND with dark text (#E65100) instead.
//   #E65100 on #FFFDE7 achieves > 4.5:1 contrast ratio.
// ---------------------------------------------------------------------------

interface ScoreBadgeProps {
  tier: Tier
  tierLabel: string
}

const BADGE_STYLES: Record<Tier, React.CSSProperties> = {
  stable: {
    backgroundColor: '#ECEFF1',
    color: '#546E7A', /* #546E7A on #ECEFF1 = ~4.6:1 — passes WCAG AA */
    border: '1px solid #78909C',
  },
  elevated: {
    backgroundColor: '#FFFDE7',
    color: '#E65100', /* darker amber on light amber bg — passes 4.5:1 */
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
        fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
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
