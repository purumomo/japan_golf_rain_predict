const JST_OFFSET_HOURS = 9;

export const ROUND_DURATION_HOURS = 5;
export const FORECAST_HORIZON_DAYS = 7;
export const TIMEZONE = "Asia/Tokyo";

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

export function getForecastDateBounds(referenceDate = new Date()): ForecastDateBounds {
  const parts = getJstCalendarParts(referenceDate);
  const today = formatDateParts(parts.year, parts.month, parts.day);
  const minDate = addDaysToYmd(today, 1);
  const maxDate = addDaysToYmd(today, FORECAST_HORIZON_DAYS - 1);

  return { minDate, maxDate };
}

export function getForecastDateOptions({ minDate, maxDate }: ForecastDateBounds) {
  const dates: string[] = [];
  for (let date = minDate; date <= maxDate; date = addDaysToYmd(date, 1)) {
    dates.push(date);
  }
  return dates;
}
