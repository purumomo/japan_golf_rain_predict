"use client";

import { useState } from "react";

import type { Language } from "@/lib/language";

type ClothingItem = "warmLayer" | "longSleeve" | "polo" | "rainJacket" | "windJacket" | "rainPants" | "spareGloves";

export type ClothingAdviceData = {
  items: ClothingItem[];
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  incomplete: boolean;
};

const copy = {
  zh: {
    title: "建议携带的衣物", range: "本轮小时预报气温", replay: "再看一次", empty: "天气数据不足，暂时无法整理衣物建议。",
    note: "按本轮气温、降雨和风速整理，怕冷怕热可自行增减。", partial: "部分天气数据缺失，清单可能不完整。",
    items: {
      warmLayer: ["保暖内层", "多带一层，冷了再加"], longSleeve: ["长袖上衣", "方便叠穿和穿脱"],
      polo: ["透气球衣", "轻便，方便挥杆"], rainJacket: ["防水外套", "可能下雨，放包里备用"],
      windJacket: ["防风外套", "有风时加在外面"], rainPants: ["防水长裤", "雨量较多，减少裤腿淋湿"],
      spareGloves: ["备用手套", "手套湿了及时换"],
    },
  },
  ja: {
    title: "持っていきたいウェア", range: "ラウンド中の時間別予報気温", replay: "もう一度見る", empty: "ウェアを提案するための天気データが不足しています。",
    note: "気温・雨・風をもとにした持ち物の目安です。暑がり・寒がりに合わせて調整してください。", partial: "一部の天気データがないため、リストが不完全な場合があります。",
    items: {
      warmLayer: ["保温インナー", "寒いときに重ねる一枚"], longSleeve: ["長袖シャツ", "重ね着で調整しやすく"],
      polo: ["通気性のよいシャツ", "動きやすいウェアで"], rainJacket: ["レインジャケット", "雨に備えてバッグに一枚"],
      windJacket: ["ウィンドブレーカー", "風があるときに羽織る"], rainPants: ["レインパンツ", "雨で裾が濡れるのを軽減"],
      spareGloves: ["予備のグローブ", "濡れたら交換できるように"],
    },
  },
  en: {
    title: "Clothing to pack", range: "Hourly forecast temperatures for your round", replay: "Replay", empty: "Not enough weather data for a clothing checklist yet.",
    note: "A packing guide based on temperature, rain and wind. Adjust for how warm or cold you tend to feel.", partial: "Some weather data is missing, so the list may be incomplete.",
    items: {
      warmLayer: ["Warm base layer", "An extra layer for the cold"], longSleeve: ["Long-sleeve top", "Easy to layer and remove"],
      polo: ["Breathable golf shirt", "Light and easy to swing in"], rainJacket: ["Waterproof jacket", "Pack for possible rain"],
      windJacket: ["Windproof jacket", "An outer layer for the wind"], rainPants: ["Waterproof trousers", "Help keep your legs dry"],
      spareGloves: ["Spare gloves", "Swap out wet gloves"],
    },
  },
};

function Garment({ item }: { item: ClothingItem }) {
  const jacket = item === "rainJacket" || item === "windJacket";
  const fill = jacket ? "#549ba6" : item === "warmLayer" ? "#9e8fc4" : "#d9b886";
  return (
    <svg viewBox="0 0 120 100" className="mx-auto h-20 w-24" aria-hidden="true">
      <ellipse cx="60" cy="91" rx="29" ry="4" fill="#e2e8e6" />
      <g className="packing-garment" stroke="#345c58" strokeWidth="2" strokeLinejoin="round">
        {item === "rainPants" ? <path d="M36 15 H84 L90 83 H67 L60 44 L53 83 H30Z M37 25 H84" fill="#549ba6" />
          : item === "spareGloves" ? <>
            <path d="M38 82 L29 56 Q25 47 31 47 L40 58 V26 Q40 19 45 24 L48 46 V19 Q51 13 55 20 L57 46 V24 Q60 18 64 25 L65 48 V33 Q70 27 73 35 L73 67 L66 82Z" fill="#f8faf5" />
            <path d="M42 71 H68 M45 77 H65" fill="none" />
          </> : <>
            {jacket ? <path d="M43 29 Q42 3 60 5 Q78 3 77 29" fill={fill} /> : null}
            <path d={item === "polo"
              ? "M43 23 L20 35 L28 54 L40 49 V84 H80 V49 L92 54 L100 35 L77 23 L68 29 H52Z"
              : "M43 23 L22 35 L12 67 L28 74 L41 47 V84 H79 V47 L92 74 L108 67 L98 35 L77 23 L68 29 H52Z"} fill={fill} />
            <path d="M43 23 L53 38 L60 30 L67 38 L77 23" fill="#f7f7ef" />
            {jacket ? <path d="M60 32 V84 M44 60 L50 65 M76 60 L70 65" fill="none" /> : <path d="M60 32 V43" fill="none" />}
          </>}
      </g>
    </svg>
  );
}

export function ClothingAdvice({ language, advice }: { language: Language; advice?: ClothingAdviceData | null }) {
  const [replay, setReplay] = useState(0);
  const t = copy[language];
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
        {advice?.items.length ? <button type="button" onClick={() => setReplay(replay + 1)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700">{t.replay}</button> : null}
      </div>
      {advice?.temperatureMinC != null && advice.temperatureMaxC != null ? <p className="mt-2 text-xs text-slate-600">{t.range}: <strong className="tabular-nums">{advice.temperatureMinC}–{advice.temperatureMaxC} °C</strong></p> : null}
      {advice?.items.length ? <ul key={replay} className="mt-3 grid grid-cols-2 gap-3">
        {advice.items.map((item) => <li key={item} className="rounded-xl bg-white p-3 text-center">
          <Garment item={item} />
          <p className="text-sm font-semibold text-slate-900">{t.items[item][0]}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{t.items[item][1]}</p>
        </li>)}
      </ul> : <p className="mt-3 text-sm text-slate-600">{t.empty}</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">{t.note}</p>
      {advice?.incomplete ? <p className="mt-1 text-xs text-amber-800">{t.partial}</p> : null}
    </section>
  );
}
