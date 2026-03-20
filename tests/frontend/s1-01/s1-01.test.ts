/**
 * S1-01 Tests — Clean Prototype Repo
 * =====================================
 * Filesystem assertion tests verifying that prototype-era files and
 * dependencies have been fully removed from the repository.
 *
 * These tests use Node.js `fs` and `path` — no DOM or React required.
 * Run with: npx vitest run tests/frontend/s1-01/s1-01.test.ts
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..')
const SRC_DIR = path.join(PROJECT_ROOT, 'src')
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json')
const APP_TSX_PATH = path.join(SRC_DIR, 'App.tsx')

/**
 * Recursively collect all file paths under a directory.
 */
function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

/**
 * Search all files under src/ for a given string. Returns file paths that
 * contain the string.
 */
function srcFilesContaining(needle: string): string[] {
  const all = collectFiles(SRC_DIR)
  return all.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    return content.includes(needle)
  })
}

// ---------------------------------------------------------------------------
// S1-01-01: Removed files
// ---------------------------------------------------------------------------

describe('S1-01 — removed prototype files', () => {
  it('src/mockData.ts should not exist', () => {
    const target = path.join(SRC_DIR, 'mockData.ts')
    expect(
      fs.existsSync(target),
      `src/mockData.ts still exists at ${target} — it must be deleted`
    ).toBe(false)
  })

  it('src/services/geminiService.ts should not exist', () => {
    const target = path.join(SRC_DIR, 'services', 'geminiService.ts')
    expect(
      fs.existsSync(target),
      `src/services/geminiService.ts still exists at ${target} — it must be deleted`
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// S1-01-02: No src/ file contains banned strings
// ---------------------------------------------------------------------------

describe('S1-01 — no banned strings in src/', () => {
  it('no file in src/ should contain the string "@google/genai"', () => {
    const hits = srcFilesContaining('@google/genai')
    expect(hits, `Found @google/genai in: ${hits.join(', ')}`).toHaveLength(0)
  })

  it('no file in src/ should contain the string "GEMINI_API_KEY"', () => {
    const hits = srcFilesContaining('GEMINI_API_KEY')
    expect(hits, `Found GEMINI_API_KEY in: ${hits.join(', ')}`).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// S1-01-03: package.json does not list @google/genai as a dependency
// ---------------------------------------------------------------------------

describe('S1-01 — package.json dependency cleanup', () => {
  it('package.json should not contain @google/genai as a dependency', () => {
    const raw = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')
    const pkg = JSON.parse(raw)
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    }
    expect(
      '@google/genai' in allDeps,
      '@google/genai is still listed in package.json dependencies'
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// S1-01-04: App.tsx routes
// ---------------------------------------------------------------------------

describe('S1-01 — App.tsx route coverage', () => {
  it('App.tsx should exist', () => {
    expect(
      fs.existsSync(APP_TSX_PATH),
      `App.tsx not found at ${APP_TSX_PATH}`
    ).toBe(true)
  })

  it('App.tsx should contain a route for "/"', () => {
    const content = fs.readFileSync(APP_TSX_PATH, 'utf8')
    // Matches: path="/" or path='/'
    expect(content).toMatch(/path=["']\/["']/)
  })

  it('App.tsx should contain a route for "/country/:iso"', () => {
    const content = fs.readFileSync(APP_TSX_PATH, 'utf8')
    expect(content).toMatch(/path=["']\/country\/:iso["']/)
  })

  it('App.tsx should contain a route for "/compare"', () => {
    const content = fs.readFileSync(APP_TSX_PATH, 'utf8')
    expect(content).toMatch(/path=["']\/compare["']/)
  })
})

// ---------------------------------------------------------------------------
// S1-01-05: App.tsx does not import removed modules
// ---------------------------------------------------------------------------

describe('S1-01 — App.tsx import hygiene', () => {
  it('App.tsx should not import from "./mockData"', () => {
    const content = fs.readFileSync(APP_TSX_PATH, 'utf8')
    expect(content).not.toMatch(/from\s+['"]\.\/mockData['"]/)
  })

  it('App.tsx should not import from "./services/geminiService"', () => {
    const content = fs.readFileSync(APP_TSX_PATH, 'utf8')
    expect(content).not.toMatch(/from\s+['"]\.\/services\/geminiService['"]/)
  })
})
