import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { AccidentRecord } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface AccidentDashboardProps {
  data: AccidentRecord[];
}

const districtCenters: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  MumbaiCity: [18.96, 72.82],
  MumbaiSuburban: [19.15, 72.93],
  Thane: [19.2183, 72.9781],
  NaviMumbai: [19.033, 73.0297],
  Palghar: [19.6967, 72.765]
};

function normalizeDistrictName(name: string): string {
  return name.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "");
}

export default function AccidentDashboard({ data }: AccidentDashboardProps) {
  const topDistricts = [...data].sort((a, b) => b.accidents - a.accidents).slice(0, 10);

  return (
    <div className="card">
      <h2>Road Accident Heatmap</h2>
      <div className="split-grid">
        <div>
          <MapContainer center={[19.076, 72.8777]} zoom={9} style={{ height: "320px", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {topDistricts.map((record, index) => {
              const key = normalizeDistrictName(record.district);
              const foundEntry = Object.entries(districtCenters).find(([district]) =>
                key.toLowerCase().includes(district.toLowerCase())
              );
              const center = foundEntry ? foundEntry[1] : [19.076, 72.8777];

              return (
                <CircleMarker
                  key={`${record.district}-${index}`}
                  center={center as [number, number]}
                  radius={Math.max(5, Math.min(record.accidents / 20, 25))}
                  pathOptions={{ color: "#b91c1c", fillOpacity: 0.55 }}
                >
                  <Popup>
                    <div>
                      <strong>{record.district}</strong>
                      <div>Accidents: {record.accidents}</div>
                      <div>Fatalities: {record.fatalities}</div>
                      <div>Road Type: {record.road_type}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div>
          <Bar
            data={{
              labels: topDistricts.map((d) => d.district),
              datasets: [
                {
                  label: "Accidents",
                  data: topDistricts.map((d) => d.accidents),
                  backgroundColor: "rgba(185, 28, 28, 0.55)"
                },
                {
                  label: "Fatalities",
                  data: topDistricts.map((d) => d.fatalities),
                  backgroundColor: "rgba(30, 64, 175, 0.55)"
                }
              ]
            }}
            options={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
}