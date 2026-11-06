"use client";

import { useEffect, useRef, useState } from "react";

import type { GolfCourse } from "@/lib/courses";
import { ROUND_DURATION_HOURS } from "@/lib/tee-window";

type Language = "ja" | "zh" | "en";
type RiskLevel = "low" | "medium" | "high";

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
    riskLevel: RiskLevel;
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
  bounds: {
    minDate: string;
    maxDate: string;
  };
  initialLanguage: Language;
};

type TranslationSet = {
  langLabel: string;
  productBadge: string;
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
  maxHourlyProbabilityLabel: string;
  rainfallTotalLabel: string;
  startTimeCardLabel: string;
  riskLabelPrefix: string;
  fiveHourWindowLabel: string;
  courseSummaryPrefix: string;
  fetchedAtLabel: string;
  sourceLabel: string;
  timelineTitle: string;
  partialOverlapLabel: (minutes: number) => string;
  fullOverlapLabel: string;
  probabilityLabel: string;
  precipitationLabel: string;
  windLabel: string;
  footerSource: string;
  footerCourseData: string;
  footerWarning: string;
  riskLabels: Record<RiskLevel, string>;
  riskSummaries: Record<RiskLevel, string>;
  sourceNotes: string[];
};

const translations: Record<Language, TranslationSet> = {
  ja: {
    langLabel: "表示言語",
    productBadge: "Golf Rain MVP",
    heroTitle: "空を読んで、ナイスショット。",
    heroBody:
      "ゴルフ場とプレー日、スタート時間を選ぶと、約5時間のラウンド中の降水確率・降水量・風速を1時間ごとに確認できます。",
    timezoneLabel: "タイムゾーン",
    dateRangeLabel: "対象日",
    searchLabel: "ゴルフ場を検索",
    searchButton: "検索",
    searchLoading: "検索中...",
    searchIdle: "ゴルフ場名を入力して検索してください。住所や地図を確認して、お探しのゴルフ場を選んでください。",
    searchError: "ゴルフ場を検索できませんでした。しばらくしてから、もう一度お試しください。",
    searchRateLimit: "検索が混み合っています。少し待ってから再試行してください。",
    searchPlaceholder: "例: 太平洋クラブ 市原、PGM総成",
    searchHelp: (count) => `${count}件のゴルフ場が見つかりました。見つからない場合は、日本語のゴルフ場名に都道府県名を加えて検索してみてください。`,
    selectedLabel: "選択中",
    candidatesLabel: "候補コース",
    noCourseResult: "ゴルフ場が見つかりませんでした。名前の一部や都道府県名を入れて、もう一度検索してください。",
    playDateLabel: "プレー日",
    teeTimeLabel: "スタート時間",
    roundEstimateLabel: (hours) => `ラウンド時間の目安：スタートから${hours}時間`,
    unitsLabel: "表示内容：1時間ごとの降水確率・降水量・地上10mの風速",
    submitIdle: "雨リスクを確認する",
    submitLoading: "予報を取得中...",
    dateRangeError: (minDate, maxDate) => `${minDate}から${maxDate}までの日付を選んでください。`,
    fetchError: "天気予報の取得に失敗しました。少し待ってから再試行してください。",
    networkError: "通信エラーが発生しました。ネットワーク接続を確認してください。",
    summaryTitle: "ラウンド中の天気予報",
    summaryBody: "ラウンド中の各時間帯のうち、最も高い降水確率を表示しています。5時間のラウンド全体で雨が降る確率を表すものではありません。",
    emptyState: "ゴルフ場・プレー日・スタート時間を選ぶと、ここにスタートから5時間分の予報が表示されます。",
    missingForecast: "選択した時間帯の予報が見つかりませんでした。日付かスタート時間を変えて再試行してください。",
    maxHourlyProbabilityLabel: "時間ごとの降水確率の最大値",
    rainfallTotalLabel: "累積降水量",
    startTimeCardLabel: "スタート時間",
    riskLabelPrefix: "雨のリスク",
    fiveHourWindowLabel: "予報の対象時間（約5時間）",
    courseSummaryPrefix: "取得時刻",
    fetchedAtLabel: "取得時刻",
    sourceLabel: "予報の提供元",
    timelineTitle: "時間別タイムライン",
    partialOverlapLabel: (minutes) => `ラウンドと ${minutes} 分だけ重なる時間帯`,
    fullOverlapLabel: "ラウンドと 60 分重なる時間帯",
    probabilityLabel: "降水確率",
    precipitationLabel: "降水量",
    windLabel: "風速",
    footerSource: "天気予報の提供元：Open-Meteo Forecast API / 時刻はすべて日本標準時（JST）で表示しています。",
    footerCourseData: "ゴルフ場検索：Photon / Overpass / © OpenStreetMap contributors（ODbL 1.0）。地図上の名称や位置が最新でない場合があります。",
    footerWarning: "注意: 予報はモデル出力であり、実測や的中保証ではありません。独自のラウンド全体降水確率は表示していません。",
    riskLabels: { low: "低め", medium: "やや高め", high: "高め" },
    riskSummaries: {
      low: "今の予報では大雨リスクは高くありません。直前に再確認するのがおすすめです。",
      medium: "時間帯によっては雨が降る可能性があります。レインウェアを用意しておくと安心です。",
      high: "雨を見込んだ準備が必要そうです。スタート前後の時間帯は特に確認してください。",
    },
    sourceNotes: [
      "Open-Meteo の時間別降水確率は、各 1 時間区間の予報値です。ラウンド全体の降雨確率ではありません。",
      "30 分刻みのスタート時刻では、最初と最後の時間帯が 5 時間ラウンドと部分的に重なります。",
    ],
  },
  zh: {
    langLabel: "显示语言",
    productBadge: "Golf Rain MVP",
    heroTitle: "看准天气，挥出好球。",
    heroBody:
      "搜索并选择日本的真实球场、出发日期和开球时间后，即可查看按 5 小时一轮估算的逐小时降水概率、降水量和风速。",
    timezoneLabel: "时区",
    dateRangeLabel: "可选日期",
    searchLabel: "搜索高尔夫球场",
    searchButton: "搜索球场",
    searchLoading: "正在搜索...",
    searchIdle: "输入球场名称并搜索，核对候选球场的地址和地图后选择。",
    searchError: "球场搜索失败，请稍后重试。",
    searchRateLimit: "搜索请求较频繁，请稍等后重试。",
    searchPlaceholder: "例如：太平洋クラブ 市原、PGM総成",
    searchHelp: (count) => `${count} 个候选结果。建议使用日文球场名，可加都县名缩小范围。`,
    selectedLabel: "当前选择",
    candidatesLabel: "候选球场",
    noCourseResult: "没有找到匹配球场，请尝试其他写法。",
    playDateLabel: "打球日期",
    teeTimeLabel: "开球时间",
    roundEstimateLabel: (hours) => `回合估算：从开球起 ${hours} 小时`,
    unitsLabel: "显示内容：逐小时降水概率、降水量、10m 风速",
    submitIdle: "查看降雨风险",
    submitLoading: "正在获取预报...",
    dateRangeError: (minDate, maxDate) => `支持的日期范围为 ${minDate} 到 ${maxDate}。`,
    fetchError: "天气预报获取失败，请稍后重试。",
    networkError: "发生网络错误，请检查连接。",
    summaryTitle: "预报摘要",
    summaryBody: "这里显示的是“最高逐小时降水概率”，并不是“5 小时整轮的降雨概率”。",
    emptyState: "选择球场、日期和开球时间后，这里会显示 5 小时窗口的预报。",
    missingForecast: "未找到所选时间段的预报，请更换日期或开球时间后重试。",
    maxHourlyProbabilityLabel: "最高逐小时降水概率",
    rainfallTotalLabel: "累计降水量",
    startTimeCardLabel: "开球时间",
    riskLabelPrefix: "级别",
    fiveHourWindowLabel: "5 小时估算窗口",
    courseSummaryPrefix: "获取时间",
    fetchedAtLabel: "获取时间",
    sourceLabel: "数据来源",
    timelineTitle: "逐小时时间线",
    partialOverlapLabel: (minutes) => `该时段仅与本轮重叠 ${minutes} 分钟`,
    fullOverlapLabel: "该时段与本轮完整重叠 60 分钟",
    probabilityLabel: "降水概率",
    precipitationLabel: "降水量",
    windLabel: "风速",
    footerSource: "天气来源：Open-Meteo Forecast API / 所有显示时间均为 JST。",
    footerCourseData: "球场搜索：Photon / Overpass / © OpenStreetMap contributors（ODbL 1.0）。地图名称和位置可能更新滞后。",
    footerWarning: "注意：预报属于模型输出，并非实测，也不保证准确。页面不会生成自定义的整轮降雨概率。",
    riskLabels: { low: "较低", medium: "中等", high: "较高" },
    riskSummaries: {
      low: "当前预报下强降雨风险不高，但仍建议在出发前再次确认。",
      medium: "部分时段可能下雨，建议按需要携带雨具。",
      high: "看起来需要按有雨准备，尤其建议重点关注开球前后的时段。",
    },
    sourceNotes: [
      "Open-Meteo 的逐小时降水概率表示各 1 小时时段的预报值，不代表整轮打球期间的总体降雨概率。",
      "如果开球时间是半点，首尾两个小时段只会与 5 小时回合部分重叠。",
    ],
  },
  en: {
    langLabel: "Language",
    productBadge: "Golf Rain MVP",
    heroTitle: "Read the sky. Own your swing.",
    heroBody:
      "Search for a golf course in Japan, then choose a play date, and a tee time to see hourly precipitation probability, precipitation amount, and wind speed for an estimated five-hour round.",
    timezoneLabel: "Time zone",
    dateRangeLabel: "Available dates",
    searchLabel: "Search golf courses",
    searchButton: "Search",
    searchLoading: "Searching...",
    searchIdle: "Search by course name, then check its address and map before selecting.",
    searchError: "Course search failed. Please try again shortly.",
    searchRateLimit: "Search is busy. Please wait a moment and retry.",
    searchPlaceholder: "Example: 太平洋クラブ 市原, PGM総成",
    searchHelp: (count) => `${count} candidates. Try the Japanese course name and prefecture for better matches.`,
    selectedLabel: "Selected",
    candidatesLabel: "Course options",
    noCourseResult: "No matching course found. Try another spelling.",
    playDateLabel: "Play date",
    teeTimeLabel: "Tee time",
    roundEstimateLabel: (hours) => `Round estimate: ${hours} hours from tee-off`,
    unitsLabel: "Shown per hour: precipitation probability, precipitation amount, and 10m wind speed",
    submitIdle: "Check rain risk",
    submitLoading: "Loading forecast...",
    dateRangeError: (minDate, maxDate) => `Supported dates run from ${minDate} to ${maxDate}.`,
    fetchError: "Forecast lookup failed. Please try again shortly.",
    networkError: "A network error occurred. Please check your connection.",
    summaryTitle: "Forecast summary",
    summaryBody: "This highlights the maximum hourly precipitation probability. It is not a probability for rain across the whole five-hour round.",
    emptyState: "Choose a course, date, and tee time to see the five-hour forecast window here.",
    missingForecast: "No forecast was available for the selected window. Try another date or tee time.",
    maxHourlyProbabilityLabel: "Max hourly rain probability",
    rainfallTotalLabel: "Total precipitation",
    startTimeCardLabel: "Tee time",
    riskLabelPrefix: "Level",
    fiveHourWindowLabel: "Estimated five-hour window",
    courseSummaryPrefix: "Fetched at",
    fetchedAtLabel: "Fetched at",
    sourceLabel: "Source",
    timelineTitle: "Hourly timeline",
    partialOverlapLabel: (minutes) => `This hour overlaps the round by ${minutes} minutes`,
    fullOverlapLabel: "This hour overlaps the round by a full 60 minutes",
    probabilityLabel: "Rain probability",
    precipitationLabel: "Precipitation",
    windLabel: "Wind speed",
    footerSource: "Weather source: Open-Meteo Forecast API / All displayed times use JST.",
    footerCourseData: "Course search: Photon / Overpass / © OpenStreetMap contributors (ODbL 1.0). Map names and locations may be outdated.",
    footerWarning: "Note: Forecasts are model output, not observed rain, and are not guaranteed. The app does not invent a whole-round probability.",
    riskLabels: { low: "Low", medium: "Moderate", high: "High" },
    riskSummaries: {
      low: "The current forecast does not suggest a high rain risk, but a final check before departure is still a good idea.",
      medium: "Rain looks possible during some parts of the round, so bringing rain gear is sensible.",
      high: "You should plan for wet conditions, especially around the start of the round.",
    },
    sourceNotes: [
      "Open-Meteo hourly precipitation probability applies to each one-hour forecast bucket. It is not a probability for the entire round.",
      "For half-hour tee times, the first and last hourly buckets only partially overlap the estimated five-hour round.",
    ],
  },
};

function formatFetchTime(isoString: string, language: Language) {
  const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "ja-JP";

  return new Intl.DateTimeFormat(locale, {
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

export function GolfRainApp({ bounds, initialLanguage }: GolfRainAppProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchFetchedAt, setSearchFetchedAt] = useState<string | null>(null);
  const [searchProvider, setSearchProvider] = useState<string | null>(null);
  const searchController = useRef<AbortController | null>(null);
  const searchSequence = useRef(0);

  useEffect(() => () => searchController.current?.abort(), []);
  const [selectedDate, setSelectedDate] = useState(bounds.minDate);
  const [teeTime, setTeeTime] = useState("08:30");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language];
  function handleQueryChange(value: string) {
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

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: selectedCourse, date: selectedDate, teeTime }),
      });
      const payload = (await response.json()) as ForecastResponse & {
        error?: string;
        bounds?: { minDate: string; maxDate: string };
      };

      if (!response.ok) {
        if (response.status === 422 && payload.bounds) {
          setErrorMessage(t.dateRangeError(payload.bounds.minDate, payload.bounds.maxDate));
        } else {
          setErrorMessage(t.fetchError);
        }
        setForecast(null);
        return;
      }

      setForecast(payload);
    } catch {
      setErrorMessage(t.networkError);
      setForecast(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-sky-100 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              {t.productBadge}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{t.heroTitle}</h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-base">{t.heroBody}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span className="font-medium">{t.langLabel}</span>
              {([
                ["ja", "日本語"],
                ["zh", "中文"],
                ["en", "English"],
              ] as const).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`rounded-full px-3 py-1 transition ${
                    language === code ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-100">
              <p>{t.timezoneLabel}: Asia/Tokyo</p>
              <p>{t.dateRangeLabel}: {bounds.minDate} 〜 {bounds.maxDate}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
              disabled={isLoading}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (query.trim().length >= 2 && !isSearching && !isLoading) void handleCourseSearch();
                }
              }}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
            <button type="button" onClick={() => void handleCourseSearch()}
              disabled={query.trim().length < 2 || isSearching || isLoading}
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {isSearching ? t.searchLoading : t.searchButton}
            </button>
            <p role="status" className="text-xs text-slate-500">
              {isSearching ? t.searchLoading : hasSearched ? t.searchHelp(courses.length) : t.searchIdle}
            </p>
            {searchError ? <p role="alert" className="text-sm text-rose-600">{searchError}</p> : null}
            {searchFetchedAt ? <p className="text-xs text-slate-500">
              {t.sourceLabel}: {searchProvider} · {t.fetchedAtLabel}: {formatFetchTime(searchFetchedAt, language)}
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
                    disabled={isLoading}
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedCourse(course); setForecast(null); setErrorMessage(null); }}
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
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="play-date" className="text-sm font-medium text-slate-800">
                {t.playDateLabel}
              </label>
              <input
                id="play-date"
                type="date"
                disabled={isLoading}
                value={selectedDate}
                min={bounds.minDate}
                max={bounds.maxDate}
                onChange={(event) => { setSelectedDate(event.target.value); setForecast(null); setErrorMessage(null); }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tee-time" className="text-sm font-medium text-slate-800">
                {t.teeTimeLabel}
              </label>
              <select
                id="tee-time"
                disabled={isLoading}
                value={teeTime}
                onChange={(event) => { setTeeTime(event.target.value); setForecast(null); setErrorMessage(null); }}
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
            <p>{t.roundEstimateLabel(ROUND_DURATION_HOURS)}</p>
            <p>{t.unitsLabel}</p>
          </div>

          <button
            type="submit"
            disabled={!selectedCourse || isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t.submitLoading : t.submitIdle}
          </button>

          <div aria-live="polite" className="min-h-6 text-sm">
            {errorMessage ? <p className="text-rose-600">{errorMessage}</p> : null}
          </div>
        </form>

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">{t.summaryTitle}</h2>
            <p className="text-sm leading-6 text-slate-600">{t.summaryBody}</p>
          </div>

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
              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">{t.maxHourlyProbabilityLabel}</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.summary.highestHourlyProbability}%</div>
                  <div className="mt-1 text-sm text-slate-300">{t.riskLabelPrefix}: {t.riskLabels[forecast.summary.riskLevel]}</div>
                </article>
                <article className="rounded-2xl bg-sky-50 p-4 text-sky-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-700">{t.rainfallTotalLabel}</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.summary.totalPrecipitationMm} mm</div>
                  <div className="mt-1 text-sm text-sky-700">{t.fiveHourWindowLabel}</div>
                </article>
                <article className="rounded-2xl bg-emerald-50 p-4 text-emerald-950">
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">{t.startTimeCardLabel}</div>
                  <div className="mt-2 text-3xl font-semibold">{forecast.round.teeTime}</div>
                  <div className="mt-1 text-sm text-emerald-700">{forecast.round.estimatedDurationHours} h</div>
                </article>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p className="font-medium text-slate-900">{forecast.course.name}</p>
                <p>{t.riskSummaries[forecast.summary.riskLevel]}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {t.fetchedAtLabel}: {formatFetchTime(forecast.source.fetchedAt, language)} / {t.sourceLabel}: {forecast.source.provider}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">{t.timelineTitle}</h3>
                <div className="grid gap-3">
                  {forecast.hours.map((hour) => (
                    <article key={hour.time} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-base font-semibold text-slate-900">
                            {hour.bucketStart}–{hour.bucketEnd}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {hour.isPartialHour ? t.partialOverlapLabel(hour.overlapMinutes) : t.fullOverlapLabel}
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
                          <dt className="text-slate-500">{t.probabilityLabel}</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.precipitationProbability ?? "—"}%</dd>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <dt className="text-slate-500">{t.precipitationLabel}</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.precipitationMm ?? "—"} mm</dd>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <dt className="text-slate-500">{t.windLabel}</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{hour.windSpeedKmh ?? "—"} km/h</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </div>

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
    </main>
  );
}
