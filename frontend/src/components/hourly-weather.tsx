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
    title: "打球期间的天气", help: "每张卡对应一段打球时间。点一下卡片，可以看这时的降雨动画。",
    rain: "雨量", chance: "下雨可能性", temperature: "气温", wind: "风速", dry: "预报雨量为 0", wet: "预计有降水", missing: "雨量数据缺失",
    select: "看雨势 →", selected: "正在展示雨势", details: "查看数据时间", source: "降雨预报时段", instant: "气温、风速对应时刻",
    partial: (minutes: number) => `你在这段时间里打球 ${minutes} 分钟；雨量仍为整小时预报，未按分钟折算。`,
  },
  ja: {
    title: "プレー中の天気", help: "カードは実際にプレーする時間帯です。押すと、その時間の雨のアニメーションを確認できます。",
    rain: "雨量", chance: "降水確率", temperature: "気温", wind: "風速", dry: "予報雨量は 0", wet: "降水の予報あり", missing: "雨量データなし",
    select: "雨の様子を見る →", selected: "雨の様子を表示中", details: "データの時刻を確認", source: "降水の予報時間帯", instant: "気温・風速の予報時刻",
    partial: (minutes: number) => `この時間帯のプレーは${minutes}分です。雨量は1時間分の予報で、分単位の換算はしていません。`,
  },
  en: {
    title: "Weather during your round", help: "Each card covers part of your playing time. Select a card to see its rain animation.",
    rain: "Rainfall", chance: "Rain chance", temperature: "Temperature", wind: "Wind speed", dry: "0 rainfall forecast", wet: "Precipitation forecast", missing: "Rainfall data missing",
    select: "See rain →", selected: "Showing rain animation", details: "Forecast timestamps", source: "Precipitation forecast period", instant: "Temperature and wind valid at",
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

export function HourlyWeather({ language, hours, selectedTime, onSelect }: {
  language: Language;
  hours: WeatherHour[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  const t = copy[language];
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
      <span className="text-xs text-slate-500">JST</span>
    </div>
    <p className="text-sm leading-6 text-slate-600">{t.help}</p>
    <div className="grid gap-3">
      {hours.map((hour) => {
        const selected = selectedTime === hour.time;
        const wet = (hour.precipitationMm ?? 0) > 0;
        const metrics = [
          { kind: "rain", label: t.rain, value: hour.precipitationMm, unit: "mm" },
          { kind: "chance", label: t.chance, value: hour.precipitationProbability, unit: "%" },
          { kind: "temperature", label: t.temperature, value: hour.temperatureC, unit: "°C" },
          { kind: "wind", label: t.wind, value: hour.windSpeedKmh == null ? null : (hour.windSpeedKmh / 3.6).toFixed(1), unit: "m/s" },
        ] as const;
        return <article key={hour.time} className={`overflow-hidden rounded-2xl border ${selected ? "border-sky-500 ring-2 ring-sky-100" : "border-slate-200"} ${wet ? "bg-sky-50/60" : "bg-white"}`}>
          <button type="button" onClick={() => onSelect(hour.time)} aria-pressed={selected}
            className="block w-full space-y-4 p-4 text-left transition hover:bg-sky-50/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-semibold tabular-nums text-slate-900">{hour.playStart ?? hour.bucketStart}–{hour.playEnd ?? hour.bucketEnd}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs ${wet ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-700"}`}>
                {hour.precipitationMm == null ? t.missing : wet ? t.wet : t.dry}
              </span>
            </span>
            <span className="grid grid-cols-2 gap-x-4 gap-y-4">
              {metrics.map(({ kind, label, value, unit }) => <span key={kind}>
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><WeatherIcon kind={kind} />{label}</span>
                <span className="mt-1 block text-2xl font-semibold tabular-nums text-slate-900">{value ?? "—"} <span className="text-sm font-normal text-slate-500">{unit}</span></span>
                {kind === "chance" && hour.precipitationProbability !== null ? <span aria-hidden="true" className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-sky-500" style={{ width: `${hour.precipitationProbability}%` }} />
                </span> : null}
              </span>)}
            </span>
            <span className="block text-xs font-medium text-sky-700">{selected ? t.selected : t.select}</span>
          </button>
          <details className="border-t border-slate-200/70 px-4 py-2 text-xs leading-5 text-slate-500">
            <summary className="cursor-pointer py-1">{t.details}</summary>
            <p className="mt-1">{t.source}: {hour.bucketStart}–{hour.bucketEnd} JST</p>
            <p>{t.instant}: {hour.bucketEnd} JST</p>
            {hour.isPartialHour ? <p className="mt-1">{t.partial(hour.overlapMinutes)}</p> : null}
          </details>
        </article>;
      })}
    </div>
  </section>;
}
