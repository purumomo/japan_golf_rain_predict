"use client";

import { useState } from "react";

import { getOutfitLook, randomizeOutfitLook, type OutfitLook } from "@/lib/outfit-look";
import type { Language } from "@/lib/language";

type ClothingItem = "warmLayer" | "longSleeve" | "polo" | "rainJacket" | "windJacket" | "rainPants" | "spareGloves" | "fleece" | "vest" | "insulatedJacket" | "golfPants" | "thermalPants" | "lightPants" | "cap" | "beanie" | "neckWarmer" | "rainHat" | "waterproofShoes" | "towel";

export type ClothingAdviceData = {
  items: ClothingItem[];
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  incomplete: boolean;
  temperatureTrend?: "rising" | "falling" | null;
  windTrend?: "rising" | "falling" | null;
  maxWindSpeedKmh?: number | null;
};

const copy = {
  zh: {
    title: "这轮怎么穿", range: "本轮小时预报气温", empty: "天气数据不足，暂时无法整理衣物建议。",
    illustration: "本轮穿搭示意", shuffle: "换个造型", shuffleNote: "随机换造型，衣物仍按本轮天气推荐。", male: "男士造型", female: "女士造型", look: "搭好这一轮",
    note: "按本轮气温、降雨和风速整理，怕冷怕热可自行增减。", partial: "部分天气数据缺失，清单可能不完整。",
    items: {
      fleece: ["抓绒中层", "叠在上衣外，保暖又方便穿脱"],
      vest: ["保暖马甲", "护住躯干，手臂挥杆更自在"],
      insulatedJacket: ["轻薄棉服", "低温时加一层，选择活动自如的版型"],
      golfPants: ["弹力长裤", "兼顾活动空间与球场着装要求"],
      thermalPants: ["保暖长裤", "冷天为下半身多留一层暖意"],
      lightPants: ["轻薄速干长裤", "天气偏热，选轻薄透气面料"],
      cap: ["透气球帽", "偏热时选择轻便透气款"],
      beanie: ["保暖针织帽", "低温时给头部多一点保暖"],
      neckWarmer: ["脖套", "低温时护住颈部，热了方便取下"],
      rainHat: ["防雨帽", "放进球包，下雨时换上"],
      waterproofShoes: ["防水高尔夫鞋", "预计有雨时减少鞋内进水"],
      towel: ["备用毛巾", "擦汗或擦拭湿手、握把"],

      warmLayer: ["保暖内层", "多带一层，冷了再加"], longSleeve: ["长袖上衣", "方便叠穿和穿脱"],
      polo: ["透气球衣", "轻便，方便挥杆"], rainJacket: ["防水外套", "下雨时穿在外面"],
      windJacket: ["防风外套", "有风且偏凉的时段，按需加一层"], rainPants: ["防水长裤", "雨量较多，减少裤腿淋湿"],
      spareGloves: ["备用手套", "手套湿了及时换"],
    },
  },
  ja: {
    title: "ラウンドのおすすめコーデ", range: "ラウンド中の時間別予報気温", empty: "ウェアを提案するための天気データが不足しています。",
    illustration: "ラウンドの着用イメージ", shuffle: "コーデを変える", shuffleNote: "見た目をランダムに変更。ウェアは今回の予報に合わせています。", male: "メンズコーデ", female: "レディースコーデ", look: "ラウンドを心地よく",
    note: "気温・雨・風をもとにした持ち物の目安です。暑がり・寒がりに合わせて調整してください。", partial: "一部の天気データがないため、リストが不完全な場合があります。",
    items: {
      fleece: ["フリース", "シャツの上に重ねて、脱ぎ着で調整"],
      vest: ["保温ベスト", "腕を動かしやすい重ね着に"],
      insulatedJacket: ["中綿ジャケット", "冷え込む日は動きやすい上着を"],
      golfPants: ["ストレッチパンツ", "動きやすく、コースの服装規定にも配慮"],
      thermalPants: ["防寒パンツ", "寒い日の下半身の冷え対策に"],
      lightPants: ["薄手の速乾パンツ", "暑い日は軽く通気性のよい素材を"],
      cap: ["通気性のよいキャップ", "暑い日は蒸れにくいものを"],
      beanie: ["ニット帽", "冷え込む日の頭まわりの保温に"],
      neckWarmer: ["ネックウォーマー", "首元を保温し、暑くなったら外して調整"],
      rainHat: ["レインハット", "雨が降ったときのためにバッグへ"],
      waterproofShoes: ["防水ゴルフシューズ", "雨の予報なら足元も備える"],
      towel: ["予備のタオル", "汗や濡れた手、グリップを拭くために"],

      warmLayer: ["保温インナー", "寒いときに重ねる一枚"], longSleeve: ["長袖シャツ", "重ね着で調整しやすく"],
      polo: ["通気性のよいシャツ", "動きやすいウェアで"], rainJacket: ["レインジャケット", "雨が降ったら羽織る"],
      windJacket: ["ウィンドブレーカー", "風が強く肌寒い時間帯に、必要に応じて羽織る"], rainPants: ["レインパンツ", "雨で裾が濡れるのを軽減"],
      spareGloves: ["予備のグローブ", "濡れたら交換できるように"],
    },
  },
  en: {
    title: "What to wear for this round", range: "Hourly forecast temperatures for your round", empty: "Not enough weather data for a clothing checklist yet.",
    illustration: "Round outfit illustration", shuffle: "Shuffle look", shuffleNote: "A random look, dressed for the same round forecast.", male: "Men’s look", female: "Women’s look", look: "Dress for your round",
    note: "A packing guide based on temperature, rain and wind. Adjust for how warm or cold you tend to feel.", partial: "Some weather data is missing, so the list may be incomplete.",
    items: {
      fleece: ["Fleece midlayer", "Layer over your shirt and remove as needed"],
      vest: ["Lightweight vest", "An extra layer with room to swing"],
      insulatedJacket: ["Insulated jacket", "Choose a light layer with room to move"],
      golfPants: ["Stretch golf trousers", "Room to move; check the course dress code"],
      thermalPants: ["Warm trousers", "An insulated option for colder rounds"],
      lightPants: ["Lightweight trousers", "Light, breathable fabric for warm rounds"],
      cap: ["Breathable cap", "Choose a light, ventilated option in warm weather"],
      beanie: ["Knitted beanie", "A warm option for colder rounds"],
      neckWarmer: ["Neck warmer", "Cover your neck; remove it as you warm up"],
      rainHat: ["Rain hat", "Keep it in your bag for wet spells"],
      waterproofShoes: ["Waterproof golf shoes", "Prepare your footwear for wet weather"],
      towel: ["Spare towel", "Wipe sweat, wet hands or grips"],

      warmLayer: ["Warm base layer", "An extra layer for the cold"], longSleeve: ["Long-sleeve top", "Easy to layer and remove"],
      polo: ["Breathable golf shirt", "Light and easy to swing in"], rainJacket: ["Waterproof jacket", "Wear over your top when it rains"],
      windJacket: ["Windproof jacket", "An optional layer for cool, windy hours"], rainPants: ["Waterproof trousers", "Help keep your legs dry"],
      spareGloves: ["Spare gloves", "Swap out wet gloves"],
    },
  },
};

export function GolferOutfit({ items, label, look = getOutfitLook(0) }: {
  items: ClothingItem[]; label: string; look?: OutfitLook;
}) {
  const female = look.gender === "female";
  const rainJacket = items.includes("rainJacket");
  const windJacket = items.includes("windJacket");
  const insulated = items.includes("insulatedJacket");
  const fleece = items.includes("fleece");
  const vest = items.includes("vest");
  const jacket = rainJacket || windJacket || insulated || fleece;
  const longSleeves = !items.includes("polo") || jacket;
  const hasBase = items.some((item) => ["warmLayer", "longSleeve", "polo"].includes(item));
  const top = hasBase ? look.top : "#d8dedb";
  const outer = look.outer;
  const sleeves = jacket ? outer : top;
  const trousers = look.trousers;
  return (
    <svg viewBox="-22 -10 300 340" className="mx-auto w-full max-w-72" role="img" aria-label={label}>
      <circle cx="120" cy="140" r="112" fill="#e7eee3" />
      <path d="M-10 299 Q62 273 121 291 Q200 263 263 291 V319 H-10Z" fill="#dce8cd" />
      <path d="M-5 309 Q93 292 182 310" fill="none" stroke="#c1d3ac" strokeWidth="2" />
      <g aria-hidden="true" stroke="#829779" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M21 147 V79" />
        <path d="M22 80 L48 87 L22 98Z" fill={look.accent} stroke="none" />
        <ellipse cx="21" cy="148" rx="10" ry="2.5" fill="#c6d6b4" stroke="none" />
      </g>
      <g data-equipment="golf-bag" stroke="#405850" strokeWidth="1.6" strokeLinejoin="round">
        <ellipse cx="214" cy="309" rx="33" ry="6" fill="#c3d3b8" stroke="none" />
        <path d="M197 215 L180 306 M226 216 L244 306" fill="none" />
        <path d="M200 160 L198 103 M211 157 L216 94 M224 160 L232 113" stroke="#8a999d" strokeWidth="2.5" />
        <path d="M194 102 Q182 99 184 91 Q190 82 201 91 L203 102Z" fill={look.outer} />
        <path d="M212 95 L213 85 Q221 78 227 82 L226 90Z" fill="#e6e9e3" />
        <path d="M228 114 L229 105 L241 101 L244 107 L237 113Z" fill="#bdc6c8" />
        <path d="M190 155 Q213 146 236 155 L232 296 Q213 306 194 296Z" fill={look.outer} />
        <ellipse cx="213" cy="155" rx="23" ry="7" fill={look.trousers} />
        <path d="M194 172 L232 192 V216 L193 197Z" fill={look.accent} stroke="none" />
        <path d="M200 221 Q214 216 227 221 L226 275 Q213 281 201 275Z" fill={look.top} />
        <path d="M205 228 H221 M213 235 V267 M195 287 Q213 294 232 287" fill="none" />
        <path d="M233 179 Q257 201 236 236" fill="none" stroke={look.accent} strokeWidth="5" />
        {rainJacket ? <path d="M183 159 L184 97 Q181 70 211 70 Q241 71 244 97 L244 159Z" fill={look.outer} /> : null}
        <path d="M204 183 L207 176 L211 183 L207 191Z" fill="#fff9eb" stroke="none" />
      </g>
      <ellipse cx="121" cy="310" rx="70" ry="9" fill="#d8e1d5" />
      <g className="outfit-person" stroke="#324e4e" strokeWidth="1.8" strokeLinejoin="round">
        <path data-garment={items.includes("rainPants") ? "rainPants" : items.includes("thermalPants") ? "thermalPants" : "trousers"} d={look.tailored ? "M91 189 H148 L142 241 L148 295 H130 L117 228 L105 295 H87 L94 240Z" : "M88 189 H151 L147 242 L153 295 H128 L117 228 L108 295 H83 L89 241Z"} fill={trousers} />
        {items.includes("thermalPants") ? <path d="M88 280 H108 M128 280 H150" stroke={look.accent} strokeDasharray="3 2" /> : null}
        {items.includes("rainPants") ? <path d="M96 215 L93 277 M138 215 L143 277" stroke="#d2e6e1" fill="none" /> : null}
        <path d="M117 208 V227 M92 199 H146 M99 224 L95 274 M137 224 L141 274" fill="none" opacity="0.35" />
        <path d="M89 194 Q119 202 150 194 L150 202 Q119 210 89 202Z" fill={look.accent} />
        <rect x="113" y="199" width="12" height="8" rx="1.5" fill="#ede9da" stroke="#69786c" />
        <path d="M119 200 V206" stroke="#69786c" />
        <path d="M82 291 H108 L111 306 H72 Q69 300 82 291Z M128 291 H152 L165 302 Q168 307 158 307 H126Z" fill={items.includes("waterproofShoes") ? "#4b6262" : "#faf9f1"} />
        <path d="M73 307 H111 M127 307 H163" stroke="#879993" strokeWidth="3" />
        <path d="M89 296 L101 298 M87 300 L100 302 M134 296 L146 298 M136 300 L149 302" stroke="#82958f" strokeWidth="1.4" />
        <path d="M77 309 V312 M87 309 V312 M101 309 V312 M134 309 V312 M145 309 V312 M157 309 V312" stroke="#73877e" strokeWidth="2" />
        {female ? <path d="M97 51 Q85 78 96 106 L108 95 L133 95 L145 106 Q159 75 141 48Z" fill={look.hair} /> : null}
        <path d="M104 82 V98 L119 112 L136 98 V80Z" fill={look.skin} />
        {rainJacket ? <path d="M95 109 Q78 76 98 67 Q119 58 142 73 Q157 89 143 110" fill={outer} /> : null}
        <g className="outfit-arm" data-sleeves={longSleeves ? "long" : "short"}>
          <g data-equipment="golf-club">
            <path d="M67 200 L33 298" fill="none" stroke="#8e9da2" strokeWidth="3" />
            <path d="M72 185 L66 204" fill="none" stroke={look.trousers} strokeWidth="6" strokeLinecap="round" />
            <path d="M70 189 L72 190 M68 195 L70 196 M66 201 L68 202" stroke="#b3c2b8" strokeWidth="1.2" />
            {look.pattern === 0 ? <path d="M33 296 L37 302 L15 309 L12 304Z" fill="#a8b4b6" />
              : <path d="M32 296 Q40 296 37 303 L22 310 Q14 311 16 304Z" fill="#c8d0d0" />}
            <path d="M20 305 L32 301 M23 308 L35 304" fill="none" stroke="#7c8d90" strokeWidth="1" />
          </g>
          <path d="M88 104 Q74 106 69 123 L55 168 L62 205 Q66 211 72 205 L72 166 L91 133" fill={look.skin} />
          <path data-equipment="golf-glove" d="M60 190 L73 189 L73 204 Q67 216 60 206Z" fill="#fcf9ef" />
          <path d="M62 198 L70 196 M63 203 L70 201" stroke="#9daaa1" strokeWidth="1" />
          <path d={longSleeves ? "M90 102 Q75 102 69 119 L56 162 L60 191 L74 189 L73 164 L94 129Z" : "M89 102 Q75 103 69 119 L64 136 L84 144 L97 122Z"} fill={sleeves} />
        </g>
        <g className="outfit-arm outfit-arm-right">
          <path d="M149 104 Q163 106 169 123 L183 168 L176 205 Q172 211 166 205 L166 166 L147 133" fill={look.skin} />
          <path d={longSleeves ? "M148 102 Q163 102 169 119 L182 162 L178 191 L164 189 L165 164 L144 129Z" : "M149 102 Q163 103 169 119 L174 136 L154 144 L141 122Z"} fill={sleeves} />
        </g>
        <path d={female || look.tailored ? "M100 96 L88 104 L96 151 L87 193 Q119 202 151 193 L142 151 L150 104 L137 96 L119 108Z" : "M100 96 L88 104 L86 193 Q119 202 152 193 L150 104 L137 96 L119 108Z"} fill={top} />
        {hasBase && look.pattern === 1 ? <path d="M101 141 H139 M100 151 H140 M99 161 H141 M98 171 H142" stroke={look.accent} strokeWidth="3" opacity="0.65" /> : null}
        {hasBase && look.pattern === 2 ? <path d="M100 132 H138 V149 H100Z" fill={look.accent} stroke="none" opacity="0.65" /> : null}
        <path d="M101 96 L109 117 L119 108 L130 117 L137 96" fill="#fcf9f0" />
        <path d="M119 109 V134" fill="none" stroke="#7b8980" />
        <circle cx="122" cy="119" r="1.2" fill="#65796f" stroke="none" />
        <circle cx="122" cy="127" r="1.2" fill="#65796f" stroke="none" />
        {vest && !jacket ? <>
          <path d="M100 97 L90 104 L94 142 L87 194 Q119 204 151 194 L144 142 L149 104 L137 97 L119 120Z" fill={look.accent} />
          <path d="M119 121 V197 M96 153 H109 M130 153 H143" stroke="#c8d8c4" fill="none" />
          {look.pattern !== 2 ? <g stroke="#e9eddf" strokeWidth="1" fill={look.outer}>
            <path d="M101 132 L108 143 L101 154 L94 143Z M136 132 L143 143 L136 154 L129 143Z M101 154 L108 165 L101 176 L94 165Z M136 154 L143 165 L136 176 L129 165Z" />
            <path d="M94 131 L108 155 M129 131 L143 155 M94 153 L108 177 M129 153 L143 177" fill="none" />
          </g> : null}
        </> : null}
        {jacket ? <>
          <path data-garment={rainJacket ? "rainJacket" : windJacket ? "windJacket" : insulated ? "insulatedJacket" : "fleece"} d={female || look.tailored ? "M99 96 L88 104 L96 151 L84 196 L112 200 L119 109Z M137 96 L150 104 L142 151 L155 196 L126 200 L119 109Z" : "M99 96 L88 104 L84 196 L112 200 L119 109Z M137 96 L150 104 L155 196 L126 200 L119 109Z"} fill={outer} />
          {look.pattern === 2 ? <path d="M94 132 H113 V145 H93Z M126 132 H145 L146 145 H126Z" fill={look.accent} stroke="none" /> : null}
          <path d="M119 110 V198 M93 164 L104 159 M144 164 L133 159" fill="none" stroke="#d2e6e1" />
          {insulated && !rainJacket && !windJacket ? <path d="M100 130 H112 M100 146 H112 M100 162 H112 M100 179 H112 M126 130 H138 M126 146 H138 M127 162 H138 M127 179 H138" stroke="#e0aa8a" fill="none" /> : null}
          {fleece && !rainJacket && !windJacket ? <path d="M132 126 H143 V144 H132Z" fill="#8f7c66" stroke="#e6d9c6" /> : null}
          {rainJacket ? <path d="M99 97 L108 119 L119 110 L130 119 L139 97" fill="none" stroke="#d2e6e1" /> : null}
        </> : null}
        <g transform="translate(132 125)" strokeWidth="1">
          <path d="M-3 -6 L3 -8 L9 -6 V1 Q6 6 3 7 Q0 6 -3 1Z" fill={look.accent} stroke="#f4f0df" />
          <path d="M3 -4 V3 M3 -4 L7 -2 L3 0" fill="none" stroke="#fffaf0" />
        </g>
        <ellipse cx="119" cy="57" rx="24" ry="29" fill={look.skin} />
        <path d={female ? "M95 55 Q88 24 115 22 Q143 17 145 53 L136 39 Q120 45 106 34 L102 56Z" : look.pattern === 1 ? "M96 51 Q87 39 97 31 Q95 19 108 25 Q116 14 127 24 Q143 20 145 37 L143 52 L136 39 Q114 51 101 39 L101 54" : "M96 51 Q91 23 120 24 Q146 25 143 52 L136 39 Q114 51 101 39 L101 54"} fill={look.hair} />
        <path d="M106 57 H109 M130 57 H133 M113 72 Q119 76 125 72" fill="none" strokeLinecap="round" />
        <path d="M119 59 L117 65 H121" fill="none" stroke="#b88464" />
        {items.includes("neckWarmer") ? <path data-garment="neckWarmer" d="M101 87 Q119 96 137 87 L139 105 Q120 115 99 104Z" fill={look.accent} /> : null}
        {items.includes("beanie") ? <>
          <path data-garment="beanie" d="M94 42 Q91 13 119 13 Q146 13 145 42Z" fill={look.outer} />
          <path d="M94 37 H145 V47 Q120 51 94 47Z" fill={look.accent} />
          <circle cx="120" cy="11" r="6" fill={look.accent} />
        </> : items.includes("rainHat") ? <>
          <path data-garment="rainHat" d="M95 39 Q98 18 120 19 Q141 21 144 39 L154 49 Q121 56 86 49Z" fill={look.outer} />
          <path d="M95 39 Q119 44 144 39" stroke={look.accent} fill="none" />
        </> : <g data-garment="golf-cap">
          {female && look.pattern === 2 ? <path d="M143 42 Q163 39 160 58 L147 73 Q152 52 140 50Z" fill={look.hair} /> : null}
          {look.pattern === 1 ? <>
            <path d="M94 36 Q118 28 145 35 L145 43 Q119 36 94 45Z" fill={look.top} />
            <path d="M95 42 Q130 36 158 45 L156 51 Q123 45 95 49Z" fill={look.accent} />
          </> : <>
            <path d="M95 40 Q97 16 121 19 Q143 21 145 41Z" fill={look.top} />
            <path d="M120 20 Q133 27 134 38" stroke={look.accent} strokeWidth="1" fill="none" />
            <path d="M95 40 Q125 35 158 44 L157 50 Q123 44 95 47Z" fill={look.accent} />
            <path d="M112 30 L119 27 L126 30 L119 35Z" fill={look.outer} stroke="none" />
          </>}
        </g>}
      </g>
      <g data-equipment="golf-ball" stroke="#8a9b8c" strokeWidth="1">
        <path d="M46 310 V317 M43 311 H49" />
        <circle cx="46" cy="305" r="5.5" fill="#fffdf5" />
        <path d="M43 303 H44 M47 302 H48 M45 306 H46 M48 307 H49" strokeWidth="0.8" />
      </g>
      {items.includes("spareGloves") ? <g transform="translate(177 255)" stroke="#58726b" strokeWidth="1.5" strokeLinejoin="round">
        <rect width="33" height="43" rx="7" fill="#c7d7c9" />
        <path d="M9 36 L5 22 Q5 18 8 21 L12 25 V10 Q15 7 15 12 V21 L18 8 Q21 7 21 12 L21 23 L25 17 Q28 16 27 21 L25 36Z" fill="#fffdf5" />
      </g> : null}
    </svg>
  );
}

function ClothingIcon({ item }: { item: ClothingItem }) {
  const trousers = ["golfPants", "thermalPants", "lightPants", "rainPants"].includes(item);
  const hat = ["cap", "beanie", "rainHat"].includes(item);
  const color = item === "rainJacket" || item === "rainPants" ? "#6ba8ae" : item === "insulatedJacket" ? "#c3896a"
    : item === "fleece" ? "#c6b695" : item === "vest" ? "#8baa8c" : item === "warmLayer" ? "#aca0be"
    : item === "lightPants" || item === "polo" ? "#e4d8bd" : "#93a9b0";
  return <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" fill="none" stroke="#4d625c" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="32" cy="56" rx="23" ry="3" fill="#dce5db" stroke="none" />
    {trousers ? <>
      <path d="M18 10 H46 L49 53 H35 L32 28 L29 53 H15Z" fill={color} />
      <path d="M18 17 H46 M32 11 V26 M21 18 L20 26 M43 18 L44 26" />
      {item === "thermalPants" ? <path d="M17 44 H29 M35 44 H47" strokeDasharray="2 2" /> : null}
      {item === "rainPants" ? <path d="M23 29 V45 M41 29 V45" stroke="#d6f1ed" /> : null}
    </> : hat ? <>
      <path d={item === "beanie" ? "M16 40 V28 Q16 9 32 9 Q48 9 48 28 V40Z" : "M15 37 Q16 14 33 16 Q49 16 49 37Z"} fill={item === "beanie" ? "#b1a3c3" : color} />
      <path d={item === "beanie" ? "M15 34 H49 V44 H15Z" : item === "rainHat" ? "M15 34 L6 46 Q32 53 58 46 L49 34Z" : "M15 35 H49 L59 43 Q37 48 15 42Z"} fill={item === "beanie" ? "#817397" : "#79988b"} />
      {item === "beanie" ? <circle cx="32" cy="9" r="5" fill="#817397" /> : null}
    </> : item === "waterproofShoes" ? <>
      <path d="M12 27 L26 24 L33 35 L52 40 Q58 42 55 51 H9Z" fill="#677e7e" />
      <path d="M9 46 H56 M28 31 L37 30 M31 36 L40 35 M34 41 L44 40" stroke="#e3ede6" />
    </> : item === "spareGloves" ? <path d="M22 52 L13 34 Q11 27 17 30 L23 36 V16 Q25 10 28 16 V30 L30 11 Q33 7 35 13 V30 L39 15 Q43 12 44 18 L42 33 L47 25 Q52 23 51 29 L45 52Z" fill="#f8f4e9" />
      : item === "towel" ? <>
        <path d="M17 13 H47 V51 H17Z" fill="#e5bc8c" />
        <path d="M22 13 V51 M17 21 H47 M17 44 H47 M20 51 V55 M26 51 V55 M32 51 V55 M38 51 V55 M44 51 V55" />
      </> : item === "neckWarmer" ? <>
        <path d="M15 19 Q32 10 49 19 V44 Q32 55 15 44Z" fill="#c29d7e" />
        <path d="M15 20 Q32 30 49 20 M21 28 V43 M28 31 V46 M36 31 V46 M43 28 V43" />
      </> : <>
        <path d={item === "vest" ? "M22 12 L13 18 L18 29 L17 52 H47 L46 29 L51 18 L42 12 L32 21Z"
          : item === "polo" ? "M22 12 L8 20 L13 33 L20 30 L18 52 H46 L44 30 L51 33 L56 20 L42 12 L32 20Z"
          : "M22 12 L10 20 L4 45 L15 48 L21 30 L18 52 H46 L43 30 L49 48 L60 45 L54 20 L42 12 L32 20Z"} fill={color} />
        <path d="M22 12 L27 25 L32 20 L37 25 L42 12" />
        {["rainJacket", "windJacket", "insulatedJacket", "fleece", "vest"].includes(item) ? <path d="M32 21 V52 M22 40 L27 37 M37 37 L42 40" /> : null}
        {item === "insulatedJacket" ? <path d="M20 30 H44 M20 37 H44 M19 45 H45" stroke="#f3d1b5" /> : null}
        {item === "fleece" ? <path d="M38 27 H43 V35 H38Z" fill="#958366" /> : null}
      </>}
  </svg>;
}

export function ClothingAdvice({ language, advice }: { language: Language; advice?: ClothingAdviceData | null }) {
  const t = copy[language];
  const [lookIndex, setLookIndex] = useState(0);
  const look = getOutfitLook(lookIndex);
  return (
    <section className="@container overflow-hidden rounded-2xl border border-amber-200 bg-[#faf7ef]">
      <header className="px-4 pt-4">
        <p className="text-[11px] font-medium tracking-wide text-amber-800">{t.look}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{t.title}</h3>
        {advice?.temperatureMinC != null && advice.temperatureMaxC != null ? <p className="mt-2 text-xs text-slate-600">{t.range}: <strong className="tabular-nums">{advice.temperatureMinC}–{advice.temperatureMaxC} °C</strong></p> : null}
      </header>
      {advice?.items.length ? <>
        <div className="mx-4 mt-4 flex flex-col items-center rounded-2xl border border-white bg-gradient-to-br from-[#edf1e5] via-[#f7f3e9] to-[#eee1d2] px-3 pt-3 pb-4">
          <div role="status" aria-live="polite" aria-atomic="true" className="w-full text-center">
            <GolferOutfit items={advice.items} look={look} label={`${t.illustration} · ${t[look.gender]}`} />
            <p className="text-xs text-emerald-900">{t[look.gender]}</p>
          </div>
          <button type="button" onClick={() => setLookIndex((current) => randomizeOutfitLook(current))}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-800/20 bg-white/90 px-5 py-2 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6 H6 C11 6 13 18 18 18 H21 M17 14 L21 18 L17 22 M3 18 H6 C8 18 9 16 10 14 M14 10 C15 8 16 6 18 6 H21 M17 2 L21 6 L17 10" />
            </svg>
            {t.shuffle}
          </button>
          <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">{t.shuffleNote}</p>
        </div>
        <ul className="grid gap-2 p-4 @min-[360px]:grid-cols-2">
          {advice.items.map((item) => <li key={item} className="flex items-start gap-2 rounded-xl border border-stone-200/70 bg-white/90 p-3">
            <ClothingIcon item={item} />
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-5 text-slate-900">{t.items[item][0]}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{t.items[item][1]}</p>
            </div>
          </li>)}
        </ul>
      </> : <p className="p-4 text-sm text-slate-600">{t.empty}</p>}
      <div className="border-t border-amber-200/60 px-4 py-3 text-xs leading-5 text-slate-500">
        <p>{t.note}</p>
        {advice?.incomplete ? <p className="mt-1 text-amber-800">{t.partial}</p> : null}
      </div>
    </section>
  );
}
