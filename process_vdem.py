"""
V-Dem Data Pipeline — Democratic Stress AI Dashboard (PoC)
==========================================================
Inputs:  V_Dem_CY_Core_v14.csv  (download from https://v-dem.net/data/the-v-dem-dataset/)
Outputs: public/data.json        (consumed directly by the React frontend)

Usage:
    python process_vdem.py --input V_Dem_CY_Core_v14.csv --output ../public/data.json

Dependencies:
    pip install pandas numpy
"""

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from flag_engine import compute_flags  # noqa: E402 — local module


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

COUNTRIES = {
    "HUN": "Hungary",
    "POL": "Poland",
    "IND": "India",
    "TUR": "Turkey",
    "BRA": "Brazil",
    "USA": "United States",
    "VEN": "Venezuela",
    "RUS": "Russia",
    "NIC": "Nicaragua",
    "PHL": "Philippines",
}

# ISO 3166-1 alpha-3 → alpha-2 mapping for flagcdn.com
# URL pattern: https://flagcdn.com/w80/{alpha2}.png  (also: w40, w160, svg)
FLAG_ALPHA2 = {
    "HUN": "hu",
    "POL": "pl",
    "IND": "in",
    "TUR": "tr",
    "BRA": "br",
    "USA": "us",
    "VEN": "ve",
    "RUS": "ru",
    "NIC": "ni",
    "PHL": "ph",
}

def flag_url(iso: str, size: str = "w80") -> str:
    """Return a flagcdn.com PNG URL for a given ISO alpha-3 code."""
    alpha2 = FLAG_ALPHA2.get(iso, "").lower()
    if not alpha2:
        return ""
    return f"https://flagcdn.com/{size}/{alpha2}.png"

YEAR_MIN = 2009
YEAR_MAX = 2024

# V-Dem column → indicator key
# All variables are scored so that HIGHER = healthier democracy after inversion.
INDICATOR_MAP = {
    "v2mecenefi":   "media_freedom",        # Media censorship effort (lower raw = more censorship → invert)
    "v2juhcind":    "judicial_independence", # High court independence
    "v2cseeorgs":   "civil_society_space",   # CSO entry/exit repression (lower = more repression → invert)
    "v2xel_frefair":"election_quality",      # Free & fair elections index (already 0–1, higher = better)
    "v2xlg_legcon": "executive_constraints", # Legislative constraints on executive
    "v2dlencmps":   "rhetoric_radar",        # Lack of elite polarization proxy (lower = more polarizing → invert)
    "v2csprtcpt":   "civic_protests",        # CSO participatory environment
}

# Variables where the raw V-Dem scale is INVERTED relative to "higher = healthier"
# These will be multiplied by -1 before normalization.
INVERT_VARS = {"v2mecenefi", "v2cseeorgs", "v2dlencmps"}

INDICATOR_LABELS = {
    "media_freedom":        "Media Freedom",
    "judicial_independence":"Judicial Independence",
    "civil_society_space":  "Civil Society Space",
    "election_quality":     "Election Quality",
    "executive_constraints":"Executive Constraints",
    "rhetoric_radar":       "Rhetoric Radar",
    "civic_protests":       "Civic Protests",
}

# Equal weights for PoC — adjust here to experiment
WEIGHTS = {k: 1.0 for k in INDICATOR_MAP.values()}

# ---------------------------------------------------------------------------
# Risk flag logic — implemented in flag_engine.py, imported above
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Scoring tier
# ---------------------------------------------------------------------------

def score_to_tier(score: float, prev_score: float | None = None) -> str:
    if prev_score is not None and (prev_score - score) >= 15:
        return "rapid_erosion"
    if score <= 40:
        return "critical"
    if score <= 65:
        return "elevated"
    return "stable"


TIER_LABELS = {
    "stable":        "Stable",
    "elevated":      "Elevated",
    "critical":      "Critical",
    "rapid_erosion": "Rapid Erosion",
}


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def normalize_series(series: pd.Series) -> pd.Series:
    """Min-max normalize a series to 0–100. NaNs preserved."""
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series([50.0] * len(series), index=series.index)
    return ((series - mn) / (mx - mn)) * 100


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(input_path: str, output_path: str) -> None:
    print(f"[1/6] Loading V-Dem CSV from {input_path} …")
    try:
        raw = pd.read_csv(input_path, low_memory=False)
    except FileNotFoundError:
        print(
            f"\n❌  File not found: {input_path}\n"
            "    Download the V-Dem Core CSV from https://v-dem.net/data/the-v-dem-dataset/\n"
            "    and pass it via --input."
        )
        sys.exit(1)

    print(f"    Loaded {len(raw):,} rows × {len(raw.columns):,} columns.")

    # --- Filter rows ---
    print("[2/6] Filtering to 10 seed countries and 2009–2024 …")
    needed_cols = ["country_text_id", "year"] + list(INDICATOR_MAP.keys())
    missing = [c for c in needed_cols if c not in raw.columns]
    if missing:
        print(f"❌  Missing expected columns: {missing}")
        print("    Check your V-Dem version — this script targets v14.")
        sys.exit(1)

    df = raw[needed_cols].copy()
    df = df[df["country_text_id"].isin(COUNTRIES.keys())]
    df = df[(df["year"] >= YEAR_MIN) & (df["year"] <= YEAR_MAX)]
    df = df.dropna(subset=list(INDICATOR_MAP.keys()))
    print(f"    {len(df)} rows after filtering.")

    # --- Invert variables where lower raw = worse ---
    print("[3/6] Inverting negative-scale variables …")
    for col in INVERT_VARS:
        df[col] = df[col] * -1

    # --- Normalize each indicator globally (across all countries + years) ---
    print("[4/6] Normalizing indicators to 0–100 …")
    for vdem_col, indicator_key in INDICATOR_MAP.items():
        df[indicator_key] = normalize_series(df[vdem_col])

    # --- Compute composite score ---
    print("[5/6] Computing composite scores and risk flags …")
    indicator_keys = list(INDICATOR_MAP.values())
    total_weight = sum(WEIGHTS.values())
    df["composite"] = sum(df[k] * WEIGHTS[k] for k in indicator_keys) / total_weight
    df["composite"] = df["composite"].round(1)
    for k in indicator_keys:
        df[k] = df[k].round(1)

    # --- Build output JSON ---
    print("[6/6] Building output JSON …")
    output = {
        "meta": {
            "generated_at": pd.Timestamp.now().isoformat(),
            "year_range": [YEAR_MIN, YEAR_MAX],
            "countries": len(COUNTRIES),
            "indicators": INDICATOR_LABELS,
            "vdem_version": "v14",
            "normalization": "global_minmax",
            "weights": WEIGHTS,
        },
        "countries": [],
    }

    for iso, name in COUNTRIES.items():
        cdf = df[df["country_text_id"] == iso].sort_values("year").reset_index(drop=True)
        if cdf.empty:
            print(f"    ⚠️  No data found for {name} ({iso}) — skipping.")
            continue

        # Time series
        timeline = []
        for _, row in cdf.iterrows():
            prev_rows = cdf[cdf["year"] < row["year"]]
            prev_score = prev_rows.iloc[-1]["composite"] if not prev_rows.empty else None
            tier = score_to_tier(row["composite"], prev_score)
            entry = {
                "year": int(row["year"]),
                "composite": float(row["composite"]),
                "tier": tier,
                "tier_label": TIER_LABELS[tier],
                "indicators": {k: float(row[k]) for k in indicator_keys},
            }
            timeline.append(entry)

        # Current snapshot (most recent year)
        latest = timeline[-1]
        prev_score = timeline[-2]["composite"] if len(timeline) > 1 else None
        current_tier = score_to_tier(latest["composite"], prev_score)

        # One-year change
        one_year_change = None
        if len(timeline) >= 2:
            one_year_change = round(latest["composite"] - timeline[-2]["composite"], 1)

        # Five-year change
        five_year_change = None
        five_years_ago = [t for t in timeline if t["year"] == latest["year"] - 5]
        if five_years_ago:
            five_year_change = round(latest["composite"] - five_years_ago[0]["composite"], 1)

        # Risk flags
        flags = compute_flags(cdf)

        # Indicator trends (current value + direction vs 3 years ago)
        indicator_snapshot = {}
        three_years_ago = [t for t in timeline if t["year"] == latest["year"] - 3]
        for k in indicator_keys:
            current_val = latest["indicators"][k]
            trend = "stable"
            if three_years_ago:
                delta = current_val - three_years_ago[0]["indicators"][k]
                if delta >= 5:
                    trend = "improving"
                elif delta <= -10:
                    trend = "rapidly_declining"
                elif delta <= -5:
                    trend = "declining"
            indicator_snapshot[k] = {
                "label": INDICATOR_LABELS[k],
                "value": current_val,
                "trend": trend,
            }

        output["countries"].append({
            "iso": iso,
            "name": name,
            "flag_url": flag_url(iso),
            "current_score": latest["composite"],
            "current_tier": current_tier,
            "current_tier_label": TIER_LABELS[current_tier],
            "one_year_change": one_year_change,
            "five_year_change": five_year_change,
            "latest_year": latest["year"],
            "flags": flags,
            "indicators": indicator_snapshot,
            "timeline": timeline,
            "ml_score": {
                "value": None,
                "label": "Beta",
                "description": "ML erosion probability — beta feature, stub value for PoC.",
                "unit": "probability_0_to_100",
                "is_stub": True,
            },
        })

    # Sort countries by current score ascending (most stressed first)
    output["countries"].sort(key=lambda c: c["current_score"])

    # --- Write output ---
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅  Done. Output written to {output_path}")
    print(f"    {len(output['countries'])} countries processed.")
    print(f"    File size: {out.stat().st_size / 1024:.1f} KB")

    # Quick summary table
    print("\n    Country Summary:")
    print(f"    {'Country':<22} {'Score':>6}  {'Tier':<16}  {'1yr':>5}  {'Flags'}")
    print("    " + "-" * 65)
    for c in output["countries"]:
        flags_str = ", ".join(f["label"] for f in c["flags"]) if c["flags"] else "—"
        change_str = f"{c['one_year_change']:+.1f}" if c["one_year_change"] is not None else "  n/a"
        print(
            f"    {c['name']:<22} {c['current_score']:>6.1f}  "
            f"{c['current_tier_label']:<16}  {change_str:>5}  {flags_str}"
        )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Process V-Dem CSV into Democratic Stress Dashboard JSON."
    )
    parser.add_argument(
        "--input",
        default="V_Dem_CY_Core_v14.csv",
        help="Path to the V-Dem Core CSV file (default: V_Dem_CY_Core_v14.csv)",
    )
    parser.add_argument(
        "--output",
        default="../public/data.json",
        help="Output path for the JSON file (default: ../public/data.json)",
    )
    args = parser.parse_args()
    run(args.input, args.output)
