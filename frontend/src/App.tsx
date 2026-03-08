import { useEffect, useMemo, useState } from "react";
import {
  getAccidentData,
  getHistoricalAirQuality,
  getInsights,
  getLiveAirQuality,
  getLocationOptions,
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
  LocationOptions,
  RainfallRecord,
  SchemeRecord
} from "./types";

interface LocationFilter {
  region?: string;
  pincode?: string;
}

export default function App() {
  const [liveAqi, setLiveAqi] = useState<AirQualityRecord[]>([]);
  const [historicalAqi, setHistoricalAqi] = useState<AirQualityRecord[]>([]);
  const [rainfall, setRainfall] = useState<RainfallRecord[]>([]);
  const [accidents, setAccidents] = useState<AccidentRecord[]>([]);
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOptions>({ regions: [], pincodes: [] });
  const [regionInput, setRegionInput] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<LocationFilter>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(filter?: LocationFilter) {
    setLoading(true);
    setError(null);
    try {
      const [aqiLiveResp, aqiHistResp, rainfallResp, accidentResp, schemesResp, insightsResp] =
        await Promise.all([
          getLiveAirQuality(filter),
          getHistoricalAirQuality(filter),
          getRainfallData(filter),
          getAccidentData(filter),
          getSchemeData(),
          getInsights(filter)
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
    loadData(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    getLocationOptions()
      .then((response) => setLocationOptions(response))
      .catch(() => setLocationOptions({ regions: [], pincodes: [] }));
  }, []);

  function applyLocationFilter() {
    setActiveFilter({
      region: regionInput.trim() || undefined,
      pincode: pincodeInput.trim() || undefined
    });
  }

  function clearLocationFilter() {
    setRegionInput("");
    setPincodeInput("");
    setActiveFilter({});
  }

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

      <section className="card">
        <h2>Regional / Pincode Stats</h2>
        <div className="filters">
          <input
            type="text"
            list="region-options"
            placeholder="Enter region / locality / district"
            value={regionInput}
            onChange={(e) => setRegionInput(e.target.value)}
          />
          <datalist id="region-options">
            {locationOptions.regions.map((region) => (
              <option key={region} value={region} />
            ))}
          </datalist>

          <input
            type="text"
            list="pincode-options"
            placeholder="Enter pincode (if available)"
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value)}
          />
          <datalist id="pincode-options">
            {locationOptions.pincodes.map((pincode) => (
              <option key={pincode} value={pincode} />
            ))}
          </datalist>

          <button onClick={applyLocationFilter}>Apply Location Filter</button>
          <button className="secondary" onClick={clearLocationFilter}>
            Clear
          </button>
        </div>
        <p className="subtle">
          Active filter: <strong>{activeFilter.region || "All regions"}</strong>, pincode{" "}
          <strong>{activeFilter.pincode || "Any"}</strong>. Historical views are filtered where dataset
          location fields are available.
        </p>
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