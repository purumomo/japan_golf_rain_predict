import { describe, expect, it } from "vitest";

import type { ClothingAdviceData } from "@/components/clothing-advice";
import { formatRoundPreparation } from "./round-preparation";

const advice: ClothingAdviceData = {
  items: ["longSleeve", "windJacket"], temperatureMinC: 14, temperatureMaxC: 18,
  temperatureTrend: "rising", windTrend: "rising", maxWindSpeedKmh: 20, incomplete: false,
};

describe("round preparation sentence", () => {
  it("uses round trends and the same clothing recommendations as the outfit", () => {
    expect(formatRoundPreparation(advice, "zh"))
      .toBe("气温逐渐升高 (14–18°C)，风逐渐变大；建议准备长袖上衣、防风外套。");
  });

  it("reports a range without inventing trends or rain for a dry fluctuating forecast", () => {
    const sentence = formatRoundPreparation({ ...advice, temperatureTrend: null, windTrend: null }, "zh");
    expect(sentence).toContain("气温 14–18°C，风速最高 5.6 m/s");
    expect(sentence).not.toMatch(/逐渐|雨|晴/);
  });

  it("preserves zero, negative temperatures, missing data and rain gear", () => {
    const sentence = formatRoundPreparation({ ...advice, temperatureMinC: -2, temperatureMaxC: 0,
      temperatureTrend: "falling", windTrend: null, maxWindSpeedKmh: null,
      items: ["warmLayer", "rainJacket", "spareGloves"], incomplete: true }, "zh");
    expect(sentence).toContain("气温逐渐降低 (-2–0°C)");
    expect(sentence).toContain("保暖内层、防水外套、备用手套");
    expect(sentence).toContain("部分预报缺失");
    expect(formatRoundPreparation(null, "zh")).toContain("数据不足");
  });

  it("supports Japanese and English with consistent recommendations", () => {
    expect(formatRoundPreparation(advice, "ja")).toContain("長袖シャツ・ウィンドブレーカー");
    expect(formatRoundPreparation(advice, "en")).toContain("Bring a long-sleeve top, a windproof jacket.");
  });
});
