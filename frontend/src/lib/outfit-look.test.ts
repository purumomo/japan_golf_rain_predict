import { describe, expect, it } from "vitest";

import { getOutfitLook, OUTFIT_LOOK_COUNT, randomizeOutfitLook } from "./outfit-look";

describe("random outfit appearance", () => {
  it("offers both genders, distinct palettes and both clothing cuts", () => {
    const looks = Array.from({ length: OUTFIT_LOOK_COUNT }, (_, i) => getOutfitLook(i));
    expect(new Set(looks.map((look) => look.gender))).toEqual(new Set(["male", "female"]));
    expect(new Set(looks.map((look) => look.outer)).size).toBe(6);
    expect(new Set(looks.map((look) => look.tailored)).size).toBe(2);
  });

  it("always changes the look, including random values near either boundary", () => {
    for (let current = 0; current < OUTFIT_LOOK_COUNT; current++) {
      for (const sample of [0, 0.1, 0.5, 0.999999]) {
        const next = randomizeOutfitLook(current, () => sample);
        expect(next).not.toBe(current);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(OUTFIT_LOOK_COUNT);
      }
    }
  });
});
