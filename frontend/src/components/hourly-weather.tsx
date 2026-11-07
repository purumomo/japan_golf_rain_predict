"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { RoundWeatherScene } from "@/components/round-weather-scene";
import type { Language } from "@/lib/language";
import { getWeatherAppearance } from "@/lib/weather-appearance";

export type WeatherHour = {
  time: string;
  bucketStart: string;
  bucketEnd: string;
  playStart?: string;
  playEnd?: string;
  overlapMinutes: number;
  isPartialHour: boolean;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  snowfallCm: number | null;
  temperatureC: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
  cloudCoverPct: number | null;
  isDay: boolean | null;
  highlights?: ("coldest" | "windIncreasing" | "rainPossible" | "snowPossible" | "precipitationPossible")[];
};

const copy = {
  zh: {
    title: "打球期间的天气", help: "切换时段，看这一轮的天气怎么变。", scene: "球场天气示意",
    rain: "降水量", chance: "雨雪可能性", temperature: "气温", wind: "风速", snow: "降雪量",
    dry: "预报降水量为 0", wet: "预计有降水", raining: "预计有雨", snowing: "预计有雪", mixed: "预计雨雪混合", missing: "降水数据缺失", empty: "暂无这个时段的预报。",
    pause: "暂停动画", play: "播放动画", timeline: "切换打球时段",
    highlights: { coldest: "本轮最冷", windIncreasing: "风明显变大", rainPossible: "可能有雨", snowPossible: "可能有雪", precipitationPossible: "可能有雨雪" },
    details: "预报数据与时间", source: "降水预报时段", instant: "气温、风速对应时刻",
    visualNote: "这是预报场景示意，不是球场实景。树木和风线表示风速，不表示现场风向。降水量包含雨和雪折合的水量；降雪量单独以厘米显示，不代表地面积雪厚度。",
    partial: (minutes: number) => `这个小时内打球 ${minutes} 分钟；降水量仍显示整小时预报。`,
    conditions: { clear: "晴", mostlyClear: "晴间少云", partlyCloudy: "多云", overcast: "阴天", fog: "有雾", drizzle: "毛毛雨", rain: "有雨", snow: "有雪", mixed: "雨雪混合", storm: "雷雨", unknown: "天气状态待更新" },
  },
  ja: {
    title: "プレー中の天気", help: "時間を切り替えて、ラウンド中の天気の変化を見てみましょう。", scene: "コースの天気イメージ",
    rain: "降水量", chance: "降水確率", temperature: "気温", wind: "風速", snow: "降雪量",
    dry: "予報降水量は 0", wet: "降水の予報あり", raining: "雨の予報", snowing: "雪の予報", mixed: "雨と雪の予報", missing: "降水データなし", empty: "この時間帯の予報はありません。",
    pause: "アニメーションを停止", play: "アニメーションを再生", timeline: "プレー時間を切り替え",
    highlights: { coldest: "ラウンド中の最低気温", windIncreasing: "風が強まる", rainPossible: "雨の可能性", snowPossible: "雪の可能性", precipitationPossible: "雨・雪の可能性" },
    details: "予報データと時刻", source: "降水の予報時間帯", instant: "気温・風速の予報時刻",
    visualNote: "予報のイメージであり、現地の映像ではありません。木や風の線は風速を表し、実際の風向きは示しません。降水量は雪を水に換算した量も含みます。降雪量はcmで表示し、積雪の深さではありません。",
    partial: (minutes: number) => `この1時間内のプレーは${minutes}分です。雨量は1時間分の予報です。`,
    conditions: { clear: "快晴", mostlyClear: "晴れ", partlyCloudy: "晴れ時々曇り", overcast: "曇り", fog: "霧", drizzle: "霧雨", rain: "雨", snow: "雪", mixed: "雨と雪", storm: "雷雨", unknown: "天気データなし" },
  },
  en: {
    title: "Weather during your round", help: "Choose a time to see how the weather changes through your round.", scene: "Illustrated course weather",
    rain: "Precipitation", chance: "Rain / snow chance", temperature: "Temperature", wind: "Wind speed", snow: "Snowfall",
    dry: "0 precipitation forecast", wet: "Precipitation forecast", raining: "Rain forecast", snowing: "Snow forecast", mixed: "Rain and snow forecast", missing: "Precipitation data missing", empty: "No forecast for this time.",
    pause: "Pause animation", play: "Play animation", timeline: "Choose a playing time",
    highlights: { coldest: "Coldest this round", windIncreasing: "Wind picks up", rainPossible: "Rain possible", snowPossible: "Snow possible", precipitationPossible: "Rain / snow possible" },
    details: "Forecast data and times", source: "Precipitation forecast period", instant: "Temperature and wind valid at",
    visualNote: "A forecast illustration, not live footage. Trees and wind streaks show speed, not actual direction. Precipitation includes the water equivalent of snow. Snowfall is shown in cm and is not snow depth.",
    partial: (minutes: number) => `You play for ${minutes} minutes in this hour; rainfall is the full hourly forecast.`,
    conditions: { clear: "Clear", mostlyClear: "Mainly clear", partlyCloudy: "Partly cloudy", overcast: "Overcast", fog: "Fog", drizzle: "Drizzle", rain: "Rain", snow: "Snow", mixed: "Rain and snow", storm: "Thunderstorm", unknown: "Weather data unavailable" },
  },
};

export function HourlyWeather({ language, hours, roundContext, timezone }: { language: Language; hours: WeatherHour[]; roundContext?: ReactNode; timezone: string }) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const t = copy[language];
  const selected = hours.find((hour) => hour.time === selectedTime) ?? hours[0];
  if (!selected) return <p className="text-sm text-slate-600">{t.empty}</p>;
  const wet = (selected.precipitationMm ?? 0) > 0;
  const snowing = (selected.snowfallCm ?? 0) > 0;
  const raining = (selected.rainMm ?? 0) > 0;
  const appearance = getWeatherAppearance(selected);
  const condition = appearance.kind === "unknown" ? (selected.precipitationMm == null ? t.missing : wet ? t.wet : t.conditions.unknown)
    : t.conditions[appearance.kind];
  const metrics = [
    { label: t.temperature, value: selected.temperatureC, unit: "°C" },
    { label: t.wind, value: selected.windSpeedKmh == null ? null : (selected.windSpeedKmh / 3.6).toFixed(1), unit: "m/s" },
    { label: t.rain, value: selected.precipitationMm, unit: "mm" },
    { label: t.chance, value: selected.precipitationProbability, unit: "%" },
  ];

  return <section className="@container overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm shadow-emerald-100/40">
    <header className="space-y-1 px-4 pt-4 pb-3">
      <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
      {roundContext}
      <p className="text-xs leading-5 text-slate-500">{t.help}</p>
    </header>
    <div className="relative isolate overflow-hidden bg-emerald-50">
      <RoundWeatherScene weather={selected} paused={paused} />
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold tabular-nums text-slate-800">{selected.playStart ?? selected.bucketStart}–{selected.playEnd ?? selected.bucketEnd} <span className="text-[10px] font-normal text-slate-500">{timezone}</span></p>
          <p className={`mt-1 text-[11px] ${wet || snowing || raining ? "text-sky-800" : "text-emerald-800"}`}>{condition}{snowing ? ` · ${t.snow} ${selected.snowfallCm} cm` : ""}</p>
        </div>
        <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? t.play : t.pause} title={paused ? t.play : t.pause}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M6 3 L17 10 L6 17Z" /> : <path d="M5 4 H8 V16 H5Z M12 4 H15 V16 H12Z" />}
          </svg>
        </button>
      </div>
      <p className="absolute right-3 bottom-2 rounded-full bg-white/80 px-2 py-1 text-[10px] text-emerald-950">{t.scene}</p>
    </div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-emerald-100 bg-emerald-50/40 px-4 py-4 @min-[400px]:grid-cols-4" aria-live="polite" aria-atomic="true">
      {metrics.map(({ label, value, unit }) => <div key={label}>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value ?? "—"}<span className="ml-1 text-xs font-normal text-slate-500">{unit}</span></dd>
      </div>)}
    </dl>
    <div role="group" aria-label={t.timeline} className="grid grid-cols-2 gap-2 p-3 @min-[400px]:grid-cols-3">
      {hours.map((hour) => <button key={hour.time} type="button" onClick={() => setSelectedTime(hour.time)} aria-pressed={selected.time === hour.time}
        className={`min-w-0 rounded-xl border px-2 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected.time === hour.time ? "border-emerald-700 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"}`}>
        <span className="block whitespace-nowrap text-[11px] font-medium tabular-nums">{hour.playStart ?? hour.bucketStart}–{hour.playEnd ?? hour.bucketEnd}</span>
        <span className="mt-1.5 flex flex-wrap items-center justify-between gap-1 tabular-nums">
          <span className="text-sm font-semibold">{hour.temperatureC ?? "—"}°C</span>
          <span className="text-[10px] opacity-80">{(hour.snowfallCm ?? 0) > 0 ? `${t.snow} ${hour.snowfallCm} cm` : `${t.rain} ${hour.precipitationMm ?? "—"} mm`}</span>
        </span>
        {hour.highlights?.length ? <span className="mt-2 flex flex-wrap gap-1">
          {hour.highlights.map((highlight) => <span key={highlight} className={`rounded-md px-1.5 py-1 text-[10px] leading-4 ${selected.time === hour.time ? "bg-white/15 text-white" : "bg-amber-50 text-amber-900"}`}>{t.highlights[highlight]}</span>)}
        </span> : null}
        {hour.precipitationProbability !== null ? <span aria-hidden="true" className={`mt-2 block h-1 overflow-hidden rounded-full ${selected.time === hour.time ? "bg-emerald-600" : "bg-slate-100"}`}>
          <span className={`block h-full rounded-full ${selected.time === hour.time ? "bg-white" : "bg-sky-500"}`} style={{ width: `${hour.precipitationProbability}%` }} />
        </span> : null}
      </button>)}
    </div>
    <details className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs leading-5 text-slate-500">
      <summary className="cursor-pointer py-1 marker:text-slate-400">{t.details}</summary>
      <p className="mt-2">{t.visualNote}</p>
      <ul className="mt-2 space-y-2">
        {hours.map((hour) => <li key={hour.time}>
          <p>{t.source}: {hour.bucketStart}–{hour.bucketEnd} {timezone} · {t.instant}: {hour.bucketEnd}</p>
          <p>{t.temperature}: {hour.temperatureC ?? "—"}°C · {t.wind}: {hour.windSpeedKmh == null ? "—" : (hour.windSpeedKmh / 3.6).toFixed(1)} m/s · {t.rain}: {hour.precipitationMm ?? "—"} mm · {t.chance}: {hour.precipitationProbability ?? "—"}%</p>
          <p>{t.snow}: {hour.snowfallCm ?? "—"} cm</p>
          {hour.isPartialHour ? <p>{t.partial(hour.overlapMinutes)}</p> : null}
        </li>)}
      </ul>
    </details>
  </section>;
}
