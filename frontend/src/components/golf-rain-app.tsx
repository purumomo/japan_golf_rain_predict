"use client";

import { useMemo, useState } from "react";

import type { GolfCourse } from "@/lib/courses";
import { courseDatasetAttribution, courseDatasetRetrievedAt, searchCourses } from "@/lib/courses";
import { ROUND_DURATION_HOURS } from "@/lib/tee-window";

type ForecastResponse = {
  course: GolfCourse;
  timezone: string;
  round: {
    estimatedDurationHours: number;
    teeTime: string;
    start: string;
    end: string;
  };
  source: {
    provider: string;
    fetchedAt: string;
    notes: string[];
  };
  bounds: {
    minDate: string;
    maxDate: string;
  };
  summary: {
    highestHourlyProbability: number;
    totalPrecipitationMm: number;
    riskLabel: string;
    summary: string;
  };
  hours: Array<{
    time: string;
    bucketStart: string;
    bucketEnd: string;
    overlapMinutes: number;
    isPartialHour: boolean;
    precipitationProbability: number | null;
    precipitationMm: number | null;
    windSpeedKmh: number | null;
  }>;
  missingForecast: boolean;
};

type GolfRainAppProps = {
  courses: GolfCourse[];
  bounds: {
    minDate: string;
    maxDate: string;
  };
};

function formatFetchTime(isoString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(isoString));
}

function buildTeeTimeOptions() {
  const options: string[] = [];

  for (let hour = 6; hour <= 14; hour += 1) {
    for (const minute of [0, 30]) {
      options.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
    }
  }

  return options;
}

const teeTimeOptions = buildTeeTimeOptions();

export function GolfRainApp({ courses, bounds }: GolfRainAppProps) {
  const [query, setQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(bounds.minDate);
  const [teeTime, setTeeTime] = useState("08:30");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredCourses = useMemo(() => searchCourses(query), [query]);
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? filteredCourses[0] ?? courses[0],
    [courses, filteredCourses, selectedCourseId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        courseId: selectedCourse?.id ?? "",
        date: selectedDate,
        teeTime,
      });
      const response = await fetch(`/api/forecast?${params.toString()}`);
      const payload = (await response.json()) as ForecastResponse & {
        error?: string;
        bounds?: { minDate: string; maxDate: string };
      };

      if (!response.ok) {
        if (response.status === 422 && payload.bounds) {
          setErrorMessage(`対応日付は ${payload.bounds.minDate} から ${payload.bounds.maxDate} です。`);
        } else {
          setErrorMessage("天気予報の取得に失敗しました。少し待ってから再試行してください。");
        }
        setForecast(null);
        return;
      }

      setForecast(payload);
    } catch {
      setErrorMessage("通信エラーが発生しました。ネットワーク接続を確認してください。");
      setForecast(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-sky-100 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              Golf Rain MVP
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                ゴルフ場ごとの 5 時間雨リスクを、JST でそのまま確認。
              </h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-base">
                関東の実在コースを選び、プレー日とスタート時間を指定すると、5 時間ラウンド想定の時間帯ごとの降水確率・降水量・風速を表示します。
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-100">
            <p>タイムゾーン: Asia/Tokyo</p>
            <p>対象日: {bounds.minDate} 〜 {bounds.maxDate}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <label htmlFor="course-search" className="text-sm font-medium text-slate-800">
              ゴルフ場を検索
            </label>
            <input
              id="course-search"
              name="course-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: 千葉、横浜、霞ヶ関"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
            <p className="text-xs text-slate-500">{filteredCourses.length} 件ヒット。コース名か都県名で絞り込めます。</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-800">候補コース</h2>
              {selectedCourse ? (
                <span className="text-xs text-slate-500">選択中: {selectedCourse.name}</span>
              ) : null}
            </div>
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredCourses.slice(0, 12).map((course) => {
                const isSelected = course.id === selectedCourse?.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{course.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{course.prefecture}</div>
                  </button>
                );
              })}
            </div>
            {filteredCourses.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                該当コースがありません。別の表記で検索してください。
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="play-date" className="text-sm font-medium text-slate-800">
                プレー日
              </label>
              <input
                id="play-date"
                type="date"
                value={selectedDate}
                min={bounds.minDate}
                max={bounds.maxDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tee-time" className="text-sm font-medium text-slate-800">
                スタート時間
              </label>
              <select
                id="tee-time"
                value={teeTime}
                onChange={(event) => setTeeTime(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                {teeTimeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>ラウンド想定: スタートから {ROUND_DURATION_HOURS} 時間</p>
            <p>表示単位: 時間ごとの降水確率、降水量、10m 風速</p>
          </div>

          <button
            type="submit"
            disabled={!selectedCourse || isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "予報を取得中..." : "雨リスクを確認する"}
          </button>

          <div aria-live="polite" className="min-h-6 text-sm">
            {errorMessage ? <p className="text-rose-600">{errorMessage}</p> : null}
          </div>
        </form>

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">予報サマリー</h2>
            <p className="text-sm leading-6 text-slate-600">
              最大の時間別降水確率を表示します。これは「5 時間全体で雨が降る確率」ではありません。
            </p>
          </div>

          {!forecast ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              コース・日付・スタート時間を選ぶと、ここに 5 時間ウィンドウの予報を表示します。
            </div>
          ) : forecast.missingForecast ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              選択した時間帯の予報が見つかりませんでした。日付かスタート時間を変えて再試行してください。
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">最大時間別降水確率</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.summary.highestHourlyProbability}%</div>
                  <div className="mt-1 text-sm text-slate-300">ラベル: {forecast.summary.riskLabel}</div>
                </article>
                <article className="rounded-2xl bg-sky-50 p-4 text-sky-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-700">累積降水量</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.summary.totalPrecipitationMm} mm</div>
                  <div className="mt-1 text-sm text-sky-700">5 時間推定ウィンドウ</div>
                </article>
                <article className="rounded-2xl bg-emerald-50 p-4 text-emerald-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">スタート時間</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.round.teeTime}</div>
                  <div className="mt-1 text-sm text-emerald-700">{forecast.round.estimatedDurationHours} 時間想定</div>
                </article>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p className="font-medium text-slate-900">{forecast.course.name}</p>
                <p>{forecast.summary.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  取得時刻: {formatFetchTime(forecast.source.fetchedAt)} / ソース: {forecast.source.provider}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">時間別タイムライン</h3>
                <div className="grid gap-3">
                  {forecast.hours.map((hour) => (
                    <article key={hour.time} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-base font-semibold text-slate-900">
                            {hour.bucketStart}–{hour.bucketEnd}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {hour.isPartialHour ? `ラウンドと ${hour.overlapMinutes} 分だけ重なる時間帯` : "ラウンドと 60 分重なる時間帯"}
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 sm:max-w-40">
                          <div
                            className="h-2 rounded-full bg-sky-500"
                            style={{ width: `${Math.max(hour.precipitationProbability ?? 0, 4)}%` }}
                          />
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <dt className="text-slate-500">降水確率</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.precipitationProbability ?? "—"}%</dd>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <dt className="text-slate-500">降水量</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.precipitationMm ?? "—"} mm</dd>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <dt className="text-slate-500">風速</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.windSpeedKmh ?? "—"} km/h</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                {forecast.source.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600 shadow-sm sm:px-6">
        <p>天気ソース: Open-Meteo Forecast API / 表示時刻はすべて JST です。</p>
        <p>コースデータ: {courseDatasetAttribution} 取得日 {courseDatasetRetrievedAt}。</p>
        <p>注意: 予報はモデル出力であり、実測や的中保証ではありません。独自のラウンド全体降水確率は表示していません。</p>
      </footer>
    </main>
  );
}
