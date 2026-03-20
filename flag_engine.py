"""
Flag Engine — Democratic Stress AI Dashboard
=============================================
Rule-based risk flag computation for the data pipeline.

This module is intentionally self-contained so that it can be imported by
both ``process_vdem.py`` and the unit-test suite without pulling in the
full pipeline's pandas/numpy dependencies (though it does use pandas
DataFrames as its primary input contract — see ``compute_flags``).

All indicator values are assumed to be on a 0–100 normalized scale where
HIGHER = healthier democracy (inversions are handled upstream in the
pipeline before this module is called).

Flag schema (per flag dict returned):
    {
        "flag":           str  — machine key, e.g. "media_risk"
        "label":          str  — human-readable label
        "description":    str  — rationale sentence shown in UI tooltip
        "year_triggered": int  — earliest year the condition was met
    }
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Flag: Media Risk
# Fires when Media Freedom drops ≥ MEDIA_DROP_THRESHOLD points over any
# rolling window of MEDIA_WINDOW years.
MEDIA_WINDOW: int = 3
MEDIA_DROP_THRESHOLD: float = 10.0

# Flag: Checks & Balances Breakdown
# Fires when both Executive Constraints and Judicial Independence decline
# by more than CHECKS_MIN_DECLINE points year-over-year in the same year.
CHECKS_MIN_DECLINE: float = 3.0

# Flag: Authoritarian Consolidation
# "Rising Rhetoric Radar" in the pipeline is inverted — higher = healthier
# (less polarizing). A FALLING rhetoric score means deterioration.
# Fires when both rhetoric_radar and civil_society_space fall by more than
# AUTH_MIN_DECLINE points year-over-year in the same year.
AUTH_MIN_DECLINE: float = 3.0

# Flag: Sustained Erosion
# Fires when at least SUSTAINED_MIN_INDICATORS indicators each decline by
# more than SUSTAINED_DROP_THRESHOLD points over a rolling window of
# SUSTAINED_WINDOW years.
SUSTAINED_WINDOW: int = 3
SUSTAINED_MIN_INDICATORS: int = 3
SUSTAINED_DROP_THRESHOLD: float = 5.0

# Ordered list of indicator column names expected in the DataFrame.
INDICATOR_KEYS: list[str] = [
    "media_freedom",
    "judicial_independence",
    "civil_society_space",
    "election_quality",
    "executive_constraints",
    "rhetoric_radar",
    "civic_protests",
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def compute_flags(country_df: "pd.DataFrame") -> list[dict]:
    """Apply all four rule-based risk flags to a single country's time series.

    Parameters
    ----------
    country_df:
        A pandas DataFrame with at minimum the columns ``year`` and every
        key in ``INDICATOR_KEYS``.  Values must already be normalized to
        the 0–100 scale (higher = healthier democracy). The DataFrame need
        not be sorted on entry — this function sorts it internally.

    Returns
    -------
    list[dict]
        A list of flag dicts (may be empty).  Each dict has the keys
        ``flag``, ``label``, ``description``, and ``year_triggered``.
        At most one instance of each flag key is returned; the earliest
        trigger year is kept when multiple windows satisfy a rule.
    """
    import pandas as _pd  # local import keeps top-level import optional

    df = country_df.sort_values("year").reset_index(drop=True)
    flags: list[dict] = []

    flags.extend(_flag_media_risk(df))
    flags.extend(_flag_checks_balances(df))
    flags.extend(_flag_authoritarian_consolidation(df))
    flags.extend(_flag_sustained_erosion(df))

    return _deduplicate(flags)


# ---------------------------------------------------------------------------
# Individual flag rules
# ---------------------------------------------------------------------------


def _flag_media_risk(df: "pd.DataFrame") -> list[dict]:
    """Rule 1 — Media Risk.

    Fires when ``media_freedom`` drops >= MEDIA_DROP_THRESHOLD points over
    any rolling MEDIA_WINDOW-year window.  Only the earliest qualifying
    window is reported.
    """
    results: list[dict] = []
    for i in range(len(df) - MEDIA_WINDOW):
        start_val = df.loc[i, "media_freedom"]
        end_val = df.loc[i + MEDIA_WINDOW, "media_freedom"]
        drop = start_val - end_val
        if drop >= MEDIA_DROP_THRESHOLD:
            start_year = int(df.loc[i, "year"])
            end_year = int(df.loc[i + MEDIA_WINDOW, "year"])
            results.append(
                {
                    "flag": "media_risk",
                    "label": "Media Risk",
                    "description": (
                        f"Media Freedom dropped {round(drop, 1)} points "
                        f"from {start_year} to {end_year}."
                    ),
                    "year_triggered": end_year,
                }
            )
            break  # report earliest window only
    return results


def _flag_checks_balances(df: "pd.DataFrame") -> list[dict]:
    """Rule 2 — Checks & Balances Breakdown.

    Fires when both ``executive_constraints`` and ``judicial_independence``
    decline by more than CHECKS_MIN_DECLINE points in the same year
    (year-over-year).  Reports the earliest qualifying year.
    """
    results: list[dict] = []
    for i in range(1, len(df)):
        exec_delta = (
            df.loc[i, "executive_constraints"]
            - df.loc[i - 1, "executive_constraints"]
        )
        judicial_delta = (
            df.loc[i, "judicial_independence"]
            - df.loc[i - 1, "judicial_independence"]
        )
        if exec_delta < -CHECKS_MIN_DECLINE and judicial_delta < -CHECKS_MIN_DECLINE:
            year = int(df.loc[i, "year"])
            results.append(
                {
                    "flag": "checks_balances",
                    "label": "Checks & Balances Breakdown",
                    "description": (
                        f"Executive Constraints and Judicial Independence both "
                        f"declined in {year}."
                    ),
                    "year_triggered": year,
                }
            )
            break
    return results


def _flag_authoritarian_consolidation(df: "pd.DataFrame") -> list[dict]:
    """Rule 3 — Authoritarian Consolidation.

    ``rhetoric_radar`` is scaled so higher = healthier (less polarizing).
    A falling rhetoric_radar score therefore signals more hostile rhetoric.
    Fires when both ``rhetoric_radar`` and ``civil_society_space`` fall by
    more than AUTH_MIN_DECLINE points year-over-year in the same year.
    Reports the earliest qualifying year.
    """
    results: list[dict] = []
    for i in range(1, len(df)):
        rhetoric_delta = (
            df.loc[i, "rhetoric_radar"] - df.loc[i - 1, "rhetoric_radar"]
        )
        civil_delta = (
            df.loc[i, "civil_society_space"]
            - df.loc[i - 1, "civil_society_space"]
        )
        if rhetoric_delta < -AUTH_MIN_DECLINE and civil_delta < -AUTH_MIN_DECLINE:
            year = int(df.loc[i, "year"])
            results.append(
                {
                    "flag": "authoritarian_consolidation",
                    "label": "Authoritarian Consolidation",
                    "description": (
                        f"Rhetoric became more hostile and Civil Society Space "
                        f"shrank in {year}."
                    ),
                    "year_triggered": year,
                }
            )
            break
    return results


def _flag_sustained_erosion(df: "pd.DataFrame") -> list[dict]:
    """Rule 4 — Sustained Erosion.

    Fires when at least SUSTAINED_MIN_INDICATORS indicators each decline by
    more than SUSTAINED_DROP_THRESHOLD points over a rolling window of
    SUSTAINED_WINDOW years.  Reports the earliest qualifying window endpoint.
    """
    results: list[dict] = []
    for i in range(SUSTAINED_WINDOW, len(df)):
        window = df.iloc[i - SUSTAINED_WINDOW : i + 1]
        declining_count = sum(
            1
            for col in INDICATOR_KEYS
            if (window[col].iloc[-1] - window[col].iloc[0]) < -SUSTAINED_DROP_THRESHOLD
        )
        if declining_count >= SUSTAINED_MIN_INDICATORS:
            year = int(df.loc[i, "year"])
            results.append(
                {
                    "flag": "sustained_erosion",
                    "label": "Sustained Erosion",
                    "description": (
                        f"{declining_count} indicators have trended downward "
                        f"for {SUSTAINED_WINDOW}+ years through {year}."
                    ),
                    "year_triggered": year,
                }
            )
            break
    return results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _deduplicate(flags: list[dict]) -> list[dict]:
    """Return flags sorted by year_triggered, keeping the earliest per flag key."""
    seen: set[str] = set()
    deduped: list[dict] = []
    for f in sorted(flags, key=lambda x: x["year_triggered"]):
        if f["flag"] not in seen:
            seen.add(f["flag"])
            deduped.append(f)
    return deduped
