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
                    "playStart": max(bucket_start, start).strftime("%H:%M"),
                    "playEnd": min(bucket_end, end).strftime("%H:%M"),
                    "overlapMinutes": minutes,
                    "isPartialHour": minutes < 60,
                }
            )
    return hours


def summarize_risk(hours):
    """Summarize complete hourly data without treating missing values as dry weather."""
    coverage_complete = sum(hour["overlapMinutes"] for hour in hours) == ROUND_DURATION_HOURS * 60
    probability_complete = coverage_complete and all(
        hour["precipitationProbability"] is not None for hour in hours
    )
    rainfall_complete = coverage_complete and all(hour["precipitationMm"] is not None for hour in hours)
    probability = max(hour["precipitationProbability"] for hour in hours) if probability_complete else None
    # Sum full source buckets, including the portions outside a half-hour round boundary.
    rainfall = round(sum(hour["precipitationMm"] for hour in hours), 1) if rainfall_complete else None
    incomplete = not (probability_complete and rainfall_complete)
    risk = "unknown" if incomplete else "low"
    if not incomplete:
        if probability >= 70 or rainfall >= 4:
            risk = "high"
        elif probability >= 40 or rainfall >= 1:
            risk = "medium"
    return {
        "highestHourlyProbability": probability,
        "totalPrecipitationMm": rainfall,
        "riskLevel": risk,
        "incomplete": incomplete,
    }
