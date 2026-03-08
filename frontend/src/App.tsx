import { useEffect, useMemo, useState } from "react";
import {
  getAccidentData,
  getHistoricalAirQuality,
  getInsights,
  getLiveAirQuality,
  getRainfallData,
  getSchemeData
} from "./api";
import AccidentDashboard from "./components/AccidentDashboard";
import AQIDashboard from "./components/AQIDashboard";
import MapView from "./components/MapView";
import RainfallDashboard from "./components/RainfallDashboard";
import SchemeFinder from "./components/SchemeFinder";
import type {
  AccidentRecord,
  AirQualityRecord,
  Insights,
  RainfallRecord,
  SchemeRecord
} from "./types";

export default function App() {
  const [liveAqi, setLiveAqi] = useState<AirQualityRecord[]>([]);
  const [historicalAqi, setHistoricalAqi] = useState<AirQualityRecord[]>([]);
  const [rainfall, setRainfall] = useState<RainfallRecord[]>([]);
  const [accidents, setAccidents] = useState<AccidentRecord[]>([]);
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [aqiLiveResp, aqiHistResp, rainfallResp, accidentResp, schemesResp, insightsResp] =
        await Promise.all([
          getLiveAirQuality(),
          getHistoricalAirQuality(),
          getRainfallData(),
          getAccidentData(),
          getSchemeData(),
          getInsights()
        ]);

      setLiveAqi(aqiLiveResp);
      setHistoricalAqi(aqiHistResp);
      setRainfall(rainfallResp);
      setAccidents(accidentResp);
      setSchemes(schemesResp);
      setInsights(insightsResp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while loading data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSchemeFilter(query: {
    sector?: string;
    beneficiary_type?: string;
    ministry?: string;
  }) {
    const filtered = await getSchemeData(query);
    setSchemes(filtered);
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(
    () => ({
      stations: liveAqi.length,
      rainfallRecords: rainfall.length,
      accidentRows: accidents.length,
      schemes: schemes.length
    }),
    [liveAqi, rainfall, accidents, schemes]
  );

  if (loading) {
    return <div className="app-shell">Loading Mumbai civic datasets...</div>;
  }

  if (error) {
    return (
      <div className="app-shell">
        <h1>Mumbai Civic Intelligence Dashboard</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Mumbai Civic Intelligence Dashboard</h1>
        <p>
          Official datasets from CPCB, IMD, data.gov.in sectors, Census, and RBI indicators for civic
          insights.
        </p>
      </header>

      <section className="summary-grid">
        <div className="summary-item">
          <h3>{summary.stations}</h3>
          <p>Air quality stations</p>
        </div>
        <div className="summary-item">
          <h3>{summary.rainfallRecords}</h3>
          <p>Rainfall records</p>
        </div>
        <div className="summary-item">
          <h3>{summary.accidentRows}</h3>
          <p>Accident rows</p>
        </div>
        <div className="summary-item">
          <h3>{summary.schemes}</h3>
          <p>Schemes discovered</p>
        </div>
      </section>

      <MapView data={liveAqi} />
      <AQIDashboard liveData={liveAqi} historicalData={historicalAqi} />
      <RainfallDashboard data={rainfall} />
      <AccidentDashboard data={accidents} />
      <SchemeFinder data={schemes} onFilter={handleSchemeFilter} />

      <section className="card insights-card">
        <h2>Civic Insights Panel</h2>
        <ul>
          <li>
            Most polluted station today:{" "}
            <strong>{insights?.most_polluted_station?.station ?? "NA"}</strong>
          </li>
          <li>
            Rainfall spike alert:{" "}
            <strong>{insights?.rainfall_spike_alert?.message ?? "No major spike detected"}</strong>
          </li>
          <li>
            Accident hotspot district: <strong>{insights?.accident_hotspot?.district ?? "NA"}</strong>
          </li>
        </ul>
      </section>
    </div>
  );
}