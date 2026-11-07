"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ClothingAdvice, type ClothingAdviceData } from "@/components/clothing-advice";
import { HourlyWeather, type WeatherHour } from "@/components/hourly-weather";
import type { GolfCourse } from "@/lib/courses";
import { LatestRequest } from "@/lib/latest-request";
import type { Language } from "@/lib/language";
import { formatRoundPreparation } from "@/lib/round-preparation";
import { getSavedCourseSnapshot, getServerCourseSnapshot, parseSavedCourse, rememberCourse, subscribeSavedCourse } from "@/lib/saved-course";
import { type ForecastDateBounds, getForecastDateOptions, ROUND_DURATION_HOURS } from "@/lib/tee-window";

type RiskLevel = "low" | "medium" | "high" | "unknown";

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
    highestHourlyProbability: number | null;
    totalPrecipitationMm: number | null;
    incomplete: boolean;
    riskLevel: RiskLevel;
  };
  hours: WeatherHour[];
  missingForecast: boolean;
  clothing?: ClothingAdviceData | null;
};

type GolfRainAppProps = {
  initialLanguage: Language;
};

type TranslationSet = {
  heroTitle: string;
  heroBody: string;
  timezoneLabel: string;
  dateRangeLabel: string;
  searchLabel: string;
  searchButton: string;
  searchLoading: string;
  searchIdle: string;
  searchError: string;
  searchRateLimit: string;
  searchPlaceholder: string;
  searchHelp: (count: number) => string;
  selectedLabel: string;
  candidatesLabel: string;
  noCourseResult: string;
  playDateLabel: string;
  teeTimeLabel: string;
  roundEstimateLabel: (hours: number) => string;
  unitsLabel: string;
  submitIdle: string;
  submitLoading: string;
  dateRangeError: (minDate: string, maxDate: string) => string;
  fetchError: string;
  networkError: string;
  summaryTitle: string;
  summaryBody: string;
  emptyState: string;
  missingForecast: string;
  incompleteForecast: string;
  maxHourlyProbabilityLabel: string;
  rainfallTotalLabel: string;
  startTimeCardLabel: string;
  riskLabelPrefix: string;
  fiveHourWindowLabel: string;
  courseSummaryPrefix: string;
  fetchedAtLabel: string;
  sourceLabel: string;
  probabilityLabel: string;
  footerSource: string;
  footerCourseData: string;
  footerWarning: string;
  riskLabels: Record<RiskLevel, string>;
  riskSummaries: Record<RiskLevel, string>;
  sourceNotes: string[];
};

const translations: Record<Language, TranslationSet> = {
  ja: {
    heroTitle: "空を読んで、ナイスショット。",
    heroBody:
      "世界のゴルフ場とプレー日、現地のスタート時間を選ぶと、約5時間のラウンド中の降水確率・降水量・風速を1時間ごとに確認できます。",
    timezoneLabel: "タイムゾーン",
    dateRangeLabel: "対象日",
    searchLabel: "ゴルフ場を検索",
    searchButton: "検索",
    searchLoading: "検索中...",
    searchIdle: "ゴルフ場名を入力して検索してください。住所や地図を確認して、お探しのゴルフ場を選んでください。",
    searchError: "ゴルフ場を検索できませんでした。しばらくしてから、もう一度お試しください。",
    searchRateLimit: "検索が混み合っています。少し待ってから再試行してください。",
    searchPlaceholder: "例: PGM総成、Pebble Beach",
    searchHelp: (count) => `${count}件のゴルフ場が見つかりました。見つからない場合は、ゴルフ場名に国名や地域名を加えて検索してみてください。`,
    selectedLabel: "選択中",
    candidatesLabel: "候補コース",
    noCourseResult: "ゴルフ場が見つかりませんでした。名前の一部や国名や地域名を入れて、もう一度検索してください。",
    playDateLabel: "プレー日",
    teeTimeLabel: "スタート時間",
    roundEstimateLabel: (hours) => `ラウンド時間の目安：スタートから${hours}時間`,
    unitsLabel: "表示内容：1時間ごとの気温（°C）・降水確率・降水量・地上10mの風速（m/s）",
    submitIdle: "プレー中の天気を確認する",
    submitLoading: "予報を取得中...",
    dateRangeError: (minDate, maxDate) => `${minDate}から${maxDate}までの日付を選んでください。`,
    fetchError: "天気予報の取得に失敗しました。少し待ってから再試行してください。",
    networkError: "通信エラーが発生しました。ネットワーク接続を確認してください。",
    summaryTitle: "ラウンドの天気概要",
    summaryBody: "プレー中の気温・風速・降水予報を確認して、ウェアや持ち物を準備しましょう。",
    emptyState: "ゴルフ場・プレー日・スタート時間を選ぶと、ここにスタートから5時間分の予報が表示されます。",
    missingForecast: "選択した時間帯の予報が見つかりませんでした。日付かスタート時間を変えて再試行してください。",
    maxHourlyProbabilityLabel: "最も雨や雪が降りやすい1時間",
    incompleteForecast: "降水予報の一部が不足しています。ラウンド全体の雨のリスクは判断できません。集計に必要なデータが揃わない項目は「—」で表示します。",
    rainfallTotalLabel: "対象時間帯の降水量合計",
    startTimeCardLabel: "スタート時間",
    riskLabelPrefix: "雨のリスク",
    fiveHourWindowLabel: "重なる各1時間の予報を合計。スタート・終了時刻によってはプレー時間外の降水も含みます。",
    courseSummaryPrefix: "取得時刻",
    fetchedAtLabel: "取得時刻",
    sourceLabel: "予報の提供元",
    probabilityLabel: "降水確率",
    footerSource: "天気予報の提供元：Open-Meteo Forecast API / プレー時刻はゴルフ場の現地時間で表示します。",
    footerCourseData: "ゴルフ場検索：Photon / Overpass / © OpenStreetMap contributors（ODbL 1.0）。地図上の名称や位置が最新でない場合があります。",
    footerWarning: "注意: 予報はモデル出力であり、実測や的中保証ではありません。独自のラウンド全体降水確率は表示していません。",
    riskLabels: { low: "低め", medium: "やや高め", high: "高め", unknown: "データ不足" },
    riskSummaries: {
      unknown: "—",
      low: "今の予報では大雨リスクは高くありません。直前に再確認するのがおすすめです。",
      medium: "時間帯によっては雨が降る可能性があります。レインウェアを用意しておくと安心です。",
      high: "雨を見込んだ準備が必要そうです。スタート前後の時間帯は特に確認してください。",
    },
    sourceNotes: [
      "気温と風速は各時間帯の終了時刻の予報値です。気温は体感温度ではありません。",
      "Open-Meteo の時間別降水確率は、各 1 時間区間の予報値です。ラウンド全体の降雨確率ではありません。",
      "30 分刻みのスタート時刻では、最初と最後の時間帯が 5 時間ラウンドと部分的に重なります。",
    ],
  },
  zh: {
    heroTitle: "看准天气，挥出好球。",
    heroBody:
      "搜索全球球场，选择打球日期和当地开球时间后，即可查看按 5 小时一轮估算的逐小时降水概率、降水量和风速。",
    timezoneLabel: "时区",
    dateRangeLabel: "可选日期",
    searchLabel: "搜索高尔夫球场",
    searchButton: "搜索球场",
    searchLoading: "正在搜索...",
    searchIdle: "输入球场名称并搜索，核对候选球场的地址和地图后选择。",
    searchError: "球场搜索失败，请稍后重试。",
    searchRateLimit: "搜索请求较频繁，请稍等后重试。",
    searchPlaceholder: "例如：PGM総成、Pebble Beach",
    searchHelp: (count) => `${count} 个候选结果。可在球场名称中加上国家或地区名缩小范围。`,
    selectedLabel: "当前选择",
    candidatesLabel: "候选球场",
    noCourseResult: "没有找到匹配球场，请尝试其他写法。",
    playDateLabel: "打球日期",
    teeTimeLabel: "开球时间",
    roundEstimateLabel: (hours) => `回合估算：从开球起 ${hours} 小时`,
    unitsLabel: "显示内容：逐小时气温（°C）、雨雪可能性、降水量、10m 风速（m/s）",
    submitIdle: "查看打球天气",
    submitLoading: "正在获取预报...",
    dateRangeError: (minDate, maxDate) => `支持的日期范围为 ${minDate} 到 ${maxDate}。`,
    fetchError: "天气预报获取失败，请稍后重试。",
    networkError: "发生网络错误，请检查连接。",
    summaryTitle: "打球天气概览",
    summaryBody: "查看打球期间的气温、风速和降雨预报，提前准备衣物和装备。",
    emptyState: "选择球场、日期和开球时间后，这里会显示 5 小时窗口的预报。",
    missingForecast: "未找到所选时间段的预报，请更换日期或开球时间后重试。",
    maxHourlyProbabilityLabel: "最可能有雨雪的一小时",
    incompleteForecast: "部分降水预报缺失，无法判断整轮降雨风险。缺少完整数据的汇总项显示为“—”。",
    rainfallTotalLabel: "涉及时段的整小时降水合计",
    startTimeCardLabel: "开球时间",
    riskLabelPrefix: "级别",
    fiveHourWindowLabel: "相加所有涉及的整小时预报；首尾时段可能包含打球时间以外的降水。",
    courseSummaryPrefix: "获取时间",
    fetchedAtLabel: "获取时间",
    sourceLabel: "数据来源",
    probabilityLabel: "雨雪可能性",
    footerSource: "天气来源：Open-Meteo Forecast API / 打球时间按球场当地时区显示。",
    footerCourseData: "球场搜索：Photon / Overpass / © OpenStreetMap contributors（ODbL 1.0）。地图名称和位置可能更新滞后。",
    footerWarning: "注意：预报属于模型输出，并非实测，也不保证准确。页面不会生成自定义的整轮降雨概率。",
    riskLabels: { low: "较低", medium: "中等", high: "较高", unknown: "数据不足" },
    riskSummaries: {
      unknown: "—",
      low: "当前预报下强降雨风险不高，但仍建议在出发前再次确认。",
      medium: "部分时段可能下雨，建议按需要携带雨具。",
      high: "看起来需要按有雨准备，尤其建议重点关注开球前后的时段。",
    },
    sourceNotes: [
      "气温和风速对应每个时段结束时刻；气温不是体感温度。",
      "Open-Meteo 的逐小时降水概率表示各 1 小时时段的预报值，不代表整轮打球期间的总体降雨概率。",
      "如果开球时间是半点，首尾两个小时段只会与 5 小时回合部分重叠。",
    ],
  },
  en: {
    heroTitle: "Read the sky. Own your swing.",
    heroBody:
      "Search for a golf course worldwide, then choose a play date and a local tee time to see hourly precipitation probability, precipitation amount, and wind speed for an estimated five-hour round.",
    timezoneLabel: "Time zone",
    dateRangeLabel: "Available dates",
    searchLabel: "Search golf courses",
    searchButton: "Search",
    searchLoading: "Searching...",
    searchIdle: "Search by course name, then check its address and map before selecting.",
    searchError: "Course search failed. Please try again shortly.",
    searchRateLimit: "Search is busy. Please wait a moment and retry.",
    searchPlaceholder: "Example: Pebble Beach, St Andrews",
    searchHelp: (count) => `${count} candidates. Try the course name and country or region for better matches.`,
    selectedLabel: "Selected",
    candidatesLabel: "Course options",
    noCourseResult: "No matching course found. Try another spelling.",
    playDateLabel: "Play date",
    teeTimeLabel: "Tee time",
    roundEstimateLabel: (hours) => `Round estimate: ${hours} hours from tee-off`,
    unitsLabel: "Shown hourly: temperature (°C), precipitation probability, precipitation and 10m wind speed (m/s)",
    submitIdle: "Check golf weather",
    submitLoading: "Loading forecast...",
    dateRangeError: (minDate, maxDate) => `Supported dates run from ${minDate} to ${maxDate}.`,
    fetchError: "Forecast lookup failed. Please try again shortly.",
    networkError: "A network error occurred. Please check your connection.",
    summaryTitle: "Round weather overview",
    summaryBody: "Check temperature, wind and precipitation forecasts for your round, then plan your outfit and equipment.",
    emptyState: "Choose a course, date, and tee time to see the five-hour forecast window here.",
    missingForecast: "No forecast was available for the selected window. Try another date or tee time.",
    maxHourlyProbabilityLabel: "Hour with the highest chance of rain or snow",
    incompleteForecast: "Some precipitation forecasts are missing, so rain risk for the full round cannot be assessed. Incomplete summary metrics show —.",
    rainfallTotalLabel: "Precipitation across full hourly buckets",
    startTimeCardLabel: "Tee time",
    riskLabelPrefix: "Level",
    fiveHourWindowLabel: "Sum of overlapping full hourly forecasts; boundary hours may include precipitation outside your round.",
    courseSummaryPrefix: "Fetched at",
    fetchedAtLabel: "Fetched at",
    sourceLabel: "Source",
    probabilityLabel: "Rain / snow probability",
    footerSource: "Weather source: Open-Meteo Forecast API / Playing times use the course’s local time zone.",
    footerCourseData: "Course search: Photon / Overpass / © OpenStreetMap contributors (ODbL 1.0). Map names and locations may be outdated.",
    footerWarning: "Note: Forecasts are model output, not observed rain, and are not guaranteed. The app does not invent a whole-round probability.",
    riskLabels: { low: "Low", medium: "Moderate", high: "High", unknown: "Insufficient data" },
    riskSummaries: {
      unknown: "—",
      low: "The current forecast does not suggest a high rain risk, but a final check before departure is still a good idea.",
      medium: "Rain looks possible during some parts of the round, so bringing rain gear is sensible.",
      high: "You should plan for wet conditions, especially around the start of the round.",
    },
    sourceNotes: [
      "Temperature and wind are forecasts for each bucket's end time. Temperature is not feels-like temperature.",
      "Open-Meteo hourly precipitation probability applies to each one-hour forecast bucket. It is not a probability for the entire round.",
      "For half-hour tee times, the first and last hourly buckets only partially overlap the estimated five-hour round.",
    ],
  },
};

function formatFetchTime(isoString: string, language: Language, timezone: string) {
  const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "ja-JP";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
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
const savedCourseCopy = {
  zh: { remembered: "已记住此球场，下次访问会自动带入。", forget: "清除记忆" },
  ja: { remembered: "このコースをブラウザーに保存しました。次回も自動で表示します。", forget: "保存を解除" },
  en: { remembered: "Remembered in this browser for your next visit.", forget: "Forget course" },
};

export function GolfRainApp({ initialLanguage }: GolfRainAppProps) {
  const language = initialLanguage;
  const savedCourse = parseSavedCourse(useSyncExternalStore(subscribeSavedCourse, getSavedCourseSnapshot, getServerCourseSnapshot));
  const [editedQuery, setQuery] = useState<string | null>(null);
  const query = editedQuery ?? savedCourse?.name ?? "";
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [courseSelection, setSelectedCourse] = useState<GolfCourse | null | undefined>(undefined);
  const selectedCourse = courseSelection === undefined ? savedCourse : courseSelection;
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchFetchedAt, setSearchFetchedAt] = useState<string | null>(null);
  const [searchProvider, setSearchProvider] = useState<string | null>(null);
  const searchController = useRef<AbortController | null>(null);
  const searchSequence = useRef(0);

  const [forecastRequest] = useState(() => new LatestRequest());
  useEffect(() => () => {
    searchController.current?.abort();
    forecastRequest.cancel();
  }, [forecastRequest]);
  const [selectedDate, setSelectedDate] = useState("");
  const [teeTime, setTeeTime] = useState("08:30");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const courseKey = selectedCourse ? JSON.stringify(selectedCourse) : "";
  const [context, setContext] = useState<{
    key: string; timezone?: string; bounds?: ForecastDateBounds; error?: boolean;
  } | null>(null);
  const [contextRetry, setContextRetry] = useState(0);
  useEffect(() => {
    if (!courseKey) return;
    const controller = new AbortController();
    async function loadContext() {
      try {
        const response = await fetch("/api/course-context", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course: JSON.parse(courseKey) }), signal: controller.signal,
        });
        if (!response.ok) throw new Error("Course time zone unavailable");
        const payload = await response.json();
        if (!controller.signal.aborted) setContext({ key: courseKey, ...payload });
      } catch {
        if (!controller.signal.aborted) setContext({ key: courseKey, error: true });
      }
    }
    void loadContext();
    const timer = window.setInterval(() => void loadContext(), 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [courseKey, contextRetry]);
  const activeContext = context?.key === courseKey ? context : null;
  const timezone = activeContext?.timezone;
  const bounds = activeContext?.bounds ?? { minDate: "", maxDate: "" };
  const playDate = selectedDate >= bounds.minDate && selectedDate <= bounds.maxDate ? selectedDate : bounds.minDate;
  const localCopy = {
    zh: { waiting: "选择球场后显示当地时间", loading: "正在确认球场当地时间…", error: "无法确认球场时区，请重试。", retry: "重试", label: "球场当地时间" },
    ja: { waiting: "ゴルフ場を選ぶと現地時間を表示します", loading: "現地のタイムゾーンを確認中…", error: "タイムゾーンを確認できませんでした。", retry: "再試行", label: "ゴルフ場の現地時間" },
    en: { waiting: "Select a course to see local times", loading: "Checking course time zone…", error: "Could not determine the course time zone.", retry: "Retry", label: "Course local time" },
  }[language];
  const t = translations[language];
  const dateOptions = activeContext?.bounds ? getForecastDateOptions(bounds) : [];
  const dateFormatter = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : language === "ja" ? "ja-JP" : "en-US", {
    year: "numeric", month: "numeric", day: "numeric", weekday: "short", timeZone: "UTC",
  });
  const rainiestHour = forecast?.hours.find((hour) =>
    hour.precipitationProbability !== null &&
    hour.precipitationProbability === forecast.summary.highestHourlyProbability,
  );
  function invalidateForecast() {
    forecastRequest.cancel();
    setIsLoading(false);
    setForecast(null);
    setErrorMessage(null);
  }

  function handleQueryChange(value: string) {
    invalidateForecast();
    searchController.current?.abort();
    searchSequence.current += 1;
    setQuery(value);
    setCourses([]);
    setSelectedCourse(null);
    setForecast(null);
    setHasSearched(false);
    setIsSearching(false);
    setSearchError(null);
    setSearchFetchedAt(null);
    setSearchProvider(null);
    setErrorMessage(null);
  }

  async function handleCourseSearch() {
    invalidateForecast();
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const sequence = ++searchSequence.current;
    setIsSearching(true);
    setSearchError(null);
    setCourses([]);
    setSelectedCourse(null);
    setForecast(null);
    setErrorMessage(null);
    setHasSearched(false);
    setSearchFetchedAt(null);
    setSearchProvider(null);
    try {
      const response = await fetch(`/api/courses?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      const payload = await response.json() as { courses: GolfCourse[]; source: { fetchedAt: string; provider: string } };
      if (sequence !== searchSequence.current) return;
      if (!response.ok) {
        setSearchError(response.status === 429 ? t.searchRateLimit : t.searchError);
        return;
      }
      setCourses(payload.courses);
      setSearchFetchedAt(payload.source.fetchedAt);
      setSearchProvider(payload.source.provider);
      setHasSearched(true);
    } catch {
      if (!controller.signal.aborted && sequence === searchSequence.current) setSearchError(t.searchError);
    } finally {
      if (sequence === searchSequence.current) setIsSearching(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse || !timezone) return;
    const request = forecastRequest.start();
    setForecast(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        signal: request.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: selectedCourse, date: playDate, teeTime }),
      });
      const payload = (await response.json()) as ForecastResponse & {
        error?: string;
        bounds?: { minDate: string; maxDate: string };
      };

      if (!request.isCurrent()) return;
      if (!response.ok) {
        if (response.status === 422 && payload.bounds) {
          setContext({ key: courseKey, timezone, bounds: payload.bounds });
          setErrorMessage(t.dateRangeError(payload.bounds.minDate, payload.bounds.maxDate));
        } else {
          setErrorMessage(t.fetchError);
        }
        setForecast(null);
        return;
      }

      setForecast(payload);
    } catch {
      if (!request.isCurrent()) return;
      setErrorMessage(t.networkError);
      setForecast(null);
    } finally {
      if (request.isCurrent()) setIsLoading(false);
    }
  }

  return (
    <main lang={language === "zh" ? "zh-CN" : language} className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-sky-100 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{t.heroTitle}</h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-base">{t.heroBody}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
              <p className="break-words">{localCopy.label}: {timezone ?? (activeContext?.error ? "—" : selectedCourse ? localCopy.loading : localCopy.waiting)}</p>
              {timezone ? <p>{t.dateRangeLabel}: {bounds.minDate} 〜 {bounds.maxDate}</p> : null}
              {activeContext?.error ? <p role="alert">{localCopy.error} <button type="button" onClick={() => setContextRetry((value) => value + 1)} className="underline">{localCopy.retry}</button></p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <label htmlFor="course-search" className="text-sm font-medium text-slate-800">
              {t.searchLabel}
            </label>
            <input
              id="course-search"
              name="course-search"
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              maxLength={100}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (query.trim().length >= 2 && !isSearching) void handleCourseSearch();
                }
              }}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
            <button type="button" onClick={() => void handleCourseSearch()}
              disabled={query.trim().length < 2 || isSearching}
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {isSearching ? t.searchLoading : t.searchButton}
            </button>
            <p role="status" className="text-xs text-slate-500">
              {isSearching ? t.searchLoading : hasSearched ? t.searchHelp(courses.length) : t.searchIdle}
            </p>
            {searchError ? <p role="alert" className="text-sm text-rose-600">{searchError}</p> : null}
            {searchFetchedAt ? <p className="text-xs text-slate-500">
              {t.sourceLabel}: {searchProvider} · {t.fetchedAtLabel}: {formatFetchTime(searchFetchedAt, language, timezone ?? "UTC")} {timezone ?? "UTC"}
            </p> : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-slate-800">{t.candidatesLabel}</h2>
              {selectedCourse ? (
                <span className="text-xs text-slate-500">{t.selectedLabel}: {selectedCourse.name}</span>
              ) : null}
            </div>
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {courses.map((course) => {
                const isSelected = course.id === selectedCourse?.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { invalidateForecast(); setSelectedCourse(course); rememberCourse(course); }}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{course.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {course.address || course.prefecture}
                    </div>
                  </button>
                );
              })}
            </div>
            {hasSearched && courses.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {t.noCourseResult}
              </p>
            ) : null}
          </div>

          {selectedCourse ? (
            <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-950">
              <p className="font-semibold">{t.selectedLabel}: {selectedCourse.name}</p>
              <p className="mt-1">{selectedCourse.address}</p>
              <a href={selectedCourse.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">
                OpenStreetMap ↗ ({selectedCourse.latitude.toFixed(5)}, {selectedCourse.longitude.toFixed(5)})
              </a>
              {savedCourse?.id === selectedCourse.id ? <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 text-xs text-sky-800">
                <p>{savedCourseCopy[language].remembered}</p>
                <button type="button" disabled={isLoading} onClick={() => { setSelectedCourse(selectedCourse); setQuery(query); rememberCourse(null); }}
                  className="min-h-11 underline underline-offset-4 disabled:opacity-50">{savedCourseCopy[language].forget}</button>
              </div> : null}
            </div>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <label htmlFor="play-date" className="block text-sm font-medium text-slate-800">
                {t.playDateLabel}
              </label>
              <select
                id="play-date"
                value={playDate}
                disabled={!timezone}
                onChange={(event) => { invalidateForecast(); setSelectedDate(event.target.value); }}
                className="round-input rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                {dateOptions.map((date) => <option key={date} value={date}>
                  {dateFormatter.format(new Date(`${date}T00:00:00Z`))}
                </option>)}
              </select>
            </div>
            <div className="min-w-0 space-y-2">
              <label htmlFor="tee-time" className="block text-sm font-medium text-slate-800">
                {t.teeTimeLabel}
              </label>
              <select
                id="tee-time"
                disabled={!timezone}
                value={teeTime}
                onChange={(event) => { invalidateForecast(); setTeeTime(event.target.value); }}
                className="round-input rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
            <p>{t.roundEstimateLabel(ROUND_DURATION_HOURS)}</p>
            <p>{t.unitsLabel}</p>
          </div>

          <button
            type="submit"
            disabled={!selectedCourse || !timezone || isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t.submitLoading : t.submitIdle}
          </button>

          <div aria-live="polite" className="min-h-6 text-sm">
            {errorMessage ? <p className="text-rose-600">{errorMessage}</p> : null}
          </div>
        </form>

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {!forecast ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              {t.emptyState}
            </div>
          ) : forecast.missingForecast ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              {t.missingForecast}
            </div>
          ) : (
            <div className="space-y-5">
              {forecast.summary.incomplete ? <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.incompleteForecast}</p> : null}
              <HourlyWeather timezone={forecast.timezone} language={language} hours={forecast.hours} roundContext={
                <div className="space-y-3 py-2">
                  <div className="space-y-1 text-xs leading-5 text-slate-500">
                    <p className="text-sm font-medium break-words text-slate-800">{forecast.course.name}</p>
                    <p className="flex flex-wrap gap-x-2 tabular-nums">
                      <span>{forecast.round.start.slice(0, 10)}</span>
                      <span>{forecast.round.start.slice(11, 16)}–{forecast.round.end.slice(11, 16)} {forecast.timezone} · {forecast.round.estimatedDurationHours} h</span>
                    </p>
                    <p>{t.fetchedAtLabel}: {formatFetchTime(forecast.source.fetchedAt, language, forecast.timezone)} {forecast.timezone} · {forecast.source.provider}</p>
                  </div>
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm leading-6 font-medium text-emerald-950">
                    {formatRoundPreparation(forecast.clothing, language)}
                  </p>
                </div>
              } />

              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-700">{t.maxHourlyProbabilityLabel}</div>
                  {rainiestHour ? <div className="mt-2 text-sm text-sky-800">{rainiestHour.bucketStart}–{rainiestHour.bucketEnd} {forecast.timezone}</div> : null}
                  <div className="mt-2 text-3xl font-semibold text-sky-900">{rainiestHour ? `${rainiestHour.precipitationProbability}%` : "—"}</div>
                  <div className="mt-1 text-sm text-sky-700">{t.probabilityLabel}</div>
                </article>
                <article className="rounded-2xl bg-sky-50 p-4 text-sky-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-700">{t.rainfallTotalLabel}</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.summary.totalPrecipitationMm ?? "—"} mm</div>
                  <div className="mt-1 text-sm text-sky-700">{t.fiveHourWindowLabel}</div>
                </article>
                <article className="rounded-2xl bg-emerald-50 p-4 text-emerald-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">{t.startTimeCardLabel}</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.round.teeTime}</div>
                  <div className="mt-1 text-sm text-emerald-700">{forecast.round.estimatedDurationHours} h</div>
                </article>
              </div>

              <ClothingAdvice language={language} advice={forecast.clothing} />

              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                {t.sourceNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600 shadow-sm sm:px-6">
        <p>{t.footerSource}</p>
        <p>{t.footerCourseData} <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://github.com/komoot/photon" className="underline" target="_blank" rel="noreferrer">Photon</a></p>
        <p>{t.footerWarning}</p>
      </footer>
      <footer lang="en" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center text-xs leading-5 text-slate-600 backdrop-blur">
        <p>© 2026 Purumomo. All rights reserved. Powered by Purumomo AI Technologies.</p>
      </footer>
    </main>
  );
}
