import { describe, expect, it } from "vitest";

import { getPreferredLanguage } from "./language";

describe("browser language preferences", () => {
  it.each([
    ["zh-CN,zh;q=0.9,en;q=0.8", "zh"],
    ["zh-TW,ja;q=0.8", "zh"],
    ["ja-JP,en-US;q=0.9", "ja"],
    ["en-GB,en;q=0.9", "en"],
    ["ja;q=0.3,en-US;q=0.9", "en"],
    ["fr-FR,de;q=0.9,zh;q=0.7", "zh"],
    ["zh;q=0,en;q=0.5", "en"],
    ["zh;q=invalid,en;q=0.8", "en"],
    ["EN-us,ja;q=0.5", "en"],
    ["fr-FR", "ja"],
    [null, "ja"],
  ])("selects from %s", (header, expected) => {
    expect(getPreferredLanguage(header)).toBe(expected);
  });
});
