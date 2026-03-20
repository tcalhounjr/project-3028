// ---------------------------------------------------------------------------
// Canonical data shape — mirrors public/data.json produced by the pipeline.
// All field names must match data.json exactly.
// ---------------------------------------------------------------------------

export type Tier = 'critical' | 'elevated' | 'stable' | 'rapid_erosion'

export interface IndicatorValue {
  label: string
  value: number
  trend: 'improving' | 'stable' | 'declining' | 'rapidly_declining'
}

export interface TimelineEntry {
  year: number
  composite: number
  tier: Tier
  tier_label: string
  indicators: Record<string, number>
}

export interface RiskFlag {
  flag: string
  label: string
  description: string
  year_triggered: number
}

export interface CountryNarrative {
  headline: string
  summary: string
  bullets: string[]
  trend_direction: string
}

export interface CountryEvent {
  date: string
  description: string
  affected_indicators: string[]
  source_url?: string
}

export interface MLScore {
  value: number | null
  label: string
  description: string
  unit: string
  is_stub: boolean
}

export interface CountryData {
  iso: string
  name: string
  flag_url: string
  current_score: number
  current_tier: Tier
  current_tier_label: string
  one_year_change: number
  five_year_change: number
  latest_year: number
  flags: RiskFlag[]
  indicators: Record<string, IndicatorValue>
  timeline: TimelineEntry[]
  narrative?: CountryNarrative
  events?: CountryEvent[]
  ml_score?: MLScore
}

export interface DataJson {
  meta: {
    generated_at: string
    year_range: [number, number]
    countries: number
    indicators: Record<string, string>
    vdem_version: string
    normalization: string
    weights: Record<string, number>
  }
  countries: CountryData[]
}
