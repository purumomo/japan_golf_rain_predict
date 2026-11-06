import { NextResponse } from "next/server";

import { getCourseById } from "@/lib/courses";
import { fetchForecastWindow } from "@/lib/open-meteo";
import { ROUND_DURATION_HOURS, TIMEZONE, buildRoundWindow, getForecastDateBounds, isSupportedForecastDate } from "@/lib/tee-window";

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const date = searchParams.get("date");
  const teeTime = searchParams.get("teeTime");

  if (!courseId || !date || !teeTime) {
    return jsonError(400, "Missing required query parameters.");
  }

  const course = getCourseById(courseId);

  if (!course) {
    return jsonError(404, "Selected course was not found.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(teeTime)) {
    return jsonError(400, "Date or tee time format is invalid.");
  }

  if (!isSupportedForecastDate(date)) {
    return jsonError(422, "Selected date is outside the supported forecast range.", {
      bounds: getForecastDateBounds(),
    });
  }

  try {
    const forecast = await fetchForecastWindow({
      latitude: course.latitude,
      longitude: course.longitude,
      date,
      teeTime,
    });

    const roundWindow = buildRoundWindow(date, teeTime, ROUND_DURATION_HOURS);

    return NextResponse.json({
      course,
      timezone: TIMEZONE,
      round: {
        estimatedDurationHours: ROUND_DURATION_HOURS,
        teeTime,
        start: roundWindow.startLabel,
        end: roundWindow.endLabel,
      },
      source: {
        provider: "Open-Meteo Forecast API",
        fetchedAt: new Date().toISOString(),
        notes: [
          "Open-Meteo の時間別降水確率は、各 1 時間区間の予報値です。ラウンド全体の降雨確率ではありません。",
          "30 分刻みのスタート時刻では、最初と最後の時間帯が 5 時間ラウンドと部分的に重なります。",
        ],
      },
      bounds: getForecastDateBounds(),
      summary: forecast.summary,
      hours: forecast.hours,
      missingForecast: forecast.hours.length === 0,
    });
  } catch (error) {
    return jsonError(502, "Forecast lookup failed. Please try again shortly.", {
      details: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
