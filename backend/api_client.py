from __future__ import annotations

import os
from typing import Any

import requests


DATA_GOV_BASE_URL = "https://api.data.gov.in/resource"


class DataGovClient:
    def __init__(self, api_key: str | None = None, timeout: int = 30) -> None:
        self.api_key = api_key or os.getenv("DATA_GOV_API_KEY", "")
        self.timeout = timeout

    def fetch_resource(
        self,
        resource_id: str,
        filters: dict[str, Any] | None = None,
        limit: int = 1000,
        offset: int = 0,
        sort: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "offset": offset,
        }

        if sort:
            params["sort"] = sort

        if filters:
            for key, value in filters.items():
                params[f"filters[{key}]"] = value

        response = requests.get(
            f"{DATA_GOV_BASE_URL}/{resource_id}",
            params=params,
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError("Unexpected API response shape.")

        payload.setdefault("records", [])
        return payload