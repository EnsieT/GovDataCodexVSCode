export type AQICategory = "good" | "moderate" | "unhealthy" | "unknown";

export interface AirQualityRecord {
  station: string;
  city: string;
  pollutant_id: string;
  pollutant_avg: number | null;
  last_update: string;
  aqi_category: AQICategory;
}

export interface RainfallRecord {
  station: string;
  date: string;
  rainfall: number | null;
  temperature: number | null;
}

export interface AccidentRecord {
  state: string;
  district: string;
  road_type: string;
  accidents: number;
  fatalities: number;
}

export interface SchemeRecord {
  scheme_name: string;
  ministry: string;
  sector: string;
  benefits: string;
  eligibility: string;
  beneficiary_type: string;
}

export interface Insights {
  most_polluted_station: {
    station: string;
    pollutant_avg: number;
    pollutant_id: string;
  } | null;
  rainfall_spike_alert: {
    station: string;
    date: string;
    rainfall: number;
    message: string;
  } | null;
  accident_hotspot: {
    district: string;
    accidents: number;
    road_type: string;
  } | null;
}