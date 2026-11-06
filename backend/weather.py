from datetime import date as calendar_date
from datetime import timedelta

from courses import is_number
from http_client import ApiError, fetch_json
from tee_window import select_overlapping_hours, summarize_risk


def fetch_forecast_window(course, date, tee_time, get_json=fetch_json):
    end_date = (calendar_date.fromisoformat(date) + timedelta(days=1)).isoformat()
    payload = get_json(
        "https://api.open-meteo.com/v1/forecast",
        {
            "latitude": course["latitude"],
            "longitude": course["longitude"],
            "hourly": "precipitation_probability,precipitation,wind_speed_10m",
            "timezone": "Asia/Tokyo",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
            "start_date": date,
            "end_date": end_date,
        },
    )
    if not isinstance(payload, dict):
        raise ApiError(502, "Invalid forecast response.")
    hourly = payload.get("hourly", {})
    if not isinstance(hourly, dict) or not isinstance(hourly.get("time", []), list):
        raise ApiError(502, "Invalid hourly forecast response.")
    times = hourly.get("time", [])

    def value_at(key, index, maximum=None):
        values = hourly.get(key)
        if not isinstance(values, list) or index >= len(values):
            return None
        value = values[index]
        if not is_number(value) or value < 0 or (maximum is not None and value > maximum):
            return None
        return value

    entries = [
        {
            "time": timestamp,
            "precipitationProbability": value_at("precipitation_probability", index, 100),
            "precipitationMm": value_at("precipitation", index),
            "windSpeedKmh": value_at("wind_speed_10m", index),
        }
        for index, timestamp in enumerate(times)
    ]
    try:
        hours = select_overlapping_hours(entries, date, tee_time)
    except (ValueError, TypeError) as error:
        raise ApiError(502, "Invalid forecast timestamps.") from error
    return {"hours": hours, "summary": summarize_risk(hours)}
