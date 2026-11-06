from datetime import date as calendar_date
from datetime import timedelta

from clothing import clothing_advice
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
            "hourly": "precipitation_probability,precipitation,wind_speed_10m,temperature_2m,rain,showers,snowfall",
            "timezone": "Asia/Tokyo",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
            "temperature_unit": "celsius",
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

    def value_at(key, index, maximum=None, minimum=0):
        values = hourly.get(key)
        if not isinstance(values, list) or index >= len(values):
            return None
        value = values[index]
        if (
            not is_number(value)
            or (minimum is not None and value < minimum)
            or (maximum is not None and value > maximum)
        ):
            return None
        return value

    entries = []
    for index, timestamp in enumerate(times):
        rain = value_at("rain", index)
        showers = value_at("showers", index)
        entries.append({
            "time": timestamp,
            "precipitationProbability": value_at("precipitation_probability", index, 100),
            "precipitationMm": value_at("precipitation", index),
            "windSpeedKmh": value_at("wind_speed_10m", index),
            "temperatureC": value_at("temperature_2m", index, minimum=None),
            "rainMm": round(rain + showers, 3) if rain is not None and showers is not None else None,
            "snowfallCm": value_at("snowfall", index),
        })
    try:
        hours = select_overlapping_hours(entries, date, tee_time)
    except (ValueError, TypeError) as error:
        raise ApiError(502, "Invalid forecast timestamps.") from error
    return {"hours": hours, "summary": summarize_risk(hours), "clothing": clothing_advice(hours)}
