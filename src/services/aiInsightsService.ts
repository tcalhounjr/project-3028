// ---------------------------------------------------------------------------
// AI Insights Service — mock implementation for PoC
// Simulates async AI call contract; swap body for real API when ready.
// ---------------------------------------------------------------------------

import type { CountryData } from '../types/country'

export interface AIInsights {
  headline: string
  analysis: string
  watchPoints: string[]
  confidence: 'high' | 'medium' | 'low'
}

/** Simulated network delay between min and max ms */
function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns AI-generated insights for a country derived from its existing data.
 * In production, replace this with a real Gemini / Claude API call.
 */
export async function getCountryInsights(country: CountryData): Promise<AIInsights> {
  await delay(900, 1800)

  const score = country.current_score
  const tier = country.current_tier_label
  const change5yr = country.five_year_change
  const changeDir = change5yr < 0 ? 'declined' : 'improved'
  const changeAbs = Math.abs(change5yr).toFixed(1)

  // Derive indicator watch-points from declining/rapidly_declining indicators
  const indicators = Object.values(country.indicators)
  const declining = indicators.filter(
    (ind) => ind.trend === 'declining' || ind.trend === 'rapidly_declining',
  )
  const watchPoints: string[] = declining.slice(0, 3).map((ind) => {
    const trendLabel = ind.trend === 'rapidly_declining' ? 'rapid decline' : 'declining trend'
    return `${ind.label} shows a ${trendLabel} (current value: ${ind.value.toFixed(1)})`
  })

  if (watchPoints.length === 0) {
    watchPoints.push(`${country.name} shows no rapidly deteriorating indicators at this time.`)
  }

  const confidence: AIInsights['confidence'] =
    country.flags.length >= 3 ? 'high' : country.flags.length >= 1 ? 'medium' : 'low'

  const headline =
    country.narrative?.headline ??
    `${country.name}: ${tier} democratic stress (score ${score.toFixed(1)})`

  const analysis =
    country.narrative?.summary ??
    `${country.name} registers a composite democratic stress score of ${score.toFixed(1)}, ` +
      `placing it in the ${tier} tier. Over the past five years, stress has ${changeDir} by ${changeAbs} points. ` +
      `${country.flags.length > 0 ? `${country.flags.length} active risk flag(s) require monitoring.` : 'No active risk flags are present.'}`

  return { headline, analysis, watchPoints, confidence }
}
