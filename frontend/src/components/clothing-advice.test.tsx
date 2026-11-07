import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ClothingAdvice, GolferOutfit, type ClothingAdviceData } from "./clothing-advice";
import { getOutfitLook, OUTFIT_LOOK_COUNT } from "@/lib/outfit-look";
import { formatRoundPreparation } from "@/lib/round-preparation";

const wardrobe: ClothingAdviceData = {
  items: ["warmLayer", "longSleeve", "polo", "fleece", "vest", "insulatedJacket", "golfPants",
    "thermalPants", "lightPants", "cap", "beanie", "neckWarmer", "rainHat", "waterproofShoes",
    "towel", "rainJacket", "windJacket", "rainPants", "spareGloves"],
  temperatureMinC: 0, temperatureMaxC: 28, incomplete: false,
};

describe("expanded clothing checklist", () => {
  it("renders and names every supported garment in all three languages", () => {
    for (const language of ["zh", "ja", "en"] as const) {
      const html = renderToStaticMarkup(<ClothingAdvice language={language} advice={wardrobe} />);
      expect(html.match(/<li /g)).toHaveLength(19);
      expect(html).not.toMatch(/undefined|NaN/);
      expect(formatRoundPreparation(wardrobe, language)).not.toMatch(/undefined/);
      expect(html).toContain('role="img"');
    }
  });

  it("shows a single checklist and a shuffle button without clothing categories", () => {
    const html = renderToStaticMarkup(<ClothingAdvice language="zh" advice={{ ...wardrobe,
      items: ["warmLayer", "longSleeve", "insulatedJacket", "thermalPants", "beanie", "neckWarmer", "towel"],
    }} />);
    for (const label of ["换个造型", "轻薄棉服", "保暖长裤", "保暖针织帽", "脖套"])
      expect(html).toContain(label);
    expect(html).not.toMatch(/基础穿搭|按天气叠穿|配饰与鞋履|球包备用/);
    expect(html.match(/<ul /g)).toHaveLength(1);
    expect(html).not.toContain("防雨帽");
    expect(formatRoundPreparation({ ...wardrobe, items: ["insulatedJacket", "lightPants", "towel"] }, "en"))
      .toContain("an insulated jacket, lightweight trousers, a spare towel");
  });

  it("keeps missing weather explicit without adding a default outfit", () => {
    const html = renderToStaticMarkup(<ClothingAdvice language="zh" advice={{ ...wardrobe,
      items: [], temperatureMinC: null, temperatureMaxC: null, incomplete: true,
    }} />);
    expect(html).toContain("天气数据不足");
    expect(html).toContain("部分天气数据缺失");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("换个造型");
  });

  it("keeps cold and wet garments across every randomized character", () => {
    const items: ClothingAdviceData["items"] = ["warmLayer", "longSleeve", "insulatedJacket", "thermalPants", "beanie", "neckWarmer", "rainJacket", "rainPants", "waterproofShoes"];
    const snapshot = [...items];
    const renderings = new Set<string>();
    for (let index = 0; index < OUTFIT_LOOK_COUNT; index++) {
      const html = renderToStaticMarkup(<GolferOutfit items={items} label="Synthetic cold rainy round" look={getOutfitLook(index)} />);
      expect(html).toContain('data-garment="rainJacket"');
      expect(html).toContain('data-garment="rainPants"');
      expect(html).toContain('data-sleeves="long"');
      expect(html).toContain('data-garment="beanie"');
      expect(html).toContain('data-garment="neckWarmer"');
      renderings.add(html);
    }
    expect(renderings.size).toBe(OUTFIT_LOOK_COUNT);
    expect(items).toEqual(snapshot);
  });

  it("gives every golf look a hat, club, glove, bag and ball without changing weather needs", () => {
    for (let index = 0; index < OUTFIT_LOOK_COUNT; index++) {
      const look = getOutfitLook(index);
      const dry = renderToStaticMarkup(<GolferOutfit items={["longSleeve", "vest", "golfPants"]} label="Synthetic mild golf round" look={look} />);
      for (const item of ["golf-club", "golf-glove", "golf-bag", "golf-ball"])
        expect(dry).toContain(`data-equipment="${item}"`);
      expect(dry).toContain('data-garment="golf-cap"');
      expect(dry).toContain('data-sleeves="long"');
      const rainy = renderToStaticMarkup(<GolferOutfit items={["polo", "lightPants", "cap", "rainHat", "rainJacket"]} label="Synthetic warm wet golf round" look={look} />);
      expect(rainy).toContain('data-garment="rainHat"');
      expect(rainy).not.toContain('data-garment="golf-cap"');
      expect(rainy).toContain('data-garment="rainJacket"');
    }
  });
});
