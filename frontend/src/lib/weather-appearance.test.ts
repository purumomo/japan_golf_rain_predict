import { describe, expect, it } from "vitest";

import { getWeatherAppearance, type WeatherAppearanceData } from "./weather-appearance";

const base: WeatherAppearanceData = { weatherCode: 0, cloudCoverPct: 0, isDay: true, rainMm: 0, snowfallCm: 0 };

describe("forecast weather illustrations", () => {
  it("shows sun for a clear day and moon for a clear night", () => {
    expect(getWeatherAppearance(base)).toMatchObject({ kind: "clear", sun: true, moon: false, cloudCount: 0 });
    expect(getWeatherAppearance({ ...base, isDay: false })).toMatchObject({ sun: false, moon: true });
    expect(getWeatherAppearance({ ...base, isDay: null })).toMatchObject({ sun: false, moon: false });
  });

  it("distinguishes partly cloudy from overcast", () => {
    expect(getWeatherAppearance({ ...base, weatherCode: 2 })).toMatchObject({ kind: "partlyCloudy", cloudCount: 2, sun: true });
    expect(getWeatherAppearance({ ...base, weatherCode: 3 })).toMatchObject({ kind: "overcast", cloudCount: 4, sun: false });
  });

  it("can illustrate a rain weather code even with a rounded zero hourly amount", () => {
    expect(getWeatherAppearance({ ...base, weatherCode: 61 })).toMatchObject({ kind: "rain", rain: true, sun: false });
  });

  it("keeps snowfall, mixed precipitation, fog and storms distinct", () => {
    expect(getWeatherAppearance({ ...base, weatherCode: 71 })).toMatchObject({ kind: "snow", rain: false, snow: true });
    expect(getWeatherAppearance({ ...base, rainMm: 1, snowfallCm: 0.5 })).toMatchObject({ kind: "mixed", rain: true, snow: true });
    expect(getWeatherAppearance({ ...base, weatherCode: 45 })).toMatchObject({ kind: "fog", sun: false });
    expect(getWeatherAppearance({ ...base, weatherCode: 95 })).toMatchObject({ kind: "storm", storm: true, rain: true });
  });

  it("does not assume clear skies or rain when forecast data is missing", () => {
    expect(getWeatherAppearance({ weatherCode: null, cloudCoverPct: null, isDay: null, rainMm: null, snowfallCm: null }))
      .toMatchObject({ kind: "unknown", sun: false, moon: false, rain: false, snow: false, cloudCount: 0 });
    expect(getWeatherAppearance({ ...base, weatherCode: null, cloudCoverPct: 100 })).toMatchObject({ kind: "unknown", cloudCount: 4, sun: false });
  });
});
