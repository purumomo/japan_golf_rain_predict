import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

from test_backend import COURSE, FEATURE

from app import create_app
from course_timezone import CourseTimezone
from courses import CourseSearch
from http_client import ApiError
from tee_window import build_round_window, forecast_bounds, select_overlapping_hours, summarize_risk
from weather import fetch_forecast_window


class GlobalTests(unittest.TestCase):
    def test_worldwide_search_has_no_japan_restriction_or_bias(self):
        get_json = Mock(return_value={"features": [FEATURE]})
        CourseSearch("photon", get_json=get_json).search("Pebble Beach")
        params = get_json.call_args.args[1]
        for key in ("countrycode", "lat", "lon", "bbox"):
            self.assertNotIn(key, params)

    def test_timezone_lookup_uses_coordinates_and_caches(self):
        get_json = Mock(return_value={"timezone": "America/Los_Angeles"})
        resolver = CourseTimezone(get_json)
        course = {**COURSE, "latitude": 36.56, "longitude": -121.95}
        self.assertEqual(resolver.resolve(course), "America/Los_Angeles")
        self.assertEqual(resolver.resolve(course), "America/Los_Angeles")
        get_json.assert_called_once()
        self.assertEqual(get_json.call_args.args[1]["timezone"], "auto")
        self.assertEqual(get_json.call_args.args[1]["longitude"], -121.95)

    def test_timezone_failure_never_defaults_to_tokyo(self):
        for payload in ({}, {"timezone": "bogus"}, {"timezone": None}, []):
            resolver = CourseTimezone(Mock(return_value=payload))
            with self.assertRaises(ApiError):
                resolver.resolve(COURSE)
            self.assertFalse(resolver.cache)

    def test_date_bounds_follow_course_calendar_across_date_line(self):
        reference = datetime(2026, 12, 31, 12, tzinfo=timezone.utc)
        self.assertEqual(forecast_bounds(reference, "Pacific/Kiritimati")["minDate"], "2027-01-02")
        self.assertEqual(forecast_bounds(reference, "Pacific/Honolulu")["minDate"], "2027-01-01")

    def test_non_integer_offsets_and_southern_hemisphere(self):
        for zone, offset in [("Asia/Kolkata", "+05:30"), ("Asia/Kathmandu", "+05:45"),
                             ("Australia/Sydney", "+11:00"), ("America/Los_Angeles", "-08:00")]:
            start, end = build_round_window("2026-11-09", "22:30", timezone_name=zone)
            self.assertTrue(start.isoformat().endswith(offset))
            self.assertEqual(end.date().isoformat(), "2026-11-10")
            self.assertEqual(end.hour, 3)

    def test_five_elapsed_hours_across_both_dst_changes(self):
        for day, end_hour in [("2027-03-14", 6), ("2026-11-01", 4)]:
            start, end = build_round_window(day, "00:30", timezone_name="America/New_York")
            self.assertEqual(end.hour, end_hour)
            first = start.astimezone(timezone.utc).replace(minute=0)
            entries = [{"time": (first + timedelta(hours=i)).timestamp(),
                        "precipitationProbability": 0, "precipitationMm": 0} for i in range(8)]
            hours = select_overlapping_hours(entries, day, "00:30", timezone_name="America/New_York")
            self.assertEqual(sum(hour["overlapMinutes"] for hour in hours), 300)
            self.assertEqual(len({hour["time"] for hour in hours}), len(hours))
            self.assertEqual(summarize_risk(hours)["riskLevel"], "low")

    def test_nonexistent_and_ambiguous_tee_times_are_rejected(self):
        for day, tee in [("2027-03-14", "02:30"), ("2026-11-01", "01:30")]:
            with self.assertRaises(ValueError):
                build_round_window(day, tee, timezone_name="America/New_York")

    def test_global_context_and_forecast_use_server_resolved_zone(self):
        resolver = Mock(return_value="America/Los_Angeles")
        fetcher = Mock(return_value={"hours": [], "summary": summarize_risk([])})
        client = create_app({"TESTING": True, "TIMEZONE_RESOLVER": resolver,
                             "FORECAST_FETCHER": fetcher}).test_client()
        course = {**COURSE, "latitude": 36.56, "longitude": -121.95, "timezone": "Asia/Tokyo"}
        context = client.post("/api/course-context", json={"course": course})
        self.assertEqual(context.status_code, 200)
        self.assertEqual(context.json["timezone"], "America/Los_Angeles")
        day = context.json["bounds"]["minDate"]
        response = client.post("/api/forecast", json={"course": course, "date": day, "teeTime": "08:30"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["timezone"], "America/Los_Angeles")
        self.assertEqual(response.json["round"]["start"][:16], day + "T08:30")
        fetcher.assert_called_once_with(course, day, "08:30", timezone_name="America/Los_Angeles")
        self.assertEqual(client.post("/api/course-context", json={}).status_code, 400)
        resolver.side_effect = ApiError(502, "Time zone unavailable")
        self.assertEqual(client.post("/api/course-context", json={"course": course}).status_code, 502)

    def test_weather_uses_utc_instants_and_course_zone(self):
        start, _ = build_round_window("2026-11-09", "08:30", timezone_name="Asia/Kathmandu")
        first = start.astimezone(timezone.utc).replace(minute=0)
        times = [(first + timedelta(hours=i)).timestamp() for i in range(8)]
        get_json = Mock(return_value={"hourly": {"time": times}})
        result = fetch_forecast_window(COURSE, "2026-11-09", "08:30", get_json,
                                       timezone_name="Asia/Kathmandu")
        self.assertEqual(sum(hour["overlapMinutes"] for hour in result["hours"]), 300)
        self.assertEqual(result["hours"][0]["playStart"], "08:30")
        self.assertEqual(get_json.call_args.args[1]["timeformat"], "unixtime")
        self.assertEqual(get_json.call_args.args[1]["timezone"], "Asia/Kathmandu")
