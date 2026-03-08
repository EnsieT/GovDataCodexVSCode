from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .data_cleaning import (
    compute_civic_insights,
    normalize_accidents,
    normalize_air_quality,
    normalize_rainfall,
    normalize_schemes,
)
from .data_fetcher import RESOURCE_MAP, fetch_all_and_cache, fetch_dataset, read_cached_dataset


BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = Path(os.getenv("CACHE_DIR", str(BASE_DIR / "data" / "cached_json")))

app = FastAPI(title="Mumbai Civic Intelligence Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _matches_location(record: dict[str, Any], region: str | None, pincode: str | None) -> bool:
    if not region and not pincode:
        return True

    values = [str(value).lower() for value in record.values() if value is not None]
    searchable = " ".join(values)

    region_match = True
    if region:
        region_match = region.lower() in searchable

    pincode_match = True
    if pincode:
        digits = "".join(ch for ch in pincode if ch.isdigit())
        pincode_match = digits and digits in searchable

    return bool(region_match and pincode_match)


def _filter_records_by_location(
    records: list[dict[str, Any]], region: str | None, pincode: str | None
) -> list[dict[str, Any]]:
    return [record for record in records if _matches_location(record, region, pincode)]


def _get_dataset(dataset_name: str, force_refresh: bool = False) -> dict[str, Any]:
    if dataset_name not in RESOURCE_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown dataset: {dataset_name}")

    if force_refresh:
        from .api_client import DataGovClient

        payload = fetch_dataset(client=DataGovClient(), dataset_name=dataset_name)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        (CACHE_DIR / f"{dataset_name}.json").write_text(
            json.dumps(payload, indent=2),
            encoding="utf-8",
        )
        return payload

    payload = read_cached_dataset(CACHE_DIR, dataset_name)
    if payload.get("error") == "cache_miss":
        refreshed = fetch_all_and_cache(CACHE_DIR)
        return refreshed.get(dataset_name, payload)

    return payload


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/refresh")
def refresh_all(limit: int = Query(default=1000, ge=10, le=10000)) -> dict[str, Any]:
    return fetch_all_and_cache(CACHE_DIR, limit=limit)


@app.get("/api/air-quality/live")
def get_live_air_quality(region: str | None = None, pincode: str | None = None) -> dict[str, Any]:
    payload = _get_dataset("air_quality_live")
    records = normalize_air_quality(payload.get("records", []))
    records = _filter_records_by_location(records, region, pincode)
    return {"count": len(records), "records": records, "fetched_at": payload.get("fetched_at")}


@app.get("/api/air-quality/historical")
def get_historical_air_quality(region: str | None = None, pincode: str | None = None) -> dict[str, Any]:
    payload = _get_dataset("air_quality_historical")
    records = normalize_air_quality(payload.get("records", []))
    records = _filter_records_by_location(records, region, pincode)
    return {"count": len(records), "records": records, "fetched_at": payload.get("fetched_at")}


@app.get("/api/weather/rainfall")
def get_rainfall(region: str | None = None, pincode: str | None = None) -> dict[str, Any]:
    payload = _get_dataset("weather_rainfall")
    records = normalize_rainfall(payload.get("records", []))
    records = _filter_records_by_location(records, region, pincode)
    return {"count": len(records), "records": records, "fetched_at": payload.get("fetched_at")}


@app.get("/api/accidents")
def get_accidents(region: str | None = None, pincode: str | None = None) -> dict[str, Any]:
    payload = _get_dataset("road_accidents")
    records = normalize_accidents(payload.get("records", []))
    records = _filter_records_by_location(records, region, pincode)
    return {"count": len(records), "records": records, "fetched_at": payload.get("fetched_at")}


@app.get("/api/schemes")
def get_schemes(
    sector: str | None = None,
    beneficiary_type: str | None = None,
    ministry: str | None = None,
) -> dict[str, Any]:
    payload = _get_dataset("government_schemes")
    records = normalize_schemes(payload.get("records", []))

    filtered = records
    if sector:
        filtered = [item for item in filtered if sector.lower() in item["sector"].lower()]
    if beneficiary_type:
        filtered = [
            item
            for item in filtered
            if beneficiary_type.lower() in item.get("beneficiary_type", "").lower()
            or beneficiary_type.lower() in item.get("eligibility", "").lower()
        ]
    if ministry:
        filtered = [item for item in filtered if ministry.lower() in item["ministry"].lower()]

    return {"count": len(filtered), "records": filtered, "fetched_at": payload.get("fetched_at")}


@app.get("/api/infrastructure")
def get_infrastructure() -> dict[str, Any]:
    school = _get_dataset("school_infrastructure")
    health = _get_dataset("health_infrastructure")
    census = _get_dataset("census_data")
    rbi = _get_dataset("rbi_indicators")

    return {
        "school_infrastructure": school.get("records", []),
        "health_infrastructure": health.get("records", []),
        "census_data": census.get("records", []),
        "rbi_indicators": rbi.get("records", []),
    }


@app.get("/api/location-options")
def get_location_options() -> dict[str, Any]:
    air = normalize_air_quality(_get_dataset("air_quality_live").get("records", []))
    rain = normalize_rainfall(_get_dataset("weather_rainfall").get("records", []))
    accidents = normalize_accidents(_get_dataset("road_accidents").get("records", []))

    merged = air + rain + accidents
    regions = sorted({row.get("region", "").strip() for row in merged if row.get("region")})
    pincodes = sorted({row.get("pincode", "").strip() for row in merged if row.get("pincode")})

    return {"regions": regions, "pincodes": pincodes}


@app.get("/api/insights")
def get_insights(region: str | None = None, pincode: str | None = None) -> dict[str, Any]:
    air = normalize_air_quality(_get_dataset("air_quality_live").get("records", []))
    rain = normalize_rainfall(_get_dataset("weather_rainfall").get("records", []))
    accidents = normalize_accidents(_get_dataset("road_accidents").get("records", []))

    air = _filter_records_by_location(air, region, pincode)
    rain = _filter_records_by_location(rain, region, pincode)
    accidents = _filter_records_by_location(accidents, region, pincode)

    return compute_civic_insights(air, rain, accidents)


@app.get("/api/export/{dataset_name}.csv")
def export_dataset_csv(dataset_name: str) -> Response:
    payload = _get_dataset(dataset_name)
    records = payload.get("records", [])
    if not records:
        raise HTTPException(status_code=404, detail="No records found for dataset")

    frame = pd.DataFrame(records)
    csv_content = frame.to_csv(index=False)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_name}.csv"},
    )