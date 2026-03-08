import type {
  AccidentRecord,
  AirQualityRecord,
  Insights,
  RainfallRecord,
  SchemeRecord
} from "./types";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getLiveAirQuality(): Promise<AirQualityRecord[]> {
  const payload = await request<{ records: AirQualityRecord[] }>("/api/air-quality/live");
  return payload.records;
}

export async function getHistoricalAirQuality(): Promise<AirQualityRecord[]> {
  const payload = await request<{ records: AirQualityRecord[] }>("/api/air-quality/historical");
  return payload.records;
}

export async function getRainfallData(): Promise<RainfallRecord[]> {
  const payload = await request<{ records: RainfallRecord[] }>("/api/weather/rainfall");
  return payload.records;
}

export async function getAccidentData(): Promise<AccidentRecord[]> {
  const payload = await request<{ records: AccidentRecord[] }>("/api/accidents");
  return payload.records;
}

export async function getSchemeData(query?: {
  sector?: string;
  beneficiary_type?: string;
  ministry?: string;
}): Promise<SchemeRecord[]> {
  const params = new URLSearchParams();
  if (query?.sector) {
    params.set("sector", query.sector);
  }
  if (query?.beneficiary_type) {
    params.set("beneficiary_type", query.beneficiary_type);
  }
  if (query?.ministry) {
    params.set("ministry", query.ministry);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const payload = await request<{ records: SchemeRecord[] }>(`/api/schemes${suffix}`);
  return payload.records;
}

export async function getInsights(): Promise<Insights> {
  return request<Insights>("/api/insights");
}