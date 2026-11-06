import type { Language } from "@/lib/language";

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
  temperatureC: number | null;
  windSpeedKmh: number | null;
};

const copy = {
  zh: {
    title: "打球期间的天气", help: "按打球时间，查看雨量、下雨可能性、气温和风速。",
    rain: "雨量", chance: "下雨可能性", temperature: "气温", wind: "风速", dry: "预报雨量为 0", wet: "预计有降水", missing: "雨量数据缺失",
    details: "查看数据时间", source: "降雨预报时段", instant: "气温、风速对应时刻", visualNote: "温度计刻度为 −10 至 40°C，超出刻度时以数字为准。风线快慢只表示风速，不表示风向。",
    partial: (minutes: number) => `你在这段时间里打球 ${minutes} 分钟；雨量仍为整小时预报，未按分钟折算。`,
  },
  ja: {
    title: "プレー中の天気", help: "プレーする時間帯ごとに、雨量・降水確率・気温・風速を確認できます。",
    rain: "雨量", chance: "降水確率", temperature: "気温", wind: "風速", dry: "予報雨量は 0", wet: "降水の予報あり", missing: "雨量データなし",
    details: "データの時刻を確認", source: "降水の予報時間帯", instant: "気温・風速の予報時刻", visualNote: "温度計の目盛りは−10〜40°Cです。範囲外は数値をご確認ください。風の線は風速のイメージで、風向きを示しません。",
    partial: (minutes: number) => `この時間帯のプレーは${minutes}分です。雨量は1時間分の予報で、分単位の換算はしていません。`,
  },
  en: {
    title: "Weather during your round", help: "Check rainfall, rain chance, temperature and wind for each part of your round.",
    rain: "Rainfall", chance: "Rain chance", temperature: "Temperature", wind: "Wind speed", dry: "0 rainfall forecast", wet: "Precipitation forecast", missing: "Rainfall data missing",
    details: "Forecast timestamps", source: "Precipitation forecast period", instant: "Temperature and wind valid at", visualNote: "The thermometer spans −10 to 40°C; use the number outside that range. Wind streak speed illustrates wind speed, not direction.",
    partial: (minutes: number) => `You play for ${minutes} minutes in this bucket. Rainfall is the full hourly forecast, without prorating.`,
  },
};

function WeatherIcon({ kind }: { kind: "rain" | "chance" | "temperature" | "wind" }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {kind === "rain" ? <path d="M12 3 C9 7 5 11 5 15 A7 7 0 0 0 19 15 C19 11 15 7 12 3Z M8 15 Q8 18 11 18" />
      : kind === "chance" ? <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M5 20 L19 4" /></>
      : kind === "temperature" ? <path d="M9 14 V5 A3 3 0 0 1 15 5 V14 A5 5 0 1 1 9 14Z M12 8 V18 M12 18 H12.01" />
      : <path d="M3 8 H15 Q20 8 20 4 Q20 1 17 3 M3 12 H19 Q24 12 22 16 M3 16 H12 Q16 16 16 20 Q16 23 13 21" />}
  </svg>;
}

function TemperatureGauge({ value }: { value: number | null }) {
  const height = value == null ? 0 : (Math.min(40, Math.max(-10, value)) + 10) / 50 * 60;
  const color = value == null ? "text-slate-300" : value < 10 ? "text-sky-500" : value < 25 ? "text-teal-500" : "text-orange-500";
  return <svg viewBox="0 0 48 90" width="42" height="80" aria-hidden="true" className={`shrink-0 ${color}`}>
    <rect x="8" y="4" width="14" height="70" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <rect key={value} x="12" y={72 - height} width="6" height={height} rx="3" fill="currentColor" className="temperature-fill" />
    <circle cx="15" cy="76" r="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="15" cy="76" r="6" fill={value == null ? "#e2e8f0" : "currentColor"} />
    <path d="M23 12 H27 M23 36 H27 M23 60 H27 M23 72 H27" stroke="#94a3b8" />
    <g fill="#64748b" fontSize="7" fontFamily="Arial, sans-serif"><text x="29" y="15">40°</text><text x="29" y="39">20°</text><text x="29" y="63">0°</text><text x="29" y="75">−10°</text></g>
  </svg>;
}

function WindFlow({ speedKmh }: { speedKmh: number | null }) {
  const moving = speedKmh !== null && speedKmh > 0;
  const duration = `${Math.max(0.6, 4 / (1 + (speedKmh ?? 0) / 10.8))}s`;
  return <svg viewBox="0 0 60 36" width="54" height="32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-500">
    <g className={moving ? "weather-wind-flow" : undefined} style={{ animationDuration: duration }}>
      <path d="M3 9 H39 Q48 9 48 4 Q48 0 43 2" />
      <path d="M8 17 H48 Q58 17 58 23 Q58 29 52 26" />
      <path d="M3 25 H31 Q40 25 40 31 Q40 36 34 33" />
    </g>
  </svg>;
}

export function HourlyWeather({ language, hours }: {
  language: Language;
  hours: WeatherHour[];
}) {
  const t = copy[language];
  return <section className="@container overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100/60">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-4">
      <h3 className="text-base font-semibold text-slate-900">{t.title}</h3>
      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-500">JST</span>
    </header>
    <div className="divide-y divide-slate-100">
      {hours.map((hour) => {
        const wet = (hour.precipitationMm ?? 0) > 0;
        return <article key={hour.time} className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-4 py-4 ${wet ? "bg-sky-50/70" : ""}`}>
          <h4 className="border-l-2 border-slate-200 pl-2 text-sm font-semibold tabular-nums text-slate-800">
            <span className="block">{hour.playStart ?? hour.bucketStart}</span>
            <span className="my-1 block h-2 w-px bg-slate-300" aria-hidden="true" />
            <span className="block text-xs font-normal text-slate-500">{hour.playEnd ?? hour.bucketEnd}</span>
          </h4>
          <dl className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 @min-[420px]:grid-cols-4">
            <div>
              <dt className="text-[11px] text-slate-500">{t.temperature}</dt>
              <dd className="mt-1 flex min-h-8 items-center gap-1 text-base font-semibold tabular-nums text-slate-900">
                <span className="whitespace-nowrap">{hour.temperatureC ?? "—"}<span className="ml-0.5 text-[11px] font-normal text-slate-500">°C</span></span>
                <span className="shrink-0 [&_svg]:h-8 [&_svg]:w-4"><TemperatureGauge value={hour.temperatureC} /></span>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[11px] text-slate-500">{t.wind}<span className="[&_svg]:h-4 [&_svg]:w-6"><WindFlow speedKmh={hour.windSpeedKmh} /></span></dt>
              <dd className="mt-1 flex min-h-8 items-center whitespace-nowrap text-base font-semibold tabular-nums text-slate-900">{hour.windSpeedKmh == null ? "—" : (hour.windSpeedKmh / 3.6).toFixed(1)}<span className="ml-1 text-[11px] font-normal text-slate-500">m/s</span></dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[11px] text-slate-500"><span className="[&_svg]:h-3 [&_svg]:w-3"><WeatherIcon kind="rain" /></span>{t.rain}</dt>
              <dd className={`mt-1 flex min-h-8 items-center whitespace-nowrap text-base font-semibold tabular-nums ${wet ? "text-sky-800" : "text-slate-900"}`}>{hour.precipitationMm ?? "—"}<span className="ml-1 text-[11px] font-normal text-slate-500">mm</span></dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">{t.chance}</dt>
              <dd className="mt-1 flex min-h-8 items-center text-base font-semibold tabular-nums text-slate-900">{hour.precipitationProbability ?? "—"}<span className="ml-0.5 text-[11px] font-normal text-slate-500">%</span></dd>
              {hour.precipitationProbability !== null ? <div aria-hidden="true" className="mt-1 h-1 max-w-20 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${hour.precipitationProbability}%` }} />
              </div> : null}
            </div>
          </dl>
        </article>;
      })}
    </div>
    <details className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs leading-5 text-slate-500">
      <summary className="cursor-pointer py-1 marker:text-slate-400">{t.details}</summary>
      <p className="mt-2">{t.visualNote}</p>
      <ul className="mt-2 space-y-2">
        {hours.map((hour) => <li key={hour.time}>
          <p>{t.source}: {hour.bucketStart}–{hour.bucketEnd} JST · {t.instant}: {hour.bucketEnd}</p>
          {hour.isPartialHour ? <p>{t.partial(hour.overlapMinutes)}</p> : null}
        </li>)}
      </ul>
    </details>
  </section>;
}
