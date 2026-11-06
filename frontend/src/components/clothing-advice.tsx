"use client";

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
    title: "这轮怎么穿", range: "本轮小时预报气温", empty: "天气数据不足，暂时无法整理衣物建议。",
    illustration: "人物穿搭示意", wear: "穿在身上", pack: "放进球包",
    note: "按本轮气温、降雨和风速整理，怕冷怕热可自行增减。", partial: "部分天气数据缺失，清单可能不完整。",
    items: {
      warmLayer: ["保暖内层", "多带一层，冷了再加"], longSleeve: ["长袖上衣", "方便叠穿和穿脱"],
      polo: ["透气球衣", "轻便，方便挥杆"], rainJacket: ["防水外套", "下雨时穿在外面"],
      windJacket: ["防风外套", "有风时加在外面"], rainPants: ["防水长裤", "雨量较多，减少裤腿淋湿"],
      spareGloves: ["备用手套", "手套湿了及时换"],
    },
  },
  ja: {
    title: "ラウンドのおすすめコーデ", range: "ラウンド中の時間別予報気温", empty: "ウェアを提案するための天気データが不足しています。",
    illustration: "着用イメージ", wear: "着るもの", pack: "バッグに入れるもの",
    note: "気温・雨・風をもとにした持ち物の目安です。暑がり・寒がりに合わせて調整してください。", partial: "一部の天気データがないため、リストが不完全な場合があります。",
    items: {
      warmLayer: ["保温インナー", "寒いときに重ねる一枚"], longSleeve: ["長袖シャツ", "重ね着で調整しやすく"],
      polo: ["通気性のよいシャツ", "動きやすいウェアで"], rainJacket: ["レインジャケット", "雨が降ったら羽織る"],
      windJacket: ["ウィンドブレーカー", "風があるときに羽織る"], rainPants: ["レインパンツ", "雨で裾が濡れるのを軽減"],
      spareGloves: ["予備のグローブ", "濡れたら交換できるように"],
    },
  },
  en: {
    title: "What to wear for this round", range: "Hourly forecast temperatures for your round", empty: "Not enough weather data for a clothing checklist yet.",
    illustration: "Outfit illustration", wear: "Wear", pack: "Pack in your bag",
    note: "A packing guide based on temperature, rain and wind. Adjust for how warm or cold you tend to feel.", partial: "Some weather data is missing, so the list may be incomplete.",
    items: {
      warmLayer: ["Warm base layer", "An extra layer for the cold"], longSleeve: ["Long-sleeve top", "Easy to layer and remove"],
      polo: ["Breathable golf shirt", "Light and easy to swing in"], rainJacket: ["Waterproof jacket", "Wear over your top when it rains"],
      windJacket: ["Windproof jacket", "An outer layer for the wind"], rainPants: ["Waterproof trousers", "Help keep your legs dry"],
      spareGloves: ["Spare gloves", "Swap out wet gloves"],
    },
  },
};

function GolferOutfit({ items, label }: { items: ClothingItem[]; label: string }) {
  const rainJacket = items.includes("rainJacket");
  const windJacket = items.includes("windJacket");
  const jacket = rainJacket || windJacket;
  const warm = items.includes("warmLayer");
  const longSleeves = !items.includes("polo") || jacket;
  const top = warm ? "#8e86ae" : items.includes("longSleeve") ? "#ceaa79" : "#f6efe0";
  const outer = rainJacket ? "#4b969b" : "#6a859e";
  const sleeves = jacket ? outer : top;
  const trousers = items.includes("rainPants") ? "#48777c" : "#344e55";
  return (
    <svg viewBox="0 0 240 330" className="mx-auto w-full max-w-52" role="img" aria-label={label}>
      <circle cx="120" cy="140" r="98" fill="#e7eee3" />
      <ellipse cx="121" cy="310" rx="70" ry="9" fill="#d8e1d5" />
      <g className="outfit-person" stroke="#324e4e" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M88 189 H151 L147 242 L153 295 H128 L117 228 L108 295 H83 L89 241Z" fill={trousers} />
        <path d="M117 208 V227 M92 199 H146" fill="none" opacity="0.5" />
        <path d="M82 291 H108 L111 306 H72 Q69 300 82 291Z M128 291 H152 L165 302 Q168 307 158 307 H126Z" fill="#faf9f1" />
        <path d="M73 307 H111 M127 307 H163" stroke="#879993" />
        <path d="M104 82 V98 L119 112 L136 98 V80Z" fill="#d6a47f" />
        {rainJacket ? <path d="M95 109 Q78 76 98 67 Q119 58 142 73 Q157 89 143 110" fill={outer} /> : null}
        <g className="outfit-arm">
          <path d="M88 104 Q74 106 69 123 L55 168 L62 205 Q66 211 72 205 L72 166 L91 133" fill="#dfb492" />
          <path d={longSleeves ? "M90 102 Q75 102 69 119 L56 162 L60 191 L74 189 L73 164 L94 129Z" : "M89 102 Q75 103 69 119 L64 136 L84 144 L97 122Z"} fill={sleeves} />
        </g>
        <g className="outfit-arm outfit-arm-right">
          <path d="M149 104 Q163 106 169 123 L183 168 L176 205 Q172 211 166 205 L166 166 L147 133" fill="#dfb492" />
          <path d={longSleeves ? "M148 102 Q163 102 169 119 L182 162 L178 191 L164 189 L165 164 L144 129Z" : "M149 102 Q163 103 169 119 L174 136 L154 144 L141 122Z"} fill={sleeves} />
        </g>
        <path d="M100 96 L88 104 L86 193 Q119 202 152 193 L150 104 L137 96 L119 108Z" fill={top} />
        <path d="M101 96 L109 117 L119 108 L130 117 L137 96" fill="#fcf9f0" />
        <path d="M119 109 V130" fill="none" />
        {jacket ? <>
          <path d="M99 96 L88 104 L84 196 L112 200 L119 109Z M137 96 L150 104 L155 196 L126 200 L119 109Z" fill={outer} />
          <path d="M119 110 V198 M93 164 L104 159 M144 164 L133 159" fill="none" stroke="#d2e6e1" />
          {rainJacket ? <path d="M99 97 L108 119 L119 110 L130 119 L139 97" fill="none" stroke="#d2e6e1" /> : null}
        </> : null}
        <ellipse cx="119" cy="57" rx="24" ry="29" fill="#dfb492" />
        <path d="M96 51 Q91 23 120 24 Q146 25 143 52 L136 39 Q114 51 101 39 L101 54" fill="#3e4141" />
        <path d="M106 57 H109 M130 57 H133 M113 72 Q119 76 125 72" fill="none" strokeLinecap="round" />
        <path d="M119 59 L117 65 H121" fill="none" stroke="#b88464" />
      </g>
      {items.includes("spareGloves") ? <g transform="translate(177 255)" stroke="#58726b" strokeWidth="1.5" strokeLinejoin="round">
        <rect width="33" height="43" rx="7" fill="#c7d7c9" />
        <path d="M9 36 L5 22 Q5 18 8 21 L12 25 V10 Q15 7 15 12 V21 L18 8 Q21 7 21 12 L21 23 L25 17 Q28 16 27 21 L25 36Z" fill="#fffdf5" />
      </g> : null}
    </svg>
  );
}

export function ClothingAdvice({ language, advice }: { language: Language; advice?: ClothingAdviceData | null }) {
  const t = copy[language];
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
      </div>
      {advice?.temperatureMinC != null && advice.temperatureMaxC != null ? <p className="mt-2 text-xs text-slate-600">{t.range}: <strong className="tabular-nums">{advice.temperatureMinC}–{advice.temperatureMaxC} °C</strong></p> : null}
      {advice?.items.length ? <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-white p-3">
        <div>
          <GolferOutfit items={advice.items} label={t.illustration} />
          <p className="text-center text-xs text-slate-500">{t.illustration}</p>
        </div>
        <ul className="space-y-3">
          {advice.items.map((item) => <li key={item} className="border-l-2 border-emerald-200 pl-3">
            <p className="text-[11px] text-slate-500">{item === "spareGloves" ? t.pack : t.wear}</p>
            <p className="text-sm font-semibold text-slate-900">{t.items[item][0]}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{t.items[item][1]}</p>
          </li>)}
        </ul>
      </div> : <p className="mt-3 text-sm text-slate-600">{t.empty}</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">{t.note}</p>
      {advice?.incomplete ? <p className="mt-1 text-xs text-amber-800">{t.partial}</p> : null}
    </section>
  );
}
