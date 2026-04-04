# Civic Vigil — Democratic Stress AI Dashboard

## What It Is

**Civic Vigil** is an AI-assisted early-warning dashboard for tracking democratic erosion globally. It monitors countries using the V-Dem (Varieties of Democracy) dataset, computing composite stress scores across 7 democratic health indicators, and surfaces AI-generated risk narratives to researchers, journalists, and policy analysts.

---

## Key Features & User Benefits

### 1. Interactive Global Map
Color-coded circle markers let users instantly see which countries are in **Critical**, **Elevated**, or **Stable** tiers. Clicking a country navigates directly to its detail page — turning a global sweep into a focused investigation in one click.

### 2. Smart Filtering (Region + Tier)
A dual-filter system lets users narrow the country table and map by geographic region (Americas, Europe, Asia, etc.) and stress tier. Researchers can isolate, say, all *Critical* democracies in *Asia* without manual scanning.

### 3. Country Detail View — 14-Year Historical Timeline
A composed area/line chart shows a country's democratic stress score from 2008 onward, with annotated political events overlaid. Users can visually connect policy events (e.g., court-packing, press crackdowns) to measurable score drops.

### 4. Indicator Breakdown with Radar Chart + Sparklines
Seven indicators (media freedom, judicial independence, executive constraints, civil society, etc.) are displayed as a radar chart plus individual trend sparklines. This pinpoints *which* dimension of democracy is degrading — not just *that* it is.

### 5. Rule-Based Risk Flags
An automated flag engine detects 7 risk patterns (e.g., media freedom dropping >10 pts over 3 years, checks-and-balances breakdown). Flags give analysts pre-computed, evidence-backed alerts rather than requiring manual threshold checks.

### 6. AI Insights Panel (Gemini-Powered Narratives)
Each country page includes a pre-generated AI narrative with a headline, summary bullets, confidence level (high/medium/low), and specific watch points. Non-specialist users get an accessible written interpretation of complex indicator data without needing to read raw scores.

### 7. Multi-Country Compare Mode
Users can select 2+ countries and view overlaid timeline trends, a side-by-side indicator table, and a shared event log. Comparative analysis — e.g., Hungary vs. Poland vs. Turkey — becomes a structured workflow rather than tab-switching.

### 8. ML Risk Score Gauge
A machine-learning-derived risk score (separate from the rule-based composite) provides a second opinion signal. The gauge helps users distinguish between model-detected structural risk and indicator-specific flags.

---

## Technical Highlights (User-Relevant)

- **Fast load times** — static data architecture means the dashboard loads in under 1.3 seconds with no runtime API latency
- **Mobile-responsive** — sidebar collapses to a drawer; wide tables scroll horizontally on small screens
- **Accessible** — ARIA labels, reduced-motion support, and 4.5:1 contrast ratios throughout
- **High reliability** — 90.4% test branch coverage across 215 automated tests, with Playwright end-to-end smoke tests guarding critical user journeys
