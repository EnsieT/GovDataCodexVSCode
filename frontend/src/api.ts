import type {
  AccidentRecord,
  AirQualityRecord,
  Insights,
  RainfallRecord,
  SchemeRecord
} from "./types";

const baseUrl = import.meta.env.BASE_URL || "/";

function withBase(path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function requestWithFallback<T>(apiPath: string, fallbackPath: string): Promise<T> {
  try {
    return await request<T>(apiPath);
  } catch {
    return request<T>(fallbackPath);
  }
}

export async function getLiveAirQuality(): Promise<AirQualityRecord[]> {
  const payload = await requestWithFallback<{ records: AirQualityRecord[] }>(
    "/api/air-quality/live",
    withBase("demo/air_quality_live.json")
  );
  return payload.records;
}

export async function getHistoricalAirQuality(): Promise<AirQualityRecord[]> {
  const payload = await requestWithFallback<{ records: AirQualityRecord[] }>(
    "/api/air-quality/historical",
    withBase("demo/air_quality_historical.json")
  );
  return payload.records;
}

export async function getRainfallData(): Promise<RainfallRecord[]> {
  const payload = await requestWithFallback<{ records: RainfallRecord[] }>(
    "/api/weather/rainfall",
    withBase("demo/rainfall.json")
  );
  return payload.records;
}

export async function getAccidentData(): Promise<AccidentRecord[]> {
  const payload = await requestWithFallback<{ records: AccidentRecord[] }>(
    "/api/accidents",
    withBase("demo/accidents.json")
  );
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
  const payload = await requestWithFallback<{ records: SchemeRecord[] }>(
    `/api/schemes${suffix}`,
    withBase("demo/schemes.json")
  );

  if (!query?.sector && !query?.beneficiary_type && !query?.ministry) {
    return payload.records;
  }

  const sector = query?.sector?.toLowerCase();
  const beneficiaryType = query?.beneficiary_type?.toLowerCase();
  const ministry = query?.ministry?.toLowerCase();

  return payload.records.filter((item) => {
    const sectorOk = !sector || item.sector.toLowerCase().includes(sector);
    const beneficiaryOk =
      !beneficiaryType ||
      item.beneficiary_type.toLowerCase().includes(beneficiaryType) ||
      item.eligibility.toLowerCase().includes(beneficiaryType);
    const ministryOk = !ministry || item.ministry.toLowerCase().includes(ministry);
    return sectorOk && beneficiaryOk && ministryOk;
  });
}

export async function getInsights(): Promise<Insights> {
  return requestWithFallback<Insights>("/api/insights", withBase("demo/insights.json"));
}