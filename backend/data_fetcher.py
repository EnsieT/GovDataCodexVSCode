from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .api_client import DataGovClient


RESOURCE_MAP: dict[str, str] = {
    "air_quality_live": "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
    "air_quality_historical": "3810d8b5-0c7b-4f88-bec9-d02e6f8d7f6c",
    "weather_rainfall": "2a4c1c6d-0d6b-4b7e-9f6e-9a6b5f4a8b91",
    "road_accidents": "1f1f6e26-5c3b-4d9b-9a3a-71f2c8f9d5e5",
    "government_schemes": "4e9e6c72-5c21-4c1e-b3e0-9e1c1b3d3c6d",
    "school_infrastructure": "7d4c6e63-0b2e-4e5b-a3f1-8e7b6c2c1a44",
    "health_infrastructure": "6f9c8c1d-5e6a-4e5d-b6a8-3e1c5f9a0b3e",
    "census_data": "0f6a7e1c-3c7a-4c8e-9a1f-d1c6b8a1e7d2",
    "rbi_indicators": "9ef84268-d588-465a-a308-a864a43d0070",
}


DEFAULT_FILTERS: dict[str, dict[str, Any]] = {
    "air_quality_live": {"city": "Mumbai"},
    "air_quality_historical": {"city": "Mumbai"},
    "weather_rainfall": {"state": "Maharashtra"},
    "road_accidents": {"state": "Maharashtra"},
}


def _cache_file_path(cache_dir: Path, dataset_name: str) -> Path:
    return cache_dir / f"{dataset_name}.json"


def fetch_dataset(
    client: DataGovClient,
    dataset_name: str,
    limit: int = 1000,
) -> dict[str, Any]:
    if dataset_name not in RESOURCE_MAP:
        raise KeyError(f"Unknown dataset: {dataset_name}")

    resource_id = RESOURCE_MAP[dataset_name]
    filters = DEFAULT_FILTERS.get(dataset_name)
    payload = client.fetch_resource(resource_id=resource_id, filters=filters, limit=limit)
    payload["resource_id"] = resource_id
    payload["dataset_name"] = dataset_name
    payload["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return payload


def fetch_all_and_cache(cache_dir: str | Path, limit: int = 1000) -> dict[str, dict[str, Any]]:
    cache_path = Path(cache_dir)
    cache_path.mkdir(parents=True, exist_ok=True)

    client = DataGovClient()
    all_data: dict[str, dict[str, Any]] = {}

    for dataset_name in RESOURCE_MAP:
        try:
            payload = fetch_dataset(client=client, dataset_name=dataset_name, limit=limit)
            cache_file = _cache_file_path(cache_path, dataset_name)
            cache_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            all_data[dataset_name] = payload
        except Exception as exc:
            all_data[dataset_name] = {
                "dataset_name": dataset_name,
                "error": str(exc),
                "records": [],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }

    return all_data


def read_cached_dataset(cache_dir: str | Path, dataset_name: str) -> dict[str, Any]:
    file_path = _cache_file_path(Path(cache_dir), dataset_name)
    if not file_path.exists():
        return {"dataset_name": dataset_name, "records": [], "error": "cache_miss"}

    return json.loads(file_path.read_text(encoding="utf-8"))