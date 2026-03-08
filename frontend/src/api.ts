import type {
  AccidentRecord,
  AirQualityRecord,
  Insights,
  LocationOptions,
  RainfallRecord,
  SchemeRecord
} from "./types";

interface LocationFilterQuery {
  region?: string;
  pincode?: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function matchesLocation<T extends object>(item: T, query?: LocationFilterQuery): boolean {
  if (!query?.region && !query?.pincode) {
    return true;
  }

  const text = Object.values(item).join(" ").toLowerCase();
  const region = query?.region?.trim().toLowerCase();
  const pincodeDigits = digitsOnly(query?.pincode || "");
  const textDigits = digitsOnly(text);

  const regionOk = !region || text.includes(region);
  const pincodeOk = !pincodeDigits || textDigits.includes(pincodeDigits);
  return regionOk && pincodeOk;
}

function appendLocationParams(params: URLSearchParams, query?: LocationFilterQuery) {
  if (query?.region) {
    params.set("region", query.region);
  }
  if (query?.pincode) {
    params.set("pincode", query.pincode);
  }
}

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

export async function getLiveAirQuality(query?: LocationFilterQuery): Promise<AirQualityRecord[]> {
  const params = new URLSearchParams();
  appendLocationParams(params, query);
  const suffix = params.toString() ? `?${params.toString()}` : "";

  const payload = await requestWithFallback<{ records: AirQualityRecord[] }>(
    `/api/air-quality/live${suffix}`,
    withBase("demo/air_quality_live.json")
  );

  return payload.records.filter((item) => matchesLocation(item, query));
}

export async function getHistoricalAirQuality(query?: LocationFilterQuery): Promise<AirQualityRecord[]> {
  const params = new URLSearchParams();
  appendLocationParams(params, query);
  const suffix = params.toString() ? `?${params.toString()}` : "";

  const payload = await requestWithFallback<{ records: AirQualityRecord[] }>(
    `/api/air-quality/historical${suffix}`,
    withBase("demo/air_quality_historical.json")
  );

  return payload.records.filter((item) => matchesLocation(item, query));
}

export async function getRainfallData(query?: LocationFilterQuery): Promise<RainfallRecord[]> {
  const params = new URLSearchParams();
  appendLocationParams(params, query);
  const suffix = params.toString() ? `?${params.toString()}` : "";

  const payload = await requestWithFallback<{ records: RainfallRecord[] }>(
    `/api/weather/rainfall${suffix}`,
    withBase("demo/rainfall.json")
  );

  return payload.records.filter((item) => matchesLocation(item, query));
}

export async function getAccidentData(query?: LocationFilterQuery): Promise<AccidentRecord[]> {
  const params = new URLSearchParams();
  appendLocationParams(params, query);
  const suffix = params.toString() ? `?${params.toString()}` : "";

  const payload = await requestWithFallback<{ records: AccidentRecord[] }>(
    `/api/accidents${suffix}`,
    withBase("demo/accidents.json")
  );

  return payload.records.filter((item) => matchesLocation(item, query));
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

export async function getInsights(query?: LocationFilterQuery): Promise<Insights> {
  const params = new URLSearchParams();
  appendLocationParams(params, query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestWithFallback<Insights>(`/api/insights${suffix}`, withBase("demo/insights.json"));
}

export async function getLocationOptions(): Promise<LocationOptions> {
  return requestWithFallback<LocationOptions>(
    "/api/location-options",
    withBase("demo/location_options.json")
  );
}