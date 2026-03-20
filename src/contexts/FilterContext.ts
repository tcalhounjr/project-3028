// ---------------------------------------------------------------------------
// FilterContext — Global Overview region + score tier filter state.
// Lifted to a React context so Map and CountryTable share the same filter
// without prop drilling through GlobalOverview's intermediate sections.
// ---------------------------------------------------------------------------

import { createContext } from 'react'
import type { Tier } from '../types/country'

// ---------------------------------------------------------------------------
// Region mapping — derived from the 10 seed countries.
// Africa is included as an option even though no seed countries map to it;
// the filter simply returns an empty set when selected.
// ---------------------------------------------------------------------------

export type Region = 'All' | 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Middle East'
export type TierFilter = 'All' | 'Stable' | 'Elevated' | 'Critical'

// Maps ISO alpha-3 → region
export const ISO_REGION_MAP: Record<string, Region> = {
  NIC: 'Americas',
  VEN: 'Americas',
  BRA: 'Americas',
  USA: 'Americas',
  HUN: 'Europe',
  POL: 'Europe',
  RUS: 'Europe',
  PHL: 'Asia',
  IND: 'Asia',
  TUR: 'Middle East',
}

// Maps score tier string → TierFilter label
export const TIER_TO_FILTER: Record<Tier, TierFilter> = {
  critical: 'Critical',
  elevated: 'Elevated',
  stable: 'Stable',
  rapid_erosion: 'Critical', // rapid_erosion is displayed as Critical
}

export interface FilterState {
  region: Region
  tier: TierFilter
}

export interface FilterContextValue {
  filters: FilterState
  setRegion: (region: Region) => void
  setTier: (tier: TierFilter) => void
}

export const FilterContext = createContext<FilterContextValue>({
  filters: { region: 'All', tier: 'All' },
  setRegion: () => undefined,
  setTier: () => undefined,
})
