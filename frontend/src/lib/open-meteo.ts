import { addDaysToYmd, selectOverlappingHours, summarizeRisk } from "@/lib/tee-window";

type OpenMeteoHourly = {
  time: string[];
  precipitation_probability?: Array<number | null>;
  precipitation?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
};

type OpenMeteoResponse = {
  hourly?: OpenMeteoHourly;
};

export async function fetchForecastWindow(params: {
  latitude: number;
  longitude: number;
  date: string;
  teeTime: string;
}) {
  const { latitude, longitude, date, teeTime } = params;
  const endDate = addDaysToYmd(date, 1);

  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: "precipitation_probability,precipitation,wind_speed_10m",
    timezone: "Asia/Tokyo",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    start_date: date,
    end_date: endDate,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${searchParams.toString()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`weather_api_error:${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;

  if (!payload.hourly?.time?.length) {
    return {
      hours: [],
      summary: summarizeRisk([]),
    };
  }

  const entries = payload.hourly.time.map((time, index) => ({
    time,
    precipitationProbability: payload.hourly?.precipitation_probability?.[index] ?? null,
    precipitationMm: payload.hourly?.precipitation?.[index] ?? null,
    windSpeedKmh: payload.hourly?.wind_speed_10m?.[index] ?? null,
  }));

  const hours = selectOverlappingHours(entries, date, teeTime);

  return {
    hours,
    summary: summarizeRisk(hours),
  };
}
