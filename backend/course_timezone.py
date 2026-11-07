import time
from threading import Lock
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from http_client import ApiError, fetch_json


class CourseTimezone:
    def __init__(self, get_json=fetch_json):
        self.get_json = get_json
        self.cache = {}
        self.lock = Lock()

    def resolve(self, course):
        key = (course["latitude"], course["longitude"])
        with self.lock:
            cached = self.cache.get(key)
            if cached and cached[0] > time.monotonic():
                return cached[1]
        payload = self.get_json("https://api.open-meteo.com/v1/forecast", {
            "latitude": key[0], "longitude": key[1], "timezone": "auto", "forecast_days": 1,
        })
        name = payload.get("timezone") if isinstance(payload, dict) else None
        try:
            if not isinstance(name, str):
                raise ValueError("Missing time zone")
            ZoneInfo(name)
        except (ValueError, ZoneInfoNotFoundError) as error:
            raise ApiError(502, "Could not determine the course time zone.") from error
        with self.lock:
            if len(self.cache) >= 100:
                self.cache.pop(next(iter(self.cache)))
            self.cache[key] = (time.monotonic() + 86400, name)
        return name
