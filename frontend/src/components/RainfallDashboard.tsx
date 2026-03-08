import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { RainfallRecord } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface RainfallDashboardProps {
  data: RainfallRecord[];
}

export default function RainfallDashboard({ data }: RainfallDashboardProps) {
  const sorted = [...data].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const labels = sorted.map((d) => d.date || "NA");

  return (
    <div className="card">
      <h2>Rainfall and Weather Trends</h2>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Rainfall (mm)",
              data: sorted.map((d) => d.rainfall ?? 0),
              borderColor: "#0ea5e9",
              backgroundColor: "rgba(14, 165, 233, 0.25)",
              yAxisID: "y"
            },
            {
              label: "Temperature (°C)",
              data: sorted.map((d) => d.temperature ?? 0),
              borderColor: "#f97316",
              backgroundColor: "rgba(249, 115, 22, 0.25)",
              yAxisID: "y1"
            }
          ]
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              type: "linear",
              position: "left"
            },
            y1: {
              type: "linear",
              position: "right",
              grid: { drawOnChartArea: false }
            }
          }
        }}
      />
    </div>
  );
}