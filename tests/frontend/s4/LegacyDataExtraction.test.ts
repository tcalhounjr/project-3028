/**
 * S4 Tests — PRO-24: Legacy data extraction
 *
 * Verifies that MOCK_COUNTRIES has been moved out of App.tsx into
 * src/constants/legacyMockData.ts, and that the exported data matches the
 * expected LegacyCountryData shape.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Paths (relative to project root)
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const APP_TSX = path.join(PROJECT_ROOT, 'src/App.tsx')
const LEGACY_DATA_FILE = path.join(PROJECT_ROOT, 'src/constants/legacyMockData.ts')

// ---------------------------------------------------------------------------
// PRO-24 — App.tsx structural checks
// ---------------------------------------------------------------------------

describe('PRO-24: App.tsx does not contain inline mock data', () => {
  let appSource: string

  beforeAll(() => {
    appSource = fs.readFileSync(APP_TSX, 'utf-8')
  })

  it('App.tsx does not contain an inline MOCK_COUNTRIES array literal', () => {
    // The inline pattern would be something like:
    //   const MOCK_COUNTRIES = [
    //   export const MOCK_COUNTRIES = [
    // If MOCK_COUNTRIES appears in App.tsx it must only be an import, not a declaration.
    const declarationPattern = /(?:const|let|var)\s+MOCK_COUNTRIES\s*[:=]/
    expect(declarationPattern.test(appSource)).toBe(false)
  })

  it('App.tsx does not contain large inline country data arrays (no objects with isoCode + history keys together)', () => {
    // A large inline data array would contain both isoCode and history as object keys.
    // After extraction, these should only appear in legacyMockData.ts.
    const hasInlineIsoCodeAndHistory =
      /isoCode\s*:\s*["'][A-Z]{2,3}["']/.test(appSource) &&
      /history\s*:\s*\[/.test(appSource)
    expect(hasInlineIsoCodeAndHistory).toBe(false)
  })

  it('App.tsx imports MOCK_COUNTRIES from legacyMockData', () => {
    // After extraction the import statement must be present.
    const importPattern = /import\s*\{[^}]*MOCK_COUNTRIES[^}]*\}\s*from\s*['"].*legacyMockData['"]/
    expect(importPattern.test(appSource)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PRO-24 — legacyMockData.ts shape verification
// ---------------------------------------------------------------------------

describe('PRO-24: legacyMockData.ts exports the expected data shape', () => {
  it('legacyMockData.ts file exists at src/constants/legacyMockData.ts', () => {
    expect(fs.existsSync(LEGACY_DATA_FILE)).toBe(true)
  })

  it('MOCK_COUNTRIES is exported and is a non-empty array', async () => {
    const mod = await import('../../../src/constants/legacyMockData')
    expect(Array.isArray(mod.MOCK_COUNTRIES)).toBe(true)
    expect(mod.MOCK_COUNTRIES.length).toBeGreaterThan(0)
  })

  it('each MOCK_COUNTRIES entry has a non-empty string name', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      expect(typeof country.name).toBe('string')
      expect(country.name.length).toBeGreaterThan(0)
    }
  })

  it('each MOCK_COUNTRIES entry has a 2-3 character isoCode string', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      expect(typeof country.isoCode).toBe('string')
      expect(country.isoCode.length).toBeGreaterThanOrEqual(2)
      expect(country.isoCode.length).toBeLessThanOrEqual(3)
    }
  })

  it('each MOCK_COUNTRIES entry has a numeric currentScore between 0 and 100', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      expect(typeof country.currentScore).toBe('number')
      expect(country.currentScore).toBeGreaterThanOrEqual(0)
      expect(country.currentScore).toBeLessThanOrEqual(100)
    }
  })

  it('each MOCK_COUNTRIES entry has a status of Stable, Elevated, or Critical', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    const validStatuses = new Set(['Stable', 'Elevated', 'Critical'])
    for (const country of MOCK_COUNTRIES) {
      expect(validStatuses.has(country.status)).toBe(true)
    }
  })

  it('each MOCK_COUNTRIES entry has an indicators object with all 7 required keys', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    const requiredKeys = [
      'mediaFreedom',
      'judicialIndependence',
      'civilSociety',
      'electionQuality',
      'executiveConstraints',
      'rhetoricRadar',
      'civicProtests',
    ]
    for (const country of MOCK_COUNTRIES) {
      expect(country.indicators).toBeDefined()
      for (const key of requiredKeys) {
        expect(
          key in country.indicators,
          `Country "${country.name}" is missing indicator "${key}"`,
        ).toBe(true)
        expect(typeof country.indicators[key as keyof typeof country.indicators]).toBe('number')
      }
    }
  })

  it('each MOCK_COUNTRIES entry has a history array with at least one entry', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      expect(Array.isArray(country.history)).toBe(true)
      expect(country.history.length).toBeGreaterThan(0)
    }
  })

  it('each history entry has a numeric year and numeric score', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      for (const entry of country.history) {
        expect(typeof entry.year).toBe('number')
        expect(typeof entry.score).toBe('number')
      }
    }
  })

  it('each MOCK_COUNTRIES entry has an events array', async () => {
    const { MOCK_COUNTRIES } = await import('../../../src/constants/legacyMockData')
    for (const country of MOCK_COUNTRIES) {
      expect(Array.isArray(country.events)).toBe(true)
    }
  })
})
