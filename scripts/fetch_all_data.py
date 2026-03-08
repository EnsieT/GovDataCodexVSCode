from __future__ import annotations

from pathlib import Path

from backend.data_fetcher import fetch_all_and_cache


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    cache_dir = root_dir / "data" / "cached_json"
    payload = fetch_all_and_cache(cache_dir=cache_dir, limit=2000)
    datasets = ", ".join(payload.keys())
    print(f"Fetched and cached datasets: {datasets}")


if __name__ == "__main__":
    main()