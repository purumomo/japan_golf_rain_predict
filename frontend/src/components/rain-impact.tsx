"use client";

import { useState } from "react";

type Language = "ja" | "zh" | "en";
type Hour = {
  time: string;
  bucketStart: string;
  bucketEnd: string;
  precipitationMm: number | null;
};

const copy = {
  zh: {
    title: "这场雨，打起来是什么感觉？", live: "逐小时预报 · JST", demo: "雨量体验 · 示例，非球场预报",
    select: "选择预报时段", examples: "切换示例雨量", amount: "该小时预报降水量", exampleAmount: "示例：1 小时降水量",
    pause: "暂停动画", play: "播放动画", unknown: "该小时缺少雨量数据，暂不展示雨势。",
    note: "动画帮你感受雨有多大，实际雨势可能时大时小。当天能不能打，还要看球场通知和现场情况。",
    distinction: "概率看“会不会下”，雨量看“下多少”。动画只随雨量变化。", reference: "雨量参考：日本气象厅",
    labels: ["未预报到降水", "零星雨滴", "雨具派上用场", "持续淋湿的准备", "雨势明显加大"],
    impacts: [
      "该小时预报为 0 mm。通常无需因这一雨量增加雨具操作，但仍要留意后续预报。",
      "少量雨滴也可能弄湿握把。带一条干毛巾，挥杆前擦干握把和手套。",
      "手套和握把可能反复变湿。准备雨衣、球包雨罩和备用手套，减少擦拭带来的打断。",
      "雨中操作会更费事。留意站姿是否稳固；果岭若变湿，球速也可能变化，按现场情况调整。",
      "更容易淋湿，场地可能积水。先向球场确认现场状况和安排，再决定是否继续。",
    ],
  },
  ja: {
    title: "この雨、プレーへの影響は？", live: "時間別予報 · JST", demo: "雨量の体感 · サンプル（予報ではありません）",
    select: "予報時間を選択", examples: "サンプル雨量を切り替え", amount: "この1時間の予報降水量", exampleAmount: "サンプル：1時間の降水量",
    pause: "アニメーションを停止", play: "アニメーションを再生", unknown: "この時間の雨量データがないため、雨の表現を表示できません。",
    note: "雨の強さをイメージするためのアニメーションです。実際には強く降ったり弱まったりします。プレーできるかは、ゴルフ場の案内と当日の状況を確認してください。",
    distinction: "確率は「降る可能性」、雨量は「降る量」。雨の表現は雨量だけに連動します。", reference: "雨量の参考：気象庁",
    labels: ["降水量の予報はゼロ", "ぽつぽつと雨粒", "雨具を用意", "濡れ続けることに備える", "雨脚が強まる"],
    impacts: [
      "この時間の予報は0 mm。この雨量による雨具の出し入れは通常不要ですが、最新予報も確認しましょう。",
      "少量の雨でもグリップが濡れることがあります。乾いたタオルでグリップとグローブを拭きましょう。",
      "グローブやグリップが繰り返し濡れる可能性があります。レインウェア、バッグカバー、予備グローブを用意しましょう。",
      "雨の中での動作に手間がかかりそうです。足元を確認し、グリーンが濡れた場合は転がり方の変化にも注意しましょう。",
      "体が濡れやすく、水たまりができる可能性もあります。現地の状況と運営方針をゴルフ場に確認しましょう。",
    ],
  },
  en: {
    title: "What could this rain feel like on course?", live: "Hourly forecast · JST", demo: "Rain guide · Illustrative examples, not a forecast",
    select: "Choose a forecast hour", examples: "Choose an example amount", amount: "Forecast precipitation in this hour", exampleAmount: "Example: precipitation over one hour",
    pause: "Pause animation", play: "Play animation", unknown: "Rainfall data is missing for this hour; no rain scene is shown.",
    note: "The animation gives you a feel for the rain. Actual rain may get heavier or lighter. Check course updates and conditions on the day before playing.",
    distinction: "Probability describes the chance; amount describes how much. Only the amount controls this illustration.", reference: "Rainfall reference: Japan Meteorological Agency",
    labels: ["No precipitation forecast", "Occasional drops", "Keep rain gear ready", "Prepare to stay wet", "More substantial rain"],
    impacts: [
      "The forecast for this hour is 0 mm. This amount usually adds no rain gear handling, but check forecast updates.",
      "Even a little rain can wet your grip. Keep a dry towel ready and wipe your grip and glove before swinging.",
      "Gloves and grips may get wet repeatedly. Pack waterproofs, a bag cover and spare gloves to reduce interruptions.",
      "Handling equipment in the rain takes more effort. Check your footing; a wet green may also change how putts roll.",
      "Getting soaked and standing water are possible. Check conditions and arrangements with the course before continuing.",
    ],
  },
};

const examples = [0, 0.5, 2, 5, 10];

export function RainImpact({ language, hours, selectedTime, onTimeChange }: {
  language: Language;
  hours?: Hour[];
  selectedTime?: string | null;
  onTimeChange?: (time: string) => void;
}) {
  const t = copy[language];
  const [example, setExample] = useState(2);
  const [paused, setPaused] = useState(false);
  const peakHour = hours?.reduce<Hour | undefined>((peak, hour) =>
    hour.precipitationMm !== null && (peak?.precipitationMm == null || hour.precipitationMm > peak.precipitationMm) ? hour : peak, undefined);
  const selected = hours?.find((hour) => hour.time === selectedTime) ?? peakHour ?? hours?.[0];
  const amount = hours ? selected?.precipitationMm ?? null : examples[example];
  const level = amount === null || amount === 0 ? 0 : amount < 1 ? 1 : amount < 3 ? 2 : amount < 10 ? 3 : 4;
  const drops = [0, 8, 18, 32, 48][level];

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40">
      <div className="space-y-3 p-4">
        <p className="text-xs font-medium text-emerald-800">{hours ? t.live : t.demo}</p>
        <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
        {hours ? (
          <label className="block text-sm text-slate-700">
            {t.select}
            <select className="mt-2 w-full rounded-xl border border-emerald-200 bg-white p-2.5" value={selected?.time ?? ""} onChange={(event) => onTimeChange?.(event.target.value)}>
              {hours.map((hour) => <option key={hour.time} value={hour.time}>{hour.bucketStart}–{hour.bucketEnd} · {hour.precipitationMm ?? "—"} mm</option>)}
            </select>
          </label>
        ) : (
          <div role="group" aria-label={t.examples} className="flex flex-wrap gap-2">
            {examples.map((value, index) => <button key={value} type="button" aria-pressed={index === example} onClick={() => setExample(index)} className={`rounded-full border px-3 py-2 text-sm ${index === example ? "border-emerald-800 bg-emerald-800 text-white" : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100"}`}>{value} mm</button>)}
          </div>
        )}
      </div>
      <div className={`rain-scene ${paused ? "rain-scene-paused" : ""}`}>
        {amount !== null ? <svg viewBox="0 0 480 240" aria-hidden="true" className="block w-full">
          <rect width="480" height="240" fill={level > 2 ? "#cbdde3" : "#e2f0f1"} />
          <circle cx="390" cy="48" r="22" fill="#f9df93" opacity={level > 1 ? 0.25 : 0.9} />
          <path d="M0 136 Q90 72 190 133 T480 112 V240 H0Z" fill="#94b9a5" />
          <path d="M0 170 Q130 117 260 168 T480 150 V240 H0Z" fill="#4c896c" />
          <ellipse cx="338" cy="199" rx="112" ry="28" fill="#a1c68a" />
          <ellipse cx="350" cy="201" rx="9" ry="3" fill="#315542" />
          <path d="M350 201 V102" stroke="#faf9ed" strokeWidth="3" />
          <path d="M352 103 L389 114 L352 126Z" fill="#ec795b" />
          {level >= 3 ? <g fill="#c2e5eb" opacity="0.65"><ellipse cx="111" cy="218" rx="40" ry="5" /><ellipse cx="306" cy="213" rx="28" ry="4" /></g> : null}
          <g stroke="#213f3a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx="163" cy="122" r="10" fill="#edc29b" stroke="none" />
            <path d="M152 112 H177" stroke="#f9f5e9" strokeWidth="6" />
            <path d="M162 138 L159 171" stroke="#faf8ee" strokeWidth="15" />
            <path d="M159 171 L146 202 M159 171 L175 202 M165 141 L185 158 L200 153" />
            <path d="M200 153 L229 194 L239 194" strokeWidth="2.5" />
          </g>
          <circle cx="242" cy="197" r="3" fill="white" />
          <g stroke="#598fae" strokeWidth={level >= 3 ? 2 : 1.5} strokeLinecap="round" opacity="0.65">
            {Array.from({ length: drops }, (_, index) => <line key={index} className="rain-drop" x1={(index * 73 + 19) % 500} y1={-30} x2={(index * 73 + 19) % 500 - 5} y2={level >= 3 ? -12 : -20} style={{ animationDelay: `${-(index * 0.19)}s`, animationDuration: `${level >= 3 ? 0.65 : 1.15}s` }} />)}
          </g>
        </svg> : <p className="p-6 text-sm text-slate-600">{t.unknown}</p>}
        {amount !== null ? <div className="absolute left-4 top-3 rounded-xl bg-white/95 px-3 py-2 text-slate-800 shadow-sm">
          <p className="text-xs">{hours ? t.amount : t.exampleAmount}</p><p className="text-2xl font-semibold">{amount} <span className="text-sm font-normal">mm</span></p>
        </div> : null}
      </div>
      <div className="space-y-3 p-4" aria-live="polite">
        {amount !== null ? <><div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-emerald-950">{t.labels[level]}</h4>
          <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-900">{paused ? t.play : t.pause}</button>
        </div><p className="text-sm leading-6 text-slate-700">{t.impacts[level]}</p></> : null}
        <p className="text-xs leading-5 text-emerald-900">{t.distinction}</p>
        <p className="text-xs leading-5 text-slate-500">{t.note}</p>
        <a href="https://www.jma.go.jp/jma/kishou/know/yougo_hp/amehyo.html" target="_blank" rel="noreferrer" className="inline-block text-xs text-emerald-800 underline">{t.reference} ↗</a>
      </div>
    </section>
  );
}
