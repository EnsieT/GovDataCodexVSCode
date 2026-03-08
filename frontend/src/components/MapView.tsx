import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { AirQualityRecord } from "../types";

interface MapViewProps {
  data: AirQualityRecord[];
}

const mumbaiCenter: [number, number] = [19.076, 72.8777];

const stationCoordinates: Record<string, [number, number]> = {
  Bandra: [19.0607, 72.8406],
  Sion: [19.0469, 72.8628],
  Colaba: [18.9067, 72.8147],
  Worli: [19.0176, 72.8166],
  Kurla: [19.0728, 72.8826],
  Chembur: [19.0522, 72.9005],
  Borivali: [19.2307, 72.8567],
  Andheri: [19.1136, 72.8697],
  Powai: [19.1176, 72.906],
  NaviMumbai: [19.033, 73.0297]
};

function getColor(category: AirQualityRecord["aqi_category"]): string {
  if (category === "good") {
    return "#16a34a";
  }
  if (category === "moderate") {
    return "#ca8a04";
  }
  if (category === "unhealthy") {
    return "#dc2626";
  }
  return "#6b7280";
}

function getCoordinate(stationName: string): [number, number] {
  const found = Object.entries(stationCoordinates).find(([key]) =>
    stationName.toLowerCase().includes(key.toLowerCase())
  );
  return found ? found[1] : mumbaiCenter;
}

export default function MapView({ data }: MapViewProps) {
  return (
    <div className="card map-card">
      <h2>Interactive Mumbai Air Quality Map</h2>
      <MapContainer center={mumbaiCenter} zoom={11} scrollWheelZoom style={{ height: "420px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((record, index) => {
          const position = getCoordinate(record.station);
          return (
            <CircleMarker
              key={`${record.station}-${index}`}
              center={position}
              radius={9}
              pathOptions={{ color: getColor(record.aqi_category), fillOpacity: 0.75 }}
            >
              <Popup>
                <div>
                  <strong>{record.station}</strong>
                  <div>Pollutant: {record.pollutant_id}</div>
                  <div>Average: {record.pollutant_avg ?? "NA"}</div>
                  <div>Category: {record.aqi_category}</div>
                  <div>Updated: {record.last_update || "NA"}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="legend">
        <span><i className="dot good" /> Good</span>
        <span><i className="dot moderate" /> Moderate</span>
        <span><i className="dot unhealthy" /> Unhealthy</span>
      </div>
    </div>
  );
}