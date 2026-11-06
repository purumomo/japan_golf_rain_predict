export type WeatherKind = "clear" | "mostlyClear" | "partlyCloudy" | "overcast" | "fog" | "drizzle" | "rain" | "snow" | "mixed" | "storm" | "unknown";

export type WeatherAppearanceData = {
  weatherCode: number | null;
  cloudCoverPct: number | null;
  isDay: boolean | null;
  rainMm: number | null;
  snowfallCm: number | null;
};

export function getWeatherAppearance(weather: WeatherAppearanceData) {
  const code = weather.weatherCode;
  const rainCode = code != null && [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
  const snowCode = code != null && [71, 73, 75, 77, 85, 86].includes(code);
  const rain = (weather.rainMm ?? 0) > 0 || rainCode;
  const snow = (weather.snowfallCm ?? 0) > 0 || snowCode;
  const storm = code != null && [95, 96, 99].includes(code);
  let kind: WeatherKind = "unknown";
  if (rain && snow) kind = "mixed";
  else if (storm) kind = "storm";
  else if (snow) kind = "snow";
  else if (rain) kind = code != null && [51, 53, 55, 56, 57].includes(code) ? "drizzle" : "rain";
  else if (code === 0) kind = "clear";
  else if (code === 1) kind = "mostlyClear";
  else if (code === 2) kind = "partlyCloudy";
  else if (code === 3) kind = "overcast";
  else if (code === 45 || code === 48) kind = "fog";

  const fair = ["clear", "mostlyClear", "partlyCloudy"].includes(kind);
  const cloudCount = kind === "clear" ? 0 : kind === "mostlyClear" ? 1 : kind === "partlyCloudy" ? 2
    : kind === "unknown" ? Math.round((weather.cloudCoverPct ?? 0) / 25) : 4;
  return { kind, rain, snow, storm, cloudCount, sun: fair && weather.isDay === true, moon: fair && weather.isDay === false };
}
