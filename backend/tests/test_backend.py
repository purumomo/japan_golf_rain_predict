import copy
import json
import os
import re
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Event
from unittest.mock import Mock, patch

from app import create_app
from courses import CourseSearch, parse_course_results, valid_course
from http_client import ApiError, fetch_json
from overpass import course_features, course_name_query
from tee_window import build_round_window, forecast_bounds, select_overlapping_hours, summarize_risk
from weather import fetch_forecast_window

# Synthetic test fixtures are never returned by the running application.
COURSE = {
    "id": "osm-way-123",
    "name": "Mock Golf Course",
    "prefecture": "千葉県",
    "address": "Mock test address",
    "latitude": 35.8,
    "longitude": 140.3,
    "sourceUrl": "https://www.openstreetmap.org/way/123",
}
FEATURE = {
    "properties": {
        "name": COURSE["name"],
        "state": "千葉県",
        "city": "成田市",
        "countrycode": "JP",
        "osm_key": "leisure",
        "osm_value": "golf_course",
        "osm_type": "W",
        "osm_id": 123,
    },
    "geometry": {"type": "Point", "coordinates": [140.3, 35.8]},
}


def hourly_entry(timestamp, probability=20, rainfall=0.2):
    return {
        "time": timestamp,
        "precipitationProbability": probability,
        "precipitationMm": rainfall,
        "windSpeedKmh": 10,
    }


class WindowTests(unittest.TestCase):
    def test_jst_bounds_and_midnight(self):
        self.assertEqual(
            forecast_bounds(datetime(2026, 11, 5, 15, 30, tzinfo=timezone.utc)),
            {
                "minDate": "2026-11-07",
                "maxDate": "2026-11-12",
            },
        )
        self.assertEqual(
            forecast_bounds(datetime(2026, 11, 6, 14, 59, tzinfo=timezone.utc))["minDate"], "2026-11-07"
        )
        self.assertEqual(
            forecast_bounds(datetime(2026, 11, 6, 15, 0, tzinfo=timezone.utc))["minDate"], "2026-11-08"
        )

    def test_year_rollover(self):
        self.assertEqual(
            forecast_bounds(datetime(2026, 12, 31, 1, tzinfo=timezone.utc)),
            {
                "minDate": "2027-01-01",
                "maxDate": "2027-01-06",
            },
        )

    def test_round_crosses_midnight(self):
        start, end = build_round_window("2026-11-09", "22:30")
        self.assertEqual(start.isoformat(), "2026-11-09T22:30:00+09:00")
        self.assertEqual(end.isoformat(), "2026-11-10T03:30:00+09:00")

    def test_half_hour_window_preserves_preceding_hour_bins(self):
        entries = [hourly_entry(f"2026-11-09T{hour:02d}:00") for hour in range(8, 16)]
        hours = select_overlapping_hours(entries, "2026-11-09", "08:30")
        self.assertEqual([hour["overlapMinutes"] for hour in hours], [30, 60, 60, 60, 60, 30])
        self.assertEqual((hours[0]["bucketStart"], hours[0]["bucketEnd"]), ("08:00", "09:00"))
        self.assertEqual((hours[-1]["bucketStart"], hours[-1]["bucketEnd"]), ("13:00", "14:00"))
        self.assertEqual(hours[0]["precipitationProbability"], 20)
        self.assertEqual((hours[0]["playStart"], hours[0]["playEnd"]), ("08:30", "09:00"))
        self.assertEqual((hours[-1]["playStart"], hours[-1]["playEnd"]), ("13:00", "13:30"))

    def test_play_labels_cross_midnight(self):
        entries = [hourly_entry("2026-11-10T00:00"), hourly_entry("2026-11-10T01:00")]
        hours = select_overlapping_hours(entries, "2026-11-09", "23:30", round_hours=1)
        self.assertEqual([(hour["playStart"], hour["playEnd"]) for hour in hours],
                         [("23:30", "00:00"), ("00:00", "00:30")])

    def test_whole_hour_window_does_not_include_adjacent_hours(self):
        entries = [hourly_entry(f"2026-11-09T{hour:02d}:00") for hour in range(8, 16)]
        hours = select_overlapping_hours(entries, "2026-11-09", "08:00")
        self.assertEqual(len(hours), 5)
        self.assertEqual(sum(hour["overlapMinutes"] for hour in hours), 300)
        self.assertFalse(any(hour["isPartialHour"] for hour in hours))

    def test_null_values_remain_null_and_summary_is_max_hourly(self):
        hours = [hourly_entry("2026-11-09T09:00", None, None), hourly_entry("2026-11-09T10:00", 80, 1)]
        result = select_overlapping_hours(hours, "2026-11-09", "08:30")
        self.assertIsNone(result[0]["precipitationProbability"])
        self.assertEqual(
            summarize_risk(result),
            {
                "highestHourlyProbability": 80,
                "totalPrecipitationMm": 1,
                "riskLevel": "high",
            },
        )


class SearchTests(unittest.TestCase):
    def test_japanese_fragment_tries_brand_prefix_before_overpass(self):
        feature = copy.deepcopy(FEATURE)
        feature["properties"]["name"] = "Mock PGM総成ゴルフクラブ"
        get_json = Mock(side_effect=[{"features": []}, {"features": [feature]}])
        service = CourseSearch("photon", get_json=get_json, overpass_endpoint="overpass")
        result = service.search(" 総成 ")
        self.assertEqual(result["courses"][0]["name"], "Mock PGM総成ゴルフクラブ")
        self.assertEqual(result["source"]["provider"], "Photon / OpenStreetMap")
        self.assertTrue(valid_course(result["courses"][0]))
        self.assertEqual([call.args[1]["q"] for call in get_json.call_args_list], ["総成", "PGM総成"])
        self.assertTrue(all(call.args[0] == "photon" for call in get_json.call_args_list))
        self.assertEqual(service.search("総成"), result)
        self.assertEqual(get_json.call_count, 2)

    def test_brand_prefix_does_not_return_unrelated_fuzzy_results(self):
        get_json = Mock(side_effect=[{"features": []}, {"features": [FEATURE]}, {"elements": []}])
        service = CourseSearch("photon", get_json=get_json, overpass_endpoint="overpass")
        self.assertEqual(service.search("総成")["courses"], [])
        self.assertEqual(get_json.call_args.args[0], "overpass")

    def test_brand_prefix_is_not_added_to_brand_or_address_queries(self):
        for query in ["PGM", "PGM総成", "総成 千葉", "unknown"]:
            get_json = Mock(return_value={"features": []})
            self.assertEqual(CourseSearch("photon", get_json=get_json).search(query)["courses"], [])
            get_json.assert_called_once()

    def test_name_fragment_fallback_returns_course_and_caches_source(self):
        element = {
            "type": "way", "id": 123,
            "center": {"lat": 35.8, "lon": 140.3},
            "tags": {"leisure": "golf_course", "name": "Mock PGM総成ゴルフクラブ"},
        }
        get_json = Mock(side_effect=[{"features": []}, {"features": []}, {"elements": [element]}])
        service = CourseSearch("photon", get_json=get_json, overpass_endpoint="overpass")
        result = service.search("総成")
        self.assertEqual(result["courses"][0]["name"], "Mock PGM総成ゴルフクラブ")
        self.assertEqual(result["courses"][0]["sourceUrl"], COURSE["sourceUrl"])
        self.assertTrue(valid_course(result["courses"][0]))
        self.assertEqual(result["source"]["provider"], "Overpass / OpenStreetMap")
        self.assertEqual(get_json.call_args.args[0], "overpass")
        self.assertIn('~"総成",i]', get_json.call_args.args[1]["data"])
        self.assertEqual(service.search(" 総成 "), result)
        self.assertEqual(get_json.call_count, 3)

    def test_photon_match_does_not_trigger_fallback(self):
        get_json = Mock(return_value={"features": [FEATURE]})
        service = CourseSearch("photon", get_json=get_json, overpass_endpoint="overpass")
        self.assertEqual(service.search("PGM")["source"]["provider"], "Photon / OpenStreetMap")
        get_json.assert_called_once()

    def test_fallback_failure_is_not_cached_as_empty(self):
        clock = Mock(return_value=100)
        get_json = Mock(side_effect=[
            {"features": []}, {"features": []}, ApiError(502, "timeout"),
            {"features": []}, {"features": []}, {"elements": []},
        ])
        service = CourseSearch("photon", get_json=get_json, clock=clock, overpass_endpoint="overpass")
        with self.assertRaises(ApiError):
            service.search("総成")
        self.assertFalse(service.cache)
        self.assertFalse(service.pending)
        clock.return_value = 102
        self.assertEqual(service.search("総成")["courses"], [])
        self.assertEqual(get_json.call_count, 6)

    def test_overpass_runtime_errors_are_not_empty_results(self):
        for payload in [{}, {"elements": "bad"}, {"elements": [], "remark": "runtime error"}]:
            with self.assertRaises(ApiError):
                course_features(payload)

    def test_overpass_filters_invalid_features_and_deduplicates(self):
        element = {
            "type": "node", "id": 123, "lat": 35.8, "lon": 140.3,
            "tags": {"leisure": "golf_course", "name": "Mock Course"},
        }
        invalid = [
            None, {}, {**element, "lat": True}, {**element, "lon": float("nan")},
            {**element, "type": "bogus"},
            {**element, "tags": {"leisure": "parking", "name": "Mock Parking"}},
            {**element, "tags": {**element["tags"], "addr:country": "US"}},
        ]
        courses = parse_course_results(course_features({"elements": [element, element, *invalid]}))
        self.assertEqual(len(courses), 1)
        self.assertTrue(valid_course(courses[0]))

    def test_overpass_query_treats_input_as_literal_text(self):
        query = '総成.*"];out;('
        statement = course_name_query(query)
        encoded_pattern = statement.split(')$"~', 1)[1].split(',i](area.japan)', 1)[0]
        self.assertEqual(re.compile(json.loads(encoded_pattern)).fullmatch(query).group(), query)
        self.assertIsNone(re.search(json.loads(encoded_pattern), "総成anything"))
        self.assertIn('["ISO3166-1"="JP"]', statement)
        self.assertIn('["leisure"="golf_course"]', statement)

    def test_filters_duplicates_wrong_country_and_non_courses(self):
        wrong = copy.deepcopy(FEATURE)
        wrong["properties"]["countrycode"] = "US"
        parking = copy.deepcopy(FEATURE)
        parking["properties"]["osm_value"] = "parking"
        invalid = copy.deepcopy(FEATURE)
        invalid["geometry"]["coordinates"] = [35.8, 140.3]
        results = parse_course_results({"features": [FEATURE, FEATURE, wrong, parking, invalid, None]})
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["latitude"], 35.8)
        self.assertEqual(results[0]["longitude"], 140.3)
        self.assertEqual(results[0]["sourceUrl"], COURSE["sourceUrl"])
        self.assertEqual(results[0]["address"], "千葉県 成田市")

    def test_bad_provider_payload_fails(self):
        with self.assertRaises(ApiError):
            parse_course_results({"error": "not GeoJSON"})

    def test_validation_normalization_cache_expiry_and_throttle(self):
        get_json = Mock(return_value={"features": [FEATURE]})
        clock = Mock(return_value=100)
        service = CourseSearch("https://example.test/api/", get_json=get_json, clock=clock)
        for query in [" ", "a" * 101]:
            with self.assertRaises(ApiError) as raised:
                service.search(query)
            self.assertEqual(raised.exception.status, 400)
        get_json.assert_not_called()
        result = service.search("　ＰＧＭ　千葉 ")
        self.assertEqual(get_json.call_args.args[1]["q"], "PGM 千葉")
        self.assertEqual(get_json.call_args.args[1]["include"], "osm.leisure.golf_course")
        self.assertEqual(service.search("pgm 千葉"), result)
        self.assertEqual(get_json.call_count, 1)
        with self.assertRaises(ApiError) as raised:
            service.search("太平洋クラブ")
        self.assertEqual(raised.exception.status, 429)
        clock.return_value = 401
        service.search("PGM 千葉")
        self.assertEqual(get_json.call_count, 2)

    def test_concurrent_identical_searches_share_work(self):
        started, release = Event(), Event()

        def provider(*args):
            started.set()
            self.assertTrue(release.wait(3))
            return {"features": [FEATURE]}

        get_json = Mock(side_effect=provider)
        service = CourseSearch("https://example.test/api/", get_json=get_json)
        with ThreadPoolExecutor(max_workers=2) as pool:
            first = pool.submit(service.search, "PGM")
            self.assertTrue(started.wait(3))
            second = pool.submit(service.search, "pgm")
            release.set()
            self.assertEqual(first.result(3), second.result(3))
        self.assertEqual(get_json.call_count, 1)

    def test_empty_results_and_failure_have_no_fallback(self):
        self.assertEqual(
            CourseSearch("test", get_json=lambda *_: {"features": []}).search("unknown")["courses"], []
        )
        with self.assertRaises(ApiError):
            CourseSearch("test", get_json=Mock(side_effect=ApiError(502, "failure"))).search("PGM")

    def test_coordinate_validation_rejects_bool_nan_and_forged_links(self):
        for field, value in [
            ("latitude", True),
            ("longitude", float("nan")),
            ("sourceUrl", "https://example.com"),
        ]:
            self.assertFalse(valid_course({**COURSE, field: value}))


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.fetcher = Mock(return_value={"hours": [], "summary": summarize_risk([])})
        self.app = create_app({"TESTING": True, "FORECAST_FETCHER": self.fetcher})
        self.client = self.app.test_client()
        self.body = {"course": COURSE, "date": forecast_bounds()["minDate"], "teeTime": "08:30"}

    def test_health_is_independent_and_has_no_cors_headers(self):
        response = self.client.get("/api/health", headers={"Origin": "http://localhost:3000"})
        self.assertEqual(response.json["status"], "ok")
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_backend_env_file_loads_without_overriding_deployment_environment(self):
        with TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            env_file.write_text("PORT=5999\nPHOTON_SEARCH_URL=https://dotenv.example/api/\n")
            with patch("app.ENV_FILE", env_file), patch.dict(os.environ, {}, clear=True):
                configured = create_app({"TESTING": True})
                self.assertEqual(configured.config["PHOTON_SEARCH_URL"], "https://dotenv.example/api/")
                self.assertEqual(os.environ["PORT"], "5999")
            with (
                patch("app.ENV_FILE", env_file),
                patch.dict(os.environ, {"PHOTON_SEARCH_URL": "https://hosting.example/api/"}, clear=True),
            ):
                configured = create_app({"TESTING": True})
                self.assertEqual(configured.config["PHOTON_SEARCH_URL"], "https://hosting.example/api/")

    def test_search_route_returns_provider_results(self):
        self.app.extensions["course_search"] = Mock()
        self.app.extensions["course_search"].search.return_value = {"courses": []}
        self.assertEqual(self.client.get("/api/courses?q=unknown").json, {"courses": []})
        self.app.extensions["course_search"].search.side_effect = ApiError(429, "busy")
        response = self.client.get("/api/courses?q=PGM", headers={"Origin": "http://localhost:3000"})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["Retry-After"], "1")

    def test_selected_coordinates_preserve_frontend_forecast_contract(self):
        response = self.client.post("/api/forecast", json=self.body)
        self.assertEqual(response.status_code, 200)
        self.fetcher.assert_called_once_with(COURSE, self.body["date"], "08:30")
        self.assertEqual(response.json["course"], COURSE)
        self.assertEqual(response.json["timezone"], "Asia/Tokyo")
        self.assertEqual(response.json["round"]["end"], self.body["date"] + "T13:30")
        self.assertTrue(response.json["missingForecast"])
        self.assertEqual(response.json["source"]["provider"], "Open-Meteo Forecast API")

    def test_invalid_input_never_calls_upstream(self):
        bodies = [
            None,
            {},
            {**self.body, "teeTime": "25:00"},
            {**self.body, "date": "2026-02-30"},
            {**self.body, "course": {**COURSE, "latitude": 0}},
        ]
        for body in bodies:
            self.assertEqual(self.client.post("/api/forecast", json=body).status_code, 400)
        self.assertEqual(
            self.client.post("/api/forecast", data="invalid", content_type="application/json").status_code,
            400,
        )
        self.assertEqual(
            self.client.post("/api/forecast", data="x" * 20000, content_type="application/json").status_code,
            413,
        )
        self.fetcher.assert_not_called()

    def test_unsupported_date_and_provider_failure(self):
        response = self.client.post("/api/forecast", json={**self.body, "date": "2000-01-01"})
        self.assertEqual(response.status_code, 422)
        self.assertIn("bounds", response.json)
        self.fetcher.side_effect = ApiError(502, "provider secret details")
        response = self.client.post("/api/forecast", json=self.body)
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("secret", response.get_data(as_text=True))


class WeatherTests(unittest.TestCase):
    def test_rain_and_snow_are_separate_with_missing_data_preserved(self):
        payload = {"hourly": {
            "time": [f"2026-11-09T{hour:02d}:00" for hour in range(9, 15)],
            "rain": [0, 0.1, 0, 1, 0, 2],
            "showers": [0, 0.2, 0, None, 0, 0],
            "snowfall": [0, 0.5, 2, None, -1, float("nan")],
        }}
        get_json = Mock(return_value=payload)
        result = fetch_forecast_window(COURSE, "2026-11-09", "08:30", get_json)
        self.assertEqual([hour["rainMm"] for hour in result["hours"]], [0, 0.3, 0, None, 0, 2])
        self.assertEqual([hour["snowfallCm"] for hour in result["hours"]], [0, 0.5, 2, None, None, None])
        self.assertTrue({"rain", "showers", "snowfall"}.issubset(
            get_json.call_args.args[1]["hourly"].split(",")
        ))

    def test_real_provider_parameters_and_partial_hour_selection(self):
        get_json = Mock(
            return_value={
                "hourly": {
                    "time": [f"2026-11-09T{hour:02d}:00" for hour in range(9, 15)],
                    "precipitation_probability": [10, 20, 30, 40, 50, 60],
                    "precipitation": [0, 0, 0.2, 0.3, 0.4, 0.5],
                    "temperature_2m": [-2.5, 0, 8, None, True, "12"],
                }
            }
        )
        result = fetch_forecast_window(COURSE, "2026-11-09", "08:30", get_json=get_json)
        self.assertEqual(sum(hour["overlapMinutes"] for hour in result["hours"]), 300)
        self.assertEqual(result["summary"]["highestHourlyProbability"], 60)
        self.assertIsNone(result["hours"][0]["windSpeedKmh"])
        params = get_json.call_args.args[1]
        self.assertEqual((params["latitude"], params["longitude"]), (35.8, 140.3))
        self.assertEqual(params["timezone"], "Asia/Tokyo")
        self.assertEqual(params["end_date"], "2026-11-10")
        self.assertIn("temperature_2m", params["hourly"].split(","))
        self.assertEqual(params["temperature_unit"], "celsius")
        self.assertEqual([hour["temperatureC"] for hour in result["hours"]], [-2.5, 0, 8, None, None, None])
        self.assertEqual(result["clothing"]["temperatureMinC"], -2.5)

    def test_missing_and_nonfinite_temperatures_are_not_zero(self):
        payload = {"hourly": {
            "time": [f"2026-11-09T{hour:02d}:00" for hour in range(9, 15)],
            "temperature_2m": [float("nan"), float("inf"), -float("inf")],
        }}
        result = fetch_forecast_window(COURSE, "2026-11-09", "08:30", lambda *_: payload)
        self.assertTrue(all(hour["temperatureC"] is None for hour in result["hours"]))
        self.assertIsNone(result["clothing"]["temperatureMinC"])

    def test_empty_and_malformed_responses(self):
        self.assertEqual(fetch_forecast_window(COURSE, "2026-11-09", "08:30", lambda *_: {})["hours"], [])
        for payload in [[], {"hourly": "invalid"}, {"hourly": {"time": ["bad timestamp"]}}]:
            with self.assertRaises(ApiError):
                fetch_forecast_window(COURSE, "2026-11-09", "08:30", lambda *_: payload)

    @patch("http_client.requests.get")
    def test_upstream_client_has_timeouts_and_preserves_rate_limit(self, get):
        get.return_value.status_code = 429
        with self.assertRaises(ApiError) as raised:
            fetch_json("https://example.test/api", {})
        self.assertEqual(raised.exception.status, 429)
        self.assertEqual(get.call_args.kwargs["timeout"], (5, 12))


if __name__ == "__main__":
    unittest.main()
