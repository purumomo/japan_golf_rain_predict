from datetime import datetime, timedelta, timezone

TIMEZONE = "Asia/Tokyo"
JST = timezone(timedelta(hours=9), TIMEZONE)
ROUND_DURATION_HOURS = 5
FORECAST_HORIZON_DAYS = 7


def forecast_bounds(reference=None):
    today = (reference or datetime.now(timezone.utc)).astimezone(JST).date()
    return {
        "minDate": (today + timedelta(days=1)).isoformat(),
        "maxDate": (today + timedelta(days=FORECAST_HORIZON_DAYS - 1)).isoformat(),
    }


def build_round_window(date, tee_time, round_hours=ROUND_DURATION_HOURS):
    start = datetime.fromisoformat(f"{date}T{tee_time}").replace(tzinfo=JST)
    return start, start + timedelta(hours=round_hours)


def select_overlapping_hours(entries, date, tee_time, round_hours=ROUND_DURATION_HOURS):
    start, end = build_round_window(date, tee_time, round_hours)
    hours = []
    for entry in entries:
        bucket_end = datetime.fromisoformat(entry["time"]).replace(tzinfo=JST)
        bucket_start = bucket_end - timedelta(hours=1)
        minutes = max(0, int((min(bucket_end, end) - max(bucket_start, start)).total_seconds() / 60))
        if minutes:
            hours.append(
                {
                    **entry,
                    "bucketStart": bucket_start.strftime("%H:%M"),
                    "bucketEnd": bucket_end.strftime("%H:%M"),
                    "overlapMinutes": minutes,
                    "isPartialHour": minutes < 60,
                }
            )
    return hours


def summarize_risk(hours):
    probability = max((hour["precipitationProbability"] or 0 for hour in hours), default=0)
    rainfall = round(sum(hour["precipitationMm"] or 0 for hour in hours), 1)
    risk = "low"
    if probability >= 70 or rainfall >= 4:
        risk = "high"
    elif probability >= 40 or rainfall >= 1:
        risk = "medium"
    return {"highestHourlyProbability": probability, "totalPrecipitationMm": rainfall, "riskLevel": risk}
