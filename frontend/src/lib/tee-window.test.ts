import { describe, expect, it } from "vitest";

import { getForecastDateBounds } from "./tee-window";

describe("JST date picker bounds", () => {
  it("offers tomorrow through day six in JST", () => {
    expect(getForecastDateBounds(new Date("2026-11-06T00:30:00+09:00"))).toEqual({
      minDate: "2026-11-07", maxDate: "2026-11-12",
    });
  });

  it("advances at JST midnight independently of the hosting timezone", () => {
    expect(getForecastDateBounds(new Date("2026-11-06T14:59:00Z")).minDate).toBe("2026-11-07");
    expect(getForecastDateBounds(new Date("2026-11-06T15:00:00Z")).minDate).toBe("2026-11-08");
  });

  it("handles year rollover", () => {
    expect(getForecastDateBounds(new Date("2026-12-31T10:00:00+09:00"))).toEqual({
      minDate: "2027-01-01", maxDate: "2027-01-06",
    });
  });
});
