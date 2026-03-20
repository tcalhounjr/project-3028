"""
PRO-36 — Flag Engine Unit Tests
================================
Tests the four rule-based risk flag rules implemented in flag_engine.py.

Synthetic DataFrames are built with pandas so the tests exercise the same
code path the pipeline uses.  No external data files are required.

Test classes
------------
TestMediaRisk                  Rule 1 — Media Freedom drop >= 10 pts / 3 yrs
TestChecksBalancesBreakdown    Rule 2 — Simultaneous exec + judicial decline
TestAuthoritarianConsolidation Rule 3 — Rhetoric falls + civil society shrinks
TestSustainedErosion           Rule 4 — 3+ indicators down for 3+ years
TestNoFalsePositives           Stable data must never fire any flag
TestFlagOutputSchema           Every emitted flag must have the required keys
TestDeduplication              Each flag key appears at most once in output
"""

import pytest
import pandas as pd

from flag_engine import (
    compute_flags,
    INDICATOR_KEYS,
    MEDIA_DROP_THRESHOLD,
    MEDIA_WINDOW,
    CHECKS_MIN_DECLINE,
    AUTH_MIN_DECLINE,
    SUSTAINED_WINDOW,
    SUSTAINED_MIN_INDICATORS,
    SUSTAINED_DROP_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

BASE_YEAR = 2009
_ALL_INDICATORS = INDICATOR_KEYS


def _make_stable_df(n_years: int = 15, base_value: float = 60.0) -> pd.DataFrame:
    """Return a DataFrame with all indicators flat at ``base_value``."""
    years = list(range(BASE_YEAR, BASE_YEAR + n_years))
    data: dict = {"year": years}
    for key in _ALL_INDICATORS:
        data[key] = [base_value] * n_years
    return pd.DataFrame(data)


def _set_column(df: pd.DataFrame, col: str, values: list[float]) -> pd.DataFrame:
    """Return a copy of ``df`` with ``col`` replaced by ``values``."""
    df = df.copy()
    df[col] = values
    return df


# ---------------------------------------------------------------------------
# Rule 1 — Media Risk
# ---------------------------------------------------------------------------


class TestMediaRisk:
    """Media Freedom drops >= 10 points over any rolling 3-year window."""

    def test_fires_when_media_drops_exactly_threshold_over_3_years(self):
        """Flag fires when drop equals MEDIA_DROP_THRESHOLD exactly."""
        df = _make_stable_df(n_years=10)
        # Years 0-2: 60.0, year 3 onward: 50.0 → drop of exactly 10.0
        values = [60.0] * 3 + [60.0 - MEDIA_DROP_THRESHOLD] * 7
        df = _set_column(df, "media_freedom", values)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "media_risk" in flag_keys

    def test_fires_when_media_drop_exceeds_threshold(self):
        """Flag fires when drop is substantially above the threshold."""
        df = _make_stable_df(n_years=10)
        # Drop 25 points over years 0→3
        values = [80.0, 75.0, 65.0, 55.0] + [55.0] * 6
        df = _set_column(df, "media_freedom", values)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "media_risk" in flag_keys

    def test_does_not_fire_when_drop_is_below_threshold(self):
        """Flag must not fire when the drop is just under the threshold."""
        df = _make_stable_df(n_years=10)
        # Drop of 9.9 — below the 10-point threshold
        drop = MEDIA_DROP_THRESHOLD - 0.1
        values = [60.0, 58.0, 54.0, 60.0 - drop] + [60.0 - drop] * 6
        df = _set_column(df, "media_freedom", values)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "media_risk" not in flag_keys

    def test_description_contains_drop_amount_and_years(self):
        """Rationale sentence must include the numeric drop and both years."""
        df = _make_stable_df(n_years=10)
        values = [70.0] + [70.0] * 2 + [55.0] * 7  # drop of 15 between row 0 and row 3
        df = _set_column(df, "media_freedom", values)
        flags = compute_flags(df)
        media_flags = [f for f in flags if f["flag"] == "media_risk"]
        assert len(media_flags) == 1
        desc = media_flags[0]["description"]
        assert "15.0" in desc
        assert str(BASE_YEAR) in desc

    def test_year_triggered_is_end_of_window(self):
        """year_triggered must equal the year at the end of the qualifying window."""
        df = _make_stable_df(n_years=10)
        # The window spans rows 0–3, so year_triggered = BASE_YEAR + 3
        values = [70.0] * 3 + [50.0] * 7
        df = _set_column(df, "media_freedom", values)
        flags = compute_flags(df)
        media_flags = [f for f in flags if f["flag"] == "media_risk"]
        assert media_flags[0]["year_triggered"] == BASE_YEAR + MEDIA_WINDOW


# ---------------------------------------------------------------------------
# Rule 2 — Checks & Balances Breakdown
# ---------------------------------------------------------------------------


class TestChecksBalancesBreakdown:
    """Both Executive Constraints and Judicial Independence decline YoY > threshold."""

    def test_fires_when_both_decline_in_same_year(self):
        """Flag fires when both indicators drop > CHECKS_MIN_DECLINE YoY."""
        df = _make_stable_df(n_years=10)
        # Year index 1: drop both by 5 points
        drop = CHECKS_MIN_DECLINE + 2.0
        exec_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        jud_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "executive_constraints", exec_vals)
        df = _set_column(df, "judicial_independence", jud_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "checks_balances" in flag_keys

    def test_does_not_fire_when_only_exec_declines(self):
        """Flag must not fire when only executive_constraints declines."""
        df = _make_stable_df(n_years=10)
        drop = CHECKS_MIN_DECLINE + 2.0
        exec_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "executive_constraints", exec_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "checks_balances" not in flag_keys

    def test_does_not_fire_when_only_judicial_declines(self):
        """Flag must not fire when only judicial_independence declines."""
        df = _make_stable_df(n_years=10)
        drop = CHECKS_MIN_DECLINE + 2.0
        jud_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "judicial_independence", jud_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "checks_balances" not in flag_keys

    def test_does_not_fire_when_declines_are_below_threshold(self):
        """Flag must not fire when declines are at or below CHECKS_MIN_DECLINE."""
        df = _make_stable_df(n_years=10)
        # Decline of exactly threshold (not strictly greater)
        drop = CHECKS_MIN_DECLINE
        exec_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        jud_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "executive_constraints", exec_vals)
        df = _set_column(df, "judicial_independence", jud_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "checks_balances" not in flag_keys

    def test_year_triggered_matches_decline_year(self):
        """year_triggered must be the year both indicators declined."""
        df = _make_stable_df(n_years=10)
        drop = CHECKS_MIN_DECLINE + 2.0
        # Trigger at index 3 — year BASE_YEAR + 3
        exec_vals = [60.0] * 3 + [60.0 - drop] + [60.0 - drop] * 6
        jud_vals = [60.0] * 3 + [60.0 - drop] + [60.0 - drop] * 6
        df = _set_column(df, "executive_constraints", exec_vals)
        df = _set_column(df, "judicial_independence", jud_vals)
        flags = compute_flags(df)
        cb_flags = [f for f in flags if f["flag"] == "checks_balances"]
        assert cb_flags[0]["year_triggered"] == BASE_YEAR + 3


# ---------------------------------------------------------------------------
# Rule 3 — Authoritarian Consolidation
# ---------------------------------------------------------------------------


class TestAuthoritarianConsolidation:
    """rhetoric_radar falls AND civil_society_space falls YoY > threshold."""

    def test_fires_when_both_indicators_fall_in_same_year(self):
        """Flag fires when both rhetoric_radar and civil_society_space drop > threshold."""
        df = _make_stable_df(n_years=10)
        drop = AUTH_MIN_DECLINE + 2.0
        rhet_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        civil_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "rhetoric_radar", rhet_vals)
        df = _set_column(df, "civil_society_space", civil_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "authoritarian_consolidation" in flag_keys

    def test_does_not_fire_when_only_rhetoric_falls(self):
        """Flag must not fire when only rhetoric_radar declines."""
        df = _make_stable_df(n_years=10)
        drop = AUTH_MIN_DECLINE + 2.0
        rhet_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "rhetoric_radar", rhet_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "authoritarian_consolidation" not in flag_keys

    def test_does_not_fire_when_only_civil_society_falls(self):
        """Flag must not fire when only civil_society_space declines."""
        df = _make_stable_df(n_years=10)
        drop = AUTH_MIN_DECLINE + 2.0
        civil_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "civil_society_space", civil_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "authoritarian_consolidation" not in flag_keys

    def test_does_not_fire_when_rhetoric_rises_civil_falls(self):
        """Flag must not fire when rhetoric improves (rising = healthier) but civil falls."""
        df = _make_stable_df(n_years=10)
        drop = AUTH_MIN_DECLINE + 2.0
        # Rhetoric rising (good) — civil falling (bad)
        rhet_vals = [60.0] + [60.0 + drop] + [60.0 + drop] * 8
        civil_vals = [60.0] + [60.0 - drop] + [60.0 - drop] * 8
        df = _set_column(df, "rhetoric_radar", rhet_vals)
        df = _set_column(df, "civil_society_space", civil_vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "authoritarian_consolidation" not in flag_keys

    def test_year_triggered_matches_consolidation_year(self):
        """year_triggered must be the year both indicators declined."""
        df = _make_stable_df(n_years=10)
        drop = AUTH_MIN_DECLINE + 2.0
        # Trigger at index 5 — year BASE_YEAR + 5
        rhet_vals = [60.0] * 5 + [60.0 - drop] + [60.0 - drop] * 4
        civil_vals = [60.0] * 5 + [60.0 - drop] + [60.0 - drop] * 4
        df = _set_column(df, "rhetoric_radar", rhet_vals)
        df = _set_column(df, "civil_society_space", civil_vals)
        flags = compute_flags(df)
        ac_flags = [f for f in flags if f["flag"] == "authoritarian_consolidation"]
        assert ac_flags[0]["year_triggered"] == BASE_YEAR + 5


# ---------------------------------------------------------------------------
# Rule 4 — Sustained Erosion
# ---------------------------------------------------------------------------


class TestSustainedErosion:
    """3+ indicators each declining > 5 pts over any 3-year rolling window."""

    def _make_df_with_n_indicators_declining(
        self,
        n_declining: int,
        drop: float = SUSTAINED_DROP_THRESHOLD + 2.0,
        n_years: int = 15,
    ) -> pd.DataFrame:
        """Build a DataFrame where exactly ``n_declining`` indicators decline
        by ``drop`` points over SUSTAINED_WINDOW years starting at year index 3."""
        df = _make_stable_df(n_years=n_years)
        trigger_start = 3  # window: rows 3..3+SUSTAINED_WINDOW
        trigger_end = trigger_start + SUSTAINED_WINDOW
        for i, key in enumerate(_ALL_INDICATORS):
            if i < n_declining:
                vals = list(df[key])
                # Apply gradual decline across the window
                for j in range(trigger_start, trigger_end + 1):
                    vals[j] = vals[trigger_start] - drop * (
                        (j - trigger_start) / SUSTAINED_WINDOW
                    )
                # Hold the low value after the window
                final_val = vals[trigger_end]
                for j in range(trigger_end + 1, n_years):
                    vals[j] = final_val
                df = _set_column(df, key, vals)
        return df

    def test_fires_when_exactly_min_indicators_decline(self):
        """Flag fires when exactly SUSTAINED_MIN_INDICATORS indicators decline."""
        df = self._make_df_with_n_indicators_declining(SUSTAINED_MIN_INDICATORS)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "sustained_erosion" in flag_keys

    def test_fires_when_more_than_min_indicators_decline(self):
        """Flag fires when all indicators decline."""
        df = self._make_df_with_n_indicators_declining(len(_ALL_INDICATORS))
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "sustained_erosion" in flag_keys

    def test_does_not_fire_when_fewer_than_min_indicators_decline(self):
        """Flag must not fire when only SUSTAINED_MIN_INDICATORS - 1 indicators decline."""
        df = self._make_df_with_n_indicators_declining(SUSTAINED_MIN_INDICATORS - 1)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "sustained_erosion" not in flag_keys

    def test_does_not_fire_when_drops_are_below_threshold(self):
        """Flag must not fire when indicator drops are below SUSTAINED_DROP_THRESHOLD."""
        df = self._make_df_with_n_indicators_declining(
            n_declining=len(_ALL_INDICATORS),
            drop=SUSTAINED_DROP_THRESHOLD - 0.1,
        )
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert "sustained_erosion" not in flag_keys

    def test_description_includes_declining_count_and_window(self):
        """Rationale sentence must include the declining count and window size."""
        df = self._make_df_with_n_indicators_declining(len(_ALL_INDICATORS))
        flags = compute_flags(df)
        se_flags = [f for f in flags if f["flag"] == "sustained_erosion"]
        assert len(se_flags) == 1
        desc = se_flags[0]["description"]
        assert str(len(_ALL_INDICATORS)) in desc
        assert str(SUSTAINED_WINDOW) in desc


# ---------------------------------------------------------------------------
# Stable data — no false positives
# ---------------------------------------------------------------------------


class TestNoFalsePositives:
    """A country with flat indicators must produce zero flags."""

    def test_no_flags_on_perfectly_stable_data(self):
        """Zero flags expected when all indicators are constant."""
        df = _make_stable_df(n_years=15, base_value=70.0)
        flags = compute_flags(df)
        assert flags == [], f"Expected no flags on stable data, got: {flags}"

    def test_no_flags_on_slowly_improving_data(self):
        """Zero flags expected when all indicators improve gradually."""
        n = 15
        years = list(range(BASE_YEAR, BASE_YEAR + n))
        data: dict = {"year": years}
        for key in _ALL_INDICATORS:
            # Steady improvement: 50 → 65 over 15 years
            data[key] = [50.0 + i for i in range(n)]
        df = pd.DataFrame(data)
        flags = compute_flags(df)
        assert flags == [], f"Expected no flags on improving data, got: {flags}"

    def test_no_flags_on_small_fluctuations(self):
        """Zero flags expected when indicators fluctuate within a narrow band."""
        import math

        n = 15
        years = list(range(BASE_YEAR, BASE_YEAR + n))
        data: dict = {"year": years}
        for key in _ALL_INDICATORS:
            # Oscillate ±2 points around 60 — never breaches any threshold
            data[key] = [60.0 + 2.0 * math.sin(i) for i in range(n)]
        df = pd.DataFrame(data)
        flags = compute_flags(df)
        assert flags == [], f"Expected no flags on minor oscillation data, got: {flags}"


# ---------------------------------------------------------------------------
# Flag output schema
# ---------------------------------------------------------------------------


class TestFlagOutputSchema:
    """Every flag dict must have the four required keys with correct types."""

    REQUIRED_KEYS = {"flag", "label", "description", "year_triggered"}

    def _collect_all_flags(self) -> list[dict]:
        """Trigger one instance of each of the four flags."""
        n = 15
        df = _make_stable_df(n_years=n)
        drop_big = 20.0

        # Media Risk
        mf_vals = [80.0] * 3 + [60.0] + [60.0] * (n - 4)
        df = _set_column(df, "media_freedom", mf_vals)

        # Checks & Balances
        exec_vals = [70.0] + [70.0 - drop_big] + [50.0] * (n - 2)
        jud_vals = [70.0] + [70.0 - drop_big] + [50.0] * (n - 2)
        df = _set_column(df, "executive_constraints", exec_vals)
        df = _set_column(df, "judicial_independence", jud_vals)

        # Authoritarian Consolidation
        rhet_vals = [70.0] + [70.0 - drop_big] + [50.0] * (n - 2)
        civil_vals = [70.0] + [70.0 - drop_big] + [50.0] * (n - 2)
        df = _set_column(df, "rhetoric_radar", rhet_vals)
        df = _set_column(df, "civil_society_space", civil_vals)

        # Sustained Erosion — steady decline across all indicators
        for key in _ALL_INDICATORS:
            vals = [80.0 - i * 3.0 for i in range(n)]
            df = _set_column(df, key, vals)

        return compute_flags(df)

    def test_each_flag_has_all_required_keys(self):
        """Every returned flag dict must have all four required keys."""
        flags = self._collect_all_flags()
        assert len(flags) > 0, "Expected at least one flag to be generated for schema test"
        for f in flags:
            missing = self.REQUIRED_KEYS - set(f.keys())
            assert not missing, f"Flag {f.get('flag')} is missing keys: {missing}"

    def test_flag_key_is_string(self):
        """'flag' must be a non-empty string."""
        flags = self._collect_all_flags()
        for f in flags:
            assert isinstance(f["flag"], str) and f["flag"], (
                f"Expected non-empty string for 'flag', got: {f['flag']!r}"
            )

    def test_label_is_string(self):
        """'label' must be a non-empty string."""
        flags = self._collect_all_flags()
        for f in flags:
            assert isinstance(f["label"], str) and f["label"], (
                f"Expected non-empty string for 'label', got: {f['label']!r}"
            )

    def test_description_is_string(self):
        """'description' must be a non-empty string."""
        flags = self._collect_all_flags()
        for f in flags:
            assert isinstance(f["description"], str) and f["description"], (
                f"Expected non-empty string for 'description', got: {f['description']!r}"
            )

    def test_year_triggered_is_int(self):
        """'year_triggered' must be an integer."""
        flags = self._collect_all_flags()
        for f in flags:
            assert isinstance(f["year_triggered"], int), (
                f"Expected int for 'year_triggered', got: {type(f['year_triggered'])}"
            )

    def test_known_flag_keys_use_expected_values(self):
        """Machine flag keys must be one of the four canonical values."""
        valid_keys = {
            "media_risk",
            "checks_balances",
            "authoritarian_consolidation",
            "sustained_erosion",
        }
        flags = self._collect_all_flags()
        for f in flags:
            assert f["flag"] in valid_keys, (
                f"Unexpected flag key '{f['flag']}' — not in {valid_keys}"
            )


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------


class TestDeduplication:
    """Each flag key must appear at most once; earliest year_triggered is kept."""

    def test_each_flag_key_appears_at_most_once(self):
        """compute_flags must not return two dicts with the same 'flag' key."""
        n = 20
        df = _make_stable_df(n_years=n)
        # Create a prolonged media decline that would qualify at multiple windows
        vals = [80.0 - i * 2.5 for i in range(n)]
        df = _set_column(df, "media_freedom", vals)
        flags = compute_flags(df)
        flag_keys = [f["flag"] for f in flags]
        assert len(flag_keys) == len(set(flag_keys)), (
            f"Duplicate flag keys found: {flag_keys}"
        )

    def test_earliest_trigger_year_is_kept_for_media_risk(self):
        """When media_risk could fire at multiple windows, the earliest is returned."""
        n = 15
        df = _make_stable_df(n_years=n)
        # Continuous steep decline — many windows qualify
        vals = [90.0 - i * 5.0 for i in range(n)]
        df = _set_column(df, "media_freedom", vals)
        flags = compute_flags(df)
        media_flags = [f for f in flags if f["flag"] == "media_risk"]
        assert len(media_flags) == 1
        # Earliest qualifying window is row 0→3 → year BASE_YEAR + 3
        assert media_flags[0]["year_triggered"] == BASE_YEAR + MEDIA_WINDOW
