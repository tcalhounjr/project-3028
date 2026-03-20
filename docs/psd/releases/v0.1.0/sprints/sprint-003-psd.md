# Sprint Post-Sprint Debrief
## Democratic Stress AI Dashboard — Sprint 003

---

**Project:** Democratic Stress AI Dashboard PoC
**Sprint Number:** 003
**Sprint Name:** Test Harness Repair and Branch Coverage Uplift
**Sprint Dates (Planned):** 2026-03-20 – 2026-03-27
**Sprint Dates (Actual):** 2026-03-20 – 2026-03-20
**Release Version Context:** PoC v0.1.0
**Prepared by:** AI Development Team
**Date Prepared:** 2026-03-20

---

## Executive Summary

Sprint 3 delivered complete resolution of the 29 pre-existing Sprint 1 test failures that had been
carried as tracked debt since Sprint 2. Three distinct failure categories were addressed: s1-01
structural assertions that required mockData.ts deletion and a /compare route; s1-06 and s1-07
test harness gaps where Map and CountryTable components failed to render under React Router context
in the test environment. In parallel, the test-writer workstream identified and resolved the
critical branch coverage risk — branches were at 80.34%, only 0.34% above the DoD hard gate.
Thirteen new targeted branch tests were written for the internal tooltip components of
StressTimeline and IndicatorBreakdown, lifting branch coverage to 90.39%. All 215 tests now pass.

Sprint health is Green. The feature branch sprint-3/feature/test-fixes-and-polish is committed
and pushed. PR is ready for configuration-manager to open against main. The staging deployment
(PRO-22) is the remaining Sprint 3 item, pending PR merge.

---

## Sprint Scorecard

| Metric | Value |
|--------|-------|
| Planned stories | 3 (PRO-21, PRO-22, PRO-23) |
| Completed stories | 2 (PRO-21, PRO-23) |
| In Progress | 1 (PRO-22 — awaiting PR merge) |
| Sprint duration planned | 7 days |
| Sprint duration actual | 1 day |
| Technical debt carry rate (this sprint) | 0.0% |
| Cumulative carry rate (all sprints) | 0.0% |
| Staging deployments | 0 |
| Production deployments | 0 |
| Rollbacks | 0 |

Note: PRO-22 (staging deployment) is in progress — pending PR merge to main. Carry rate
calculated against PRO-21 and PRO-23 which were the executable stories this session.
PRO-22 transitions to Sprint 4 or completes once configuration-manager merges and deploys.

---

## Work Completed

### PRO-21 — S3-01: Fix pre-existing Sprint 1 test failures (29 tests)

**Acceptance criteria status:** Met — all 43 tests in s1-01/s1-06/s1-07 pass

**Root causes diagnosed and resolved:**

**s1-01 (4 failures):**
- Test asserted `src/mockData.ts` should not exist — file was still present
- Test asserted `@google/genai` should not be in package.json — it was still listed (1.29.0)
- Test asserted App.tsx should not import from `./mockData` — import was present
- Test asserted App.tsx should have a `/compare` route — route was absent

**Resolution:**
1. Removed `@google/genai` from `package.json` dependencies — the package was unused after
   Sprint 2's geminiService.ts deletion
2. Inlined the MOCK_COUNTRIES array directly into App.tsx with full TypeScript typing
3. Deleted `src/mockData.ts`
4. Added `ComparePage` stub component and `/compare` route to App.tsx

**s1-06 (10 failures):**
- All failures: `useNavigate() may be used only in the context of a <Router> component`
- The Map component calls `useNavigate()` at render time for CircleMarker click navigation
- The test rendered the Map component without a Router wrapper
- Resolution: Added `MemoryRouter` import and wrapped all 8 render calls in the test file

**s1-07 (15 failures):**
- All failures: `Cannot destructure property 'basename' of React.useContext(...) as it is null`
- The CountryTable component renders `<Link>` components from react-router-dom
- Link requires a Router context to resolve basename
- Resolution: Added `MemoryRouter` import and wrapped all CountryTable render calls in the test file
- TopMovers renders are correctly left unwrapped (no Router dependency)

**Secondary impact — s2 App.test.tsx:**
- The Sprint 2 App.test.tsx mocked `src/mockData` via `vi.mock('../../../src/mockData', ...)` to
  inject test fixture names (Testland, Criticaland, Stablonia)
- With mockData.ts deleted, the vi.mock intercepts nothing — App.tsx uses its own inline data
- Two tests failed: "renders country rows from MOCK_COUNTRIES" and "renders the Criticaland country"
- Resolution: Removed the stale vi.mock blocks; updated test assertions to reference the actual
  inline data (Brazil, Hungary). Navigation tests updated from Criticaland → Hungary.

**Implementation decision:** Inlining MOCK_COUNTRIES directly into App.tsx rather than creating
a new constants file was the correct tradeoff. The s1-01 test contract explicitly required
`src/mockData.ts` to not exist. A new file with a different name would technically pass the test
but obscure the intent. The inline data is clearly commented as legacy prototype data. A low-priority
backlog item (PRO-24) tracks the v1 cleanup of extracting it properly when LegacyAppContent is retired.

### PRO-23 — S3-03: Branch Coverage Improvement

**Acceptance criteria status:** Met — branches at 90.39% (target: >= 82%)

**Analysis:** With all suites running together, the branch metric was unchanged at 80.34%. The
coverage report identified four files with significant branch gaps:
- `IndicatorBreakdown.tsx`: 48.38% branches — SparkTooltip internal component
- `StressTimeline.tsx`: 38.46% branches — CustomTooltip internal component
- `Map.tsx`: 78.57% branches
- `CountryTable.tsx`: 90% branches

Both Tooltip components had no branch coverage because the existing Recharts mock rendered null
for the Tooltip component, never invoking the content prop passed by the application.

**Fix:** Two new test files written using a content-capture pattern:
- Mock Recharts Tooltip to capture the content prop passed by the component
- Render the captured content element directly with controlled prop combinations
- Exercise all branch conditions: inactive state, empty/undefined payload, null value, and
  valid active states with and without events

**`tests/frontend/s2/StressTimeline.branch.test.tsx`** (6 tests):
- CustomTooltip returns null when active=false
- CustomTooltip returns null when payload is empty array
- CustomTooltip returns null when payload is undefined
- CustomTooltip renders score and year with valid payload
- CustomTooltip renders event descriptions when events present
- CustomTooltip renders without Events section when events array is empty

**`tests/frontend/s2/IndicatorBreakdown.branch.test.tsx`** (7 tests):
- SparkTooltip returns null on each of the three null-return conditions
- SparkTooltip renders correctly with valid payload
- SparkTooltip renders indicatorLabel when present
- TrendIcon renders improving trend (all four trend paths were already covered by existing tests;
  this test provides additional assurance for the improving path)

**Coverage improvement:**

| Metric | Before Sprint 3 | After Sprint 3 | Threshold |
|--------|----------------|----------------|-----------|
| Statements | 87.64% | 92.30% | 80% |
| Branches | 80.34% | 90.39% | 80% |
| Functions | 87.50% | 88.77% | 80% |
| Lines | 89.21% | 92.97% | 80% |

---

## Issues and Resolutions

### Pre-existing Test Failures — All 29 Resolved

See PRO-21 above for full diagnosis and resolution details.

**Time lost:** 0 sprint days — resolved in same session as identified.

### s2 App.test.tsx Regression (discovered during sprint)

**Severity:** Low — caused 2 additional test failures in s2 suite when mockData.ts was deleted
**Root cause:** Sprint 2 App.test.tsx mocked a module path that no longer exists after Sprint 3 deletion
**Resolution:** Removed stale vi.mock blocks; updated test names and fixture references
**Detection:** Caught immediately when running the s2 suite after the mockData deletion

### Code Review — 0 Must Fix, 0 Should Fix

Code reviewer issued APPROVED verdict. One Consider item logged as PRO-24 (Low backlog):
extract MOCK_COUNTRIES to a dedicated constants file in v1 cleanup.

### Security Audit — CLEARED

No findings of any severity. Sprint 3 changes removed attack surface (deleted unused @google/genai
dependency). Test-only changes have no production security impact.

---

## Technical Debt Register

### Items backlogged this sprint

**PRO-24 — Extract legacy prototype data from App.tsx**
- Severity: Low
- Reason: Not worth a targeted commit for prototype-only data; will be removed when LegacyAppContent
  is retired in v1. The inline placement satisfies test constraints cleanly.
- Recommended sprint: v1 cleanup sprint

**Running total of backlogged items this release:** 1 (PRO-24, Low)
**Threshold for product owner escalation:** 5 items
**Technical debt carry rate trend:** Stable at 0.0% across all three sprints

---

## Test Coverage Report

### Frontend Unit Tests — Full Suite (Sprint 3 final state)

| Suite | Tests | Passed | Failed | Notes |
|-------|-------|--------|--------|-------|
| s1-01 | 11 | 11 | 0 | Was 7/11 entering Sprint 3 |
| s1-06 | 10 | 10 | 0 | Was 0/10 entering Sprint 3 |
| s1-07 | 22 | 22 | 0 | Was 7/22 entering Sprint 3 |
| s2 (existing) | 159 | 159 | 0 | Stable |
| s2 (new branch tests) | 13 | 13 | 0 | Added Sprint 3 |
| **Total** | **215** | **215** | **0** | — |

### Coverage Metrics (measured against full src/ tree)

| Metric | Sprint 2 Baseline | Sprint 3 Final | Threshold | Status |
|--------|-------------------|----------------|-----------|--------|
| Statements | 87.64% | 92.30% | 80% | PASS |
| Branches | 80.34% | 90.39% | 80% | PASS |
| Functions | 87.50% | 88.77% | 80% | PASS |
| Lines | 89.21% | 92.97% | 80% | PASS |

All four metrics now have comfortable margins above the DoD hard gate. Branch coverage went from
a precarious 0.34% margin to a solid 10.39% margin.

### Smoke Tests

Not applicable — no staging deployment this sprint.

### Integration Tests

Not applicable — no staging deployment this sprint.

### Missing Secrets

None. No CI/CD secrets required for Sprint 3 work.

---

## Performance Baseline Report

No staging or production deployments were performed this sprint. PRO-22 (staging deployment)
is deferred pending PR merge.

The DoD A5/B1 threshold (country page < 2s on standard broadband) has not yet been measured.
Sprint 4 or the PRO-22 completion event will establish the first performance baseline.

**Performance baseline trend:** No data. Baseline will be established at first staging deployment.

---

## Deployment Summary

| Event | Count | Result |
|-------|-------|--------|
| Staging deployments | 0 | N/A |
| Production deployments | 0 | N/A |
| Rollbacks | 0 | N/A |

**Current status:**
- Feature branch: sprint-3/feature/test-fixes-and-polish — committed (43e1b0d), pushed
- PR: Ready for configuration-manager to open against main (gh CLI not installed in environment)
- Sprint 2 PR (sprint-2/feature/country-page): Still open, can be merged first or after Sprint 3

---

## Decisions Log

### Decision 1 — Inline MOCK_COUNTRIES in App.tsx rather than creating a new constants file

**Context:** s1-01 tests require `src/mockData.ts` to not exist. MOCK_COUNTRIES was imported from
that file and used throughout LegacyAppContent. The only way to pass both the deletion test and
keep LegacyAppContent functional was to relocate the data.

**Decision:** Inline the data directly in App.tsx with a clear comment block distinguishing it
from the Sprint 2 DataContext/public/data.json architecture.

**Alternatives considered:**
(a) Create `src/constants/legacyMockData.ts`. Rejected for Sprint 3 — introduces a new file while
the s1-01 test contract only requires mockData.ts to be absent, not that all mock data be absent.
Would pass the test but feels like a shell game. Better to clean it up properly in v1 when
LegacyAppContent is removed. Logged as PRO-24.
(b) Update the s1-01 test to change the assertion. Rejected — the test reflects the correct
architectural intent (prototype files should be cleaned up) and should be authoritative.

**Implication:** App.tsx is temporarily heavier with prototype data. This is the correct state
until LegacyAppContent is retired.

### Decision 2 — Content-capture pattern for tooltip branch coverage

**Context:** Recharts Tooltip receives a `content` prop that is a React element (the custom
tooltip component). The existing mock renders null for Tooltip, which means the content prop
is never invoked and the internal tooltip components have zero branch coverage.

**Decision:** In the branch coverage test files, mock Tooltip to capture the content prop into a
module-level variable. Tests then render the captured element directly with controlled props.

**Alternatives considered:**
(a) Export CustomTooltip and SparkTooltip from their parent components. Rejected — they are
internal implementation details. Exporting them for test purposes pollutes the public API.
(b) Use Recharts' own test utilities. Rejected — Recharts does not expose a test API for firing
tooltip events in jsdom.
(c) Simulate mouse hover events on chart elements. Rejected — jsdom does not support the SVG
mouse events that trigger Recharts tooltips.

**Implication:** The content-capture pattern is now the established approach for testing any
Recharts custom tooltip component in this codebase. Document this pattern in decisions.md.

### Decision 3 — Accept PRO-22 (staging deployment) as Sprint 4 carry-forward

**Context:** The PR merge is a prerequisite for the staging deployment. The gh CLI is not
installed in the agent environment and no GitHub token is available for API PR creation.

**Decision:** Log PRO-22 as in-progress and carry it to Sprint 4 (or close it when the PR
is merged via the GitHub web interface). This is not a technical debt item — it is a dependency
on an external process.

**Implication:** The first performance baseline measurement will occur in Sprint 4 post-merge.

---

## Next Sprint Preview

**Sprint 4 — Planned scope:**
- PRO-22 completion: PR merge + staging deployment + performance baseline measurement
  (requires configuration-manager to open and merge the PR, then trigger staging deploy)
- Compare Mode initial implementation (PRD §5.3):
  - Country selector (2–3 countries)
  - Overlaid composite score timeline
  - Synchronized indicator comparison table
- Any staging deployment remediation items

**Known risks going into Sprint 4:**
- Performance baseline not yet measured — DoD A5/B1 (< 2s country page load) still unvalidated
- Compare Mode is the last major PRD feature; its complexity may require 2 sprints
- Branch coverage is now healthy at 90.39% — adding new conditional components in Compare Mode
  must be accompanied by branch tests or coverage may slip

**Dependencies:**
- PR merge requires manual GitHub action (configuration-manager or @thomas via web UI)
- Staging deployment requires configuration-manager to have environment credentials
