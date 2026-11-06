import { describe, expect, it } from "vitest";

import { buildRoundWindow, getForecastDateBounds, selectOverlappingHours } from "./tee-window";

describe("tee-time window utilities", () => {
  it("returns the supported future date bounds in JST", () => {
    const reference = new Date("2026-11-06T00:30:00+09:00");

    expect(getForecastDateBounds(reference)).toEqual({
      minDate: "2026-11-07",
      maxDate: "2026-11-12",
    });
  });

  it("builds a five-hour round window for JST tee times", () => {
    expect(buildRoundWindow("2026-11-09", "08:30")).toMatchObject({
      startLabel: "2026-11-09T08:30",
      endLabel: "2026-11-09T13:30",
      roundHours: 5,
      teeTime: "08:30",
    });
  });

  it("captures the first and last partial hours for half-hour tee times", () => {
    const hours = selectOverlappingHours(
      [
        { time: "2026-11-09T09:00", precipitationProbability: 15, precipitationMm: 0, windSpeedKmh: 10 },
        { time: "2026-11-09T10:00", precipitationProbability: 20, precipitationMm: 0, windSpeedKmh: 11 },
        { time: "2026-11-09T11:00", precipitationProbability: 35, precipitationMm: 0.2, windSpeedKmh: 12 },
        { time: "2026-11-09T12:00", precipitationProbability: 55, precipitationMm: 1.2, windSpeedKmh: 14 },
        { time: "2026-11-09T13:00", precipitationProbability: 30, precipitationMm: 0.4, windSpeedKmh: 13 },
        { time: "2026-11-09T14:00", precipitationProbability: 25, precipitationMm: 0, windSpeedKmh: 9 },
      ],
      "2026-11-09",
      "08:30",
    );

    expect(hours).toHaveLength(6);
    expect(hours.map((hour) => hour.overlapMinutes)).toEqual([30, 60, 60, 60, 60, 30]);
    expect(hours[0]).toMatchObject({ bucketStart: "08:00", bucketEnd: "09:00", isPartialHour: true });
    expect(hours[5]).toMatchObject({ bucketStart: "13:00", bucketEnd: "14:00", isPartialHour: true });
  });
});
