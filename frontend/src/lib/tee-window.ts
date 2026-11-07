export const ROUND_DURATION_HOURS = 5;

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

export function addDaysToYmd(yMd: string, daysToAdd: number) {
  const [year, month, day] = yMd.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + daysToAdd);

  return formatDateParts(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

export function getForecastDateOptions({ minDate, maxDate }: ForecastDateBounds) {
  const dates: string[] = [];
  for (let date = minDate; date <= maxDate; date = addDaysToYmd(date, 1)) {
    dates.push(date);
  }
  return dates;
}
