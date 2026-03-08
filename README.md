# Mumbai Civic Intelligence Dashboard

Open-source civic data project that aggregates official Indian government datasets and visualizes Mumbai-focused insights using an interactive map and dashboards.

## What this project does

- Visualizes real-time and historical air quality for Mumbai
- Tracks rainfall and weather trends
- Shows road accident intensity by district
- Lets users discover government schemes by filters
- Computes civic insights automatically:
  - most polluted station today
  - rainfall spike alerts
  - accident hotspot district

All data sources are official `data.gov.in` APIs.

## Tech stack

- Backend: Python, FastAPI, Pandas, Requests
- Frontend: React + TypeScript + Vite, Leaflet, Chart.js
- Pipeline: Python fetch scripts that cache JSON locally

## Project structure

```text
mumbai-civic-dashboard/
├── backend/
│   ├── api_client.py
│   ├── data_fetcher.py
│   ├── data_cleaning.py
│   └── main.py
├── frontend/
│   ├── components/
│   │   ├── MapView.tsx
│   │   ├── AQIDashboard.tsx
│   │   ├── RainfallDashboard.tsx
│   │   ├── AccidentDashboard.tsx
│   │   └── SchemeFinder.tsx
│   ├── src/
│   └── package.json
├── data/
│   └── cached_json/
├── scripts/
│   └── fetch_all_data.py
├── docs/
│   └── screenshots/
├── requirements.txt
├── .env.example
└── README.md
```

## Official data sources used

1. Air Quality (CPCB): `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`
2. Historical Air Quality: `3810d8b5-0c7b-4f88-bec9-d02e6f8d7f6c`
3. Rainfall / Weather (IMD): `2a4c1c6d-0d6b-4b7e-9f6e-9a6b5f4a8b91`
4. Road Accidents: `1f1f6e26-5c3b-4d9b-9a3a-71f2c8f9d5e5`
5. Government Schemes: `4e9e6c72-5c21-4c1e-b3e0-9e1c1b3d3c6d`
6. School Infrastructure (UDISE): `7d4c6e63-0b2e-4e5b-a3f1-8e7b6c2c1a44`
7. Health Infrastructure: `6f9c8c1d-5e6a-4e5d-b6a8-3e1c5f9a0b3e`
8. Census Data: `0f6a7e1c-3c7a-4c8e-9a1f-d1c6b8a1e7d2`
9. RBI Economic Indicators: `9ef84268-d588-465a-a308-a864a43d0070`

## Setup and run (Windows PowerShell)

From project root:

```powershell
cd mumbai-civic-dashboard
```

### 1) Configure environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your `DATA_GOV_API_KEY`.

### 2) Backend setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/fetch_all_data.py
uvicorn backend.main:app --reload --port 8000
```

Backend available at:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

### 3) Frontend setup (new terminal)

```powershell
cd frontend
npm install
npm run dev
```

Frontend available at:

- `http://localhost:5173`

## Key API endpoints (backend)

- `GET /api/air-quality/live`
- `GET /api/air-quality/historical`
- `GET /api/weather/rainfall`
- `GET /api/accidents`
- `GET /api/location-options`
- `GET /api/schemes?sector=&beneficiary_type=&ministry=`
- `GET /api/infrastructure`
- `GET /api/insights`
- `GET /api/export/{dataset_name}.csv`
- `POST /api/refresh`

Location-aware query support is available for:

- `/api/air-quality/live?region=&pincode=`
- `/api/air-quality/historical?region=&pincode=`
- `/api/weather/rainfall?region=&pincode=`
- `/api/accidents?region=&pincode=`
- `/api/insights?region=&pincode=`

## Features implemented

- Interactive Mumbai map with color-coded AQI station markers:
  - Green = good
  - Yellow = moderate
  - Red = unhealthy
- Rainfall and temperature trend visualization
- Accident intensity map + district comparison chart
- Scheme discovery filters by sector, beneficiary type, ministry
- Civic insights panel with automatic top findings
- Historical AQI time slider
- Regional and pincode filter panel for current and historical stats
- CSV export endpoint
- Daily automated refresh workflow (`.github/workflows/daily-data-refresh.yml`)

## Deployment

### Option A: Frontend on GitHub Pages, backend on Render/Railway

1. Deploy FastAPI backend to Render/Railway.
2. Set frontend `VITE_API_BASE_URL` to deployed backend URL.
3. Build frontend:
   ```powershell
   cd frontend
   npm run build
   ```
4. Publish `frontend/dist` on GitHub Pages.

This repository includes an automated Pages workflow. Once pushed to `main`, the live frontend URL is:

- `https://ensiet.github.io/GovDataCodexVSCode/`

If backend endpoints are unavailable publicly, the app automatically falls back to bundled demo snapshots so the UI remains fully viewable.

### Option B: Single cloud VM/container

- Run FastAPI + static frontend build behind Nginx/Caddy.

## Example screenshots (expected output)

- Dashboard overview: `docs/screenshots/dashboard-overview.svg`
- AQI map view: `docs/screenshots/aqi-map.svg`
- Rainfall + accidents: `docs/screenshots/rainfall-accidents.svg`

## Notes

- Some API records vary in field naming/availability over time; cleaning logic handles missing values.
- Cache files are written to `data/cached_json`.
- The project intentionally keeps setup minimal while remaining production-oriented.