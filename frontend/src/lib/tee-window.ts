const JST_OFFSET_HOURS = 9;

export const ROUND_DURATION_HOURS = 5;
export const FORECAST_HORIZON_DAYS = 7;
export const TIMEZONE = "Asia/Tokyo";

export type HourlyForecastEntry = {
  time: string;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
};

export type ForecastWindowHour = {
  time: string;
  bucketStart: string;
  bucketEnd: string;
  overlapMinutes: number;
  isPartialHour: boolean;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
};

export type ForecastDateBounds = {
  minDate: string;
  maxDate: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateParts(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getJstCalendarParts(referenceDate: Date) {
  const jstDate = new Date(referenceDate.getTime() + JST_OFFSET_HOURS * 60 * 60 * 1000);

  return {
    year: jstDate.getUTCFullYear(),
    month: jstDate.getUTCMonth() + 1,
    day: jstDate.getUTCDate(),
    hour: jstDate.getUTCHours(),
    minute: jstDate.getUTCMinutes(),
  };
}

export function addDaysToYmd(yMd: string, daysToAdd: number) {
  const [year, month, day] = yMd.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + daysToAdd);

  return formatDateParts(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

function toUtcDateAtJst(yMd: string, hhMm: string) {
  const [year, month, day] = yMd.split("-").map(Number);
  const [hour, minute] = hhMm.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour - JST_OFFSET_HOURS, minute));
}

function parseHourlyTimestampToUtc(timestamp: string) {
  const [datePart, timePart] = timestamp.split("T");
  return toUtcDateAtJst(datePart, timePart);
}

function formatTimeRange(date: Date) {
  const parts = getJstCalendarParts(date);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function getReferenceDateInJst(referenceDate = new Date()) {
  return new Date(referenceDate.getTime() + JST_OFFSET_HOURS * 60 * 60 * 1000);
}

export function getForecastDateBounds(referenceDate = new Date()): ForecastDateBounds {
  const parts = getJstCalendarParts(referenceDate);
  const today = formatDateParts(parts.year, parts.month, parts.day);
  const minDate = addDaysToYmd(today, 1);
  const maxDate = addDaysToYmd(today, FORECAST_HORIZON_DAYS - 1);

  return { minDate, maxDate };
}

export function isSupportedForecastDate(yMd: string, referenceDate = new Date()) {
  const bounds = getForecastDateBounds(referenceDate);
  return yMd >= bounds.minDate && yMd <= bounds.maxDate;
}

export function getDefaultForecastDate(referenceDate = new Date()) {
  return getForecastDateBounds(referenceDate).minDate;
}

export function buildRoundWindow(yMd: string, teeTime: string, roundHours = ROUND_DURATION_HOURS) {
  const start = toUtcDateAtJst(yMd, teeTime);
  const end = new Date(start.getTime() + roundHours * 60 * 60 * 1000);
  const endParts = getJstCalendarParts(end);

  return {
    start,
    end,
    roundHours,
    teeTime,
    startLabel: `${yMd}T${teeTime}`,
    endLabel: `${formatDateParts(endParts.year, endParts.month, endParts.day)}T${pad(endParts.hour)}:${pad(endParts.minute)}`,
  };
}

export function selectOverlappingHours(
  hourlyEntries: HourlyForecastEntry[],
  yMd: string,
  teeTime: string,
  roundHours = ROUND_DURATION_HOURS,
) {
  const roundWindow = buildRoundWindow(yMd, teeTime, roundHours);

  return hourlyEntries.flatMap<ForecastWindowHour>((entry) => {
    const bucketEndUtc = parseHourlyTimestampToUtc(entry.time);
    const bucketStartUtc = new Date(bucketEndUtc.getTime() - 60 * 60 * 1000);
    const overlapStart = Math.max(bucketStartUtc.getTime(), roundWindow.start.getTime());
    const overlapEnd = Math.min(bucketEndUtc.getTime(), roundWindow.end.getTime());
    const overlapMinutes = Math.max(0, Math.round((overlapEnd - overlapStart) / 60000));

    if (overlapMinutes <= 0) {
      return [];
    }

    return [
      {
        time: entry.time,
        bucketStart: formatTimeRange(bucketStartUtc),
        bucketEnd: formatTimeRange(bucketEndUtc),
        overlapMinutes,
        isPartialHour: overlapMinutes < 60,
        precipitationProbability: entry.precipitationProbability,
        precipitationMm: entry.precipitationMm,
        windSpeedKmh: entry.windSpeedKmh,
      },
    ];
  });
}

export function summarizeRisk(hours: ForecastWindowHour[]) {
  const highestHourlyProbability = hours.reduce<number>(
    (highest, hour) => Math.max(highest, hour.precipitationProbability ?? 0),
    0,
  );
  const totalPrecipitationMm = Number(
    hours.reduce((sum, hour) => sum + (hour.precipitationMm ?? 0), 0).toFixed(1),
  );

  let riskLabel = "低め";
  let summary = "今の予報では大雨リスクは高くありません。直前に再確認するのがおすすめです。";

  if (highestHourlyProbability >= 70 || totalPrecipitationMm >= 4) {
    riskLabel = "高め";
    summary = "雨を見込んだ準備が必要そうです。スタート前後の時間帯は特に確認してください。";
  } else if (highestHourlyProbability >= 40 || totalPrecipitationMm >= 1) {
    riskLabel = "やや高め";
    summary = "時間帯によって降る可能性があります。レインウェアを持つ前提で見ると安心です。";
  }

  return {
    highestHourlyProbability,
    totalPrecipitationMm,
    riskLabel,
    summary,
  };
}
