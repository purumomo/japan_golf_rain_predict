from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

TIMEZONE = "Asia/Tokyo"
ROUND_DURATION_HOURS = 5
FORECAST_HORIZON_DAYS = 7


def forecast_bounds(reference=None, timezone_name=TIMEZONE):
    today = (reference or datetime.now(timezone.utc)).astimezone(ZoneInfo(timezone_name)).date()
    return {
        "minDate": (today + timedelta(days=1)).isoformat(),
        "maxDate": (today + timedelta(days=FORECAST_HORIZON_DAYS - 1)).isoformat(),
    }


def build_round_window(date, tee_time, round_hours=ROUND_DURATION_HOURS, timezone_name=TIMEZONE):
    zone = ZoneInfo(timezone_name)
    wall = datetime.fromisoformat(f"{date}T{tee_time}")
    candidates = set()
    for fold in (0, 1):
        instant = wall.replace(tzinfo=zone, fold=fold).astimezone(timezone.utc)
        if instant.astimezone(zone).replace(tzinfo=None) == wall:
            candidates.add(instant)
    if len(candidates) != 1:
        raise ValueError("Tee time is ambiguous or does not exist in the course time zone.")
    start = candidates.pop()
    return start.astimezone(zone), (start + timedelta(hours=round_hours)).astimezone(zone)


def select_overlapping_hours(entries, date, tee_time, round_hours=ROUND_DURATION_HOURS,
                             timezone_name=TIMEZONE):
    zone = ZoneInfo(timezone_name)
    local_start, local_end = build_round_window(date, tee_time, round_hours, timezone_name)
    start, end = local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)
    hours = []
    for entry in entries:
        timestamp = entry["time"]
        if isinstance(timestamp, (int, float)):
            bucket_end = datetime.fromtimestamp(timestamp, timezone.utc)
        else:
            parsed = datetime.fromisoformat(timestamp)
            bucket_end = (parsed if parsed.tzinfo else parsed.replace(tzinfo=zone)).astimezone(timezone.utc)
        bucket_start = bucket_end - timedelta(hours=1)
        minutes = max(0, int((min(bucket_end, end) - max(bucket_start, start)).total_seconds() / 60))
        if minutes:
            def label(instant):
                return instant.astimezone(zone).strftime("%H:%M")

            hours.append({
                **entry,
                "time": bucket_end.astimezone(zone).isoformat(timespec="minutes"),
                "bucketStart": label(bucket_start),
                "bucketEnd": label(bucket_end),
                "playStart": label(max(bucket_start, start)),
                "playEnd": label(min(bucket_end, end)),
                "overlapMinutes": minutes,
                "isPartialHour": minutes < 60,
            })
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
