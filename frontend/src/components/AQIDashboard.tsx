import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import type { AirQualityRecord } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface AQIDashboardProps {
  liveData: AirQualityRecord[];
  historicalData: AirQualityRecord[];
}

export default function AQIDashboard({ liveData, historicalData }: AQIDashboardProps) {
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, AirQualityRecord[]>();
    for (const row of historicalData) {
      const dateKey = (row.last_update || "").split(" ")[0] || "Unknown";
      const current = groups.get(dateKey) || [];
      current.push(row);
      groups.set(dateKey, current);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [historicalData]);

  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, groupedByDate.length - 1));

  const selectedDateData = groupedByDate[selectedIndex]?.[1] || [];

  const chartData = {
    labels: (selectedDateData.length ? selectedDateData : liveData).map((d) => d.station),
    datasets: [
      {
        label: "AQI Pollutant Average",
        data: (selectedDateData.length ? selectedDateData : liveData).map((d) => d.pollutant_avg ?? 0),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.25)",
        tension: 0.25
      }
    ]
  };

  return (
    <div className="card">
      <h2>AQI Dashboard</h2>
      {groupedByDate.length > 0 && (
        <div className="slider-wrap">
          <label htmlFor="aqi-slider">
            Historical Date: <strong>{groupedByDate[selectedIndex]?.[0]}</strong>
          </label>
          <input
            id="aqi-slider"
            type="range"
            min={0}
            max={groupedByDate.length - 1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          />
        </div>
      )}
      <Line data={chartData} />
    </div>
  );
}