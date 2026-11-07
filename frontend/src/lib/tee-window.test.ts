import { describe, expect, it } from "vitest";

import { getForecastDateOptions } from "./tee-window";

describe("Course-local calendar date options", () => {
  it("offers only dates inside the supported range, including both ends", () => {
    expect(getForecastDateOptions({ minDate: "2026-11-07", maxDate: "2026-11-12" })).toEqual([
      "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
    ]);
  });

  it("lists dates across year boundaries without using the browser timezone", () => {
    expect(getForecastDateOptions({ minDate: "2026-12-31", maxDate: "2027-01-02" })).toEqual([
      "2026-12-31", "2027-01-01", "2027-01-02",
    ]);
  });
});
