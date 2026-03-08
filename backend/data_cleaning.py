from __future__ import annotations

from typing import Any

import pandas as pd


def _to_numeric(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def normalize_air_quality(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for item in records:
        avg = _to_numeric(item.get("pollutant_avg"))
        category = "unknown"
        if avg is not None:
            if avg <= 50:
                category = "good"
            elif avg <= 100:
                category = "moderate"
            else:
                category = "unhealthy"

        cleaned.append(
            {
                "station": item.get("station", "Unknown"),
                "city": item.get("city", ""),
                "pollutant_id": item.get("pollutant_id", "NA"),
                "pollutant_avg": avg,
                "last_update": item.get("last_update"),
                "aqi_category": category,
            }
        )
    return cleaned


def normalize_rainfall(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for item in records:
        cleaned.append(
            {
                "station": item.get("station", "Unknown"),
                "date": item.get("date"),
                "rainfall": _to_numeric(item.get("rainfall")),
                "temperature": _to_numeric(item.get("temperature")),
            }
        )
    return cleaned


def normalize_accidents(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for item in records:
        cleaned.append(
            {
                "state": item.get("state", ""),
                "district": item.get("district", "Unknown"),
                "road_type": item.get("road_type", "Unknown"),
                "accidents": _to_numeric(item.get("accidents")) or 0,
                "fatalities": _to_numeric(item.get("fatalities")) or 0,
            }
        )
    return cleaned


def normalize_schemes(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for item in records:
        cleaned.append(
            {
                "scheme_name": item.get("scheme_name", "Unnamed Scheme"),
                "ministry": item.get("ministry", "Unknown"),
                "sector": item.get("sector", "General"),
                "benefits": item.get("benefits", ""),
                "eligibility": item.get("eligibility", ""),
                "beneficiary_type": item.get("beneficiary_type", "General"),
            }
        )
    return cleaned


def compute_civic_insights(
    air_records: list[dict[str, Any]],
    rainfall_records: list[dict[str, Any]],
    accident_records: list[dict[str, Any]],
) -> dict[str, Any]:
    most_polluted_station = None
    if air_records:
        air_df = pd.DataFrame(air_records)
        if "pollutant_avg" in air_df.columns and not air_df["pollutant_avg"].dropna().empty:
            top = air_df.sort_values("pollutant_avg", ascending=False).iloc[0]
            most_polluted_station = {
                "station": top.get("station"),
                "pollutant_avg": top.get("pollutant_avg"),
                "pollutant_id": top.get("pollutant_id"),
            }

    rainfall_alert = None
    if rainfall_records:
        rain_df = pd.DataFrame(rainfall_records)
        if "rainfall" in rain_df.columns and not rain_df["rainfall"].dropna().empty:
            mean_val = rain_df["rainfall"].dropna().mean()
            latest = rain_df.dropna(subset=["rainfall"]).iloc[-1]
            if latest["rainfall"] > (mean_val * 1.5):
                rainfall_alert = {
                    "station": latest.get("station"),
                    "date": latest.get("date"),
                    "rainfall": latest.get("rainfall"),
                    "message": "Rainfall spike detected",
                }

    accident_hotspot = None
    if accident_records:
        accident_df = pd.DataFrame(accident_records)
        if "accidents" in accident_df.columns and not accident_df["accidents"].dropna().empty:
            top_acc = accident_df.sort_values("accidents", ascending=False).iloc[0]
            accident_hotspot = {
                "district": top_acc.get("district"),
                "accidents": top_acc.get("accidents"),
                "road_type": top_acc.get("road_type"),
            }

    return {
        "most_polluted_station": most_polluted_station,
        "rainfall_spike_alert": rainfall_alert,
        "accident_hotspot": accident_hotspot,
    }