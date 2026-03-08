import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import type { AirQualityRecord, RainfallRecord } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface RegionComparisonDashboardProps {
  regions: string[];
  historicalAirQuality: AirQualityRecord[];
  rainfallData: RainfallRecord[];
}

const palette = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#0ea5e9"];

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeRegion(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export default function RegionComparisonDashboard({
  regions,
  historicalAirQuality,
  rainfallData
}: RegionComparisonDashboardProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(regions.slice(0, 2));
  const [pincodeFilter, setPincodeFilter] = useState("");

  const aqiDateLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const row of historicalAirQuality) {
      const key = (row.last_update || "").split(" ")[0];
      if (key) {
        labels.add(key);
      }
    }
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [historicalAirQuality]);

  const rainfallDateLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const row of rainfallData) {
      if (row.date) {
        labels.add(row.date);
      }
    }
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [rainfallData]);

  const selectedNormalizedRegions = selectedRegions.map((region) => normalizeRegion(region));

  const aqiChartData = {
    labels: aqiDateLabels,
    datasets: selectedRegions.map((region, index) => {
      const normalizedRegion = normalizeRegion(region);
      const data = aqiDateLabels.map((dateLabel) => {
        const matching = historicalAirQuality.filter((row) => {
          const rowDate = (row.last_update || "").split(" ")[0];
          const rowRegion = normalizeRegion(row.region || row.city || row.station);
          const pincodeMatch =
            !pincodeFilter.trim() || (row.pincode || "").toLowerCase().includes(pincodeFilter.trim().toLowerCase());
          return rowDate === dateLabel && rowRegion.includes(normalizedRegion) && pincodeMatch;
        });
        const numeric = matching
          .map((item) => item.pollutant_avg)
          .filter((value): value is number => typeof value === "number");
        return Number(average(numeric).toFixed(2));
      });

      const color = palette[index % palette.length];
      return {
        label: `${region} AQI Avg`,
        data,
        borderColor: color,
        backgroundColor: `${color}55`,
        tension: 0.25
      };
    })
  };

  const rainfallChartData = {
    labels: rainfallDateLabels,
    datasets: selectedRegions.map((region, index) => {
      const normalizedRegion = normalizeRegion(region);
      const data = rainfallDateLabels.map((dateLabel) => {
        const matching = rainfallData.filter((row) => {
          const rowRegion = normalizeRegion(row.region || row.station);
          const pincodeMatch =
            !pincodeFilter.trim() || (row.pincode || "").toLowerCase().includes(pincodeFilter.trim().toLowerCase());
          return row.date === dateLabel && rowRegion.includes(normalizedRegion) && pincodeMatch;
        });
        const numeric = matching
          .map((item) => item.rainfall)
          .filter((value): value is number => typeof value === "number");
        return Number(average(numeric).toFixed(2));
      });

      const color = palette[index % palette.length];
      return {
        label: `${region} Rainfall Avg (mm)`,
        data,
        borderColor: color,
        backgroundColor: `${color}55`,
        tension: 0.25
      };
    })
  };

  return (
    <section className="card">
      <h2>District / Region Comparison Trends</h2>
      <div className="filters comparison-controls">
        <select
          multiple
          value={selectedRegions}
          onChange={(event) => {
            const options = Array.from(event.target.selectedOptions).map((option) => option.value);
            setSelectedRegions(options.slice(0, 5));
          }}
        >
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Optional pincode refine"
          value={pincodeFilter}
          onChange={(event) => setPincodeFilter(event.target.value)}
        />
      </div>

      {selectedNormalizedRegions.length === 0 ? (
        <p className="subtle">Select one or more regions to compare trends.</p>
      ) : (
        <div className="split-grid">
          <div>
            <h3>AQI Historical Comparison</h3>
            <Line data={aqiChartData} />
          </div>
          <div>
            <h3>Rainfall Historical Comparison</h3>
            <Line data={rainfallChartData} />
          </div>
        </div>
      )}
    </section>
  );
}