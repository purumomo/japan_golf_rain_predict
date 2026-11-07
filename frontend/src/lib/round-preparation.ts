import type { ClothingAdviceData } from "@/components/clothing-advice";
import type { Language } from "@/lib/language";

const copy = {
  zh: {
    rising: "气温逐渐升高", falling: "气温逐渐降低", temperature: "气温",
    windRising: "风逐渐变大", windFalling: "风逐渐减弱", wind: "风速最高",
    items: {fleece: "抓绒中层", vest: "保暖马甲", insulatedJacket: "轻薄棉服", golfPants: "弹力长裤", thermalPants: "保暖长裤", lightPants: "轻薄速干长裤", cap: "透气球帽", beanie: "保暖针织帽", neckWarmer: "脖套", rainHat: "防雨帽", waterproofShoes: "防水高尔夫鞋", towel: "备用毛巾",  warmLayer: "保暖内层", longSleeve: "长袖上衣", polo: "透气球衣", rainJacket: "防水外套", windJacket: "防风外套", rainPants: "防水长裤", spareGloves: "备用手套" },
    prepare: "建议准备", join: "、", comma: "，", divider: "；", stop: "。",
    partial: "部分预报缺失，出发前再确认。", empty: "预报数据不足，出发前请再确认天气和装备。",
  },
  ja: {
    rising: "気温は次第に上昇", falling: "気温は次第に低下", temperature: "気温",
    windRising: "風は次第に強まる予報", windFalling: "風は次第に弱まる予報", wind: "最大風速",
    items: {fleece: "フリース", vest: "保温ベスト", insulatedJacket: "中綿ジャケット", golfPants: "ストレッチパンツ", thermalPants: "防寒パンツ", lightPants: "薄手の速乾パンツ", cap: "通気性のよいキャップ", beanie: "ニット帽", neckWarmer: "ネックウォーマー", rainHat: "レインハット", waterproofShoes: "防水ゴルフシューズ", towel: "予備のタオル",  warmLayer: "保温インナー", longSleeve: "長袖シャツ", polo: "通気性のよいシャツ", rainJacket: "レインジャケット", windJacket: "ウィンドブレーカー", rainPants: "レインパンツ", spareGloves: "予備のグローブ" },
    prepare: "おすすめの準備：", join: "・", comma: "、", divider: "。", stop: "。",
    partial: "一部の予報がないため、出発前に再確認してください。", empty: "予報データが不足しています。出発前に天気と装備を確認してください。",
  },
  en: {
    rising: "Temperatures gradually rise", falling: "Temperatures gradually fall", temperature: "Temperatures",
    windRising: "winds gradually strengthen", windFalling: "winds gradually ease", wind: "winds up to",
    items: {fleece: "a fleece midlayer", vest: "a lightweight vest", insulatedJacket: "an insulated jacket", golfPants: "stretch golf trousers", thermalPants: "warm trousers", lightPants: "lightweight trousers", cap: "a breathable cap", beanie: "a knitted beanie", neckWarmer: "a neck warmer", rainHat: "a rain hat", waterproofShoes: "waterproof golf shoes", towel: "a spare towel",  warmLayer: "a warm base layer", longSleeve: "a long-sleeve top", polo: "a breathable golf shirt", rainJacket: "a waterproof jacket", windJacket: "a windproof jacket", rainPants: "waterproof trousers", spareGloves: "spare gloves" },
    prepare: "Bring ", join: ", ", comma: ", ", divider: ". ", stop: ".",
    partial: " Some forecast data is missing; check again before leaving.", empty: "Not enough forecast data. Check the weather and your gear before leaving.",
  },
};

export function formatRoundPreparation(advice: ClothingAdviceData | null | undefined, language: Language) {
  const t = copy[language];
  if (!advice || advice.items.length === 0) return t.empty;
  const conditions: string[] = [];
  if (advice.temperatureMinC != null && advice.temperatureMaxC != null) {
    const range = advice.temperatureMinC === advice.temperatureMaxC
      ? `${advice.temperatureMinC}°C` : `${advice.temperatureMinC}–${advice.temperatureMaxC}°C`;
    const trend = advice.temperatureTrend === "rising" ? t.rising : advice.temperatureTrend === "falling" ? t.falling : null;
    conditions.push(trend ? `${trend} (${range})` : `${t.temperature} ${range}`);
  }
  if (advice.windTrend) conditions.push(advice.windTrend === "rising" ? t.windRising : t.windFalling);
  else if (advice.maxWindSpeedKmh != null && advice.maxWindSpeedKmh >= 18) {
    conditions.push(`${t.wind} ${(advice.maxWindSpeedKmh / 3.6).toFixed(1)} m/s`);
  }
  const gear = advice.items.map((item) => t.items[item]).join(t.join);
  return `${conditions.length ? conditions.join(t.comma) + t.divider : ""}${t.prepare}${gear}${t.stop}${advice.incomplete ? t.partial : ""}`;
}
