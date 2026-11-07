import math
import re
import time
import unicodedata
from concurrent.futures import Future
from datetime import datetime, timezone
from threading import Lock

from http_client import ApiError, fetch_json
from overpass import course_features, course_name_query


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def osm_source_url(course_id):
    return "https://www.openstreetmap.org/" + course_id.removeprefix("osm-").replace("-", "/", 1)


def valid_course(course):
    if not isinstance(course, dict):
        return False
    limits = {"name": 300, "prefecture": 100, "address": 600}
    course_id = course.get("id")
    return (
        isinstance(course_id, str)
        and re.fullmatch(r"osm-(node|way|relation)-[1-9]\d*", course_id) is not None
        and all(
            isinstance(course.get(key), str) and len(course[key]) <= limit for key, limit in limits.items()
        )
        and bool(course["name"].strip())
        and is_number(course.get("latitude"))
        and -90 <= course["latitude"] <= 90
        and is_number(course.get("longitude"))
        and -180 <= course["longitude"] <= 180
        and course.get("sourceUrl") == osm_source_url(course_id)
    )


def normalize_query(query):
    return " ".join(unicodedata.normalize("NFKC", query).split())


def parse_course_results(payload, limit=15):
    if not isinstance(payload, dict) or not isinstance(payload.get("features"), list):
        raise ApiError(502, "Invalid place search response.")
    courses = []
    seen = set()
    for feature in payload["features"]:
        if not isinstance(feature, dict):
            continue
        props, geometry = feature.get("properties"), feature.get("geometry")
        if not isinstance(props, dict) or not isinstance(geometry, dict):
            continue
        coords = geometry.get("coordinates")
        if geometry.get("type") != "Point" or not isinstance(coords, list) or len(coords) < 2:
            continue
        if (props.get("osm_key"), props.get("osm_value")) != (
            "leisure",
            "golf_course",
        ):
            continue
        osm_type = {"N": "node", "W": "way", "R": "relation"}.get(props.get("osm_type"))
        osm_id = props.get("osm_id")
        if not osm_type or type(osm_id) is not int or osm_id <= 0:
            continue
        course_id = f"osm-{osm_type}-{osm_id}"
        parts = [
            props.get(key)
            for key in ("country", "state", "county", "city", "district", "locality", "street", "housenumber")
        ]
        course = {
            "id": course_id,
            "name": props.get("name"),
            "prefecture": props.get("state") if isinstance(props.get("state"), str) else "",
            "address": " ".join(dict.fromkeys(part for part in parts if isinstance(part, str) and part)),
            "longitude": coords[0],
            "latitude": coords[1],
            "sourceUrl": osm_source_url(course_id),
        }
        if valid_course(course) and course_id not in seen:
            seen.add(course_id)
            courses.append(course)
    return courses[:limit]


class CourseSearch:
    def __init__(self, endpoint, get_json=fetch_json, clock=time.monotonic, overpass_endpoint=None):
        self.endpoint = endpoint
        self.overpass_endpoint = overpass_endpoint
        self.get_json = get_json
        self.clock = clock
        self.cache = {}
        self.pending = {}
        self.next_request_at = 0
        self.lock = Lock()

    def search(self, raw_query):
        query = normalize_query(raw_query)
        if not 2 <= len(query) <= 100:
            raise ApiError(400, "Enter a course name of 2 to 100 characters.")
        key = query.casefold()
        with self.lock:
            now = self.clock()
            cached = self.cache.get(key)
            if cached and cached[0] > now:
                return cached[1]
            future = self.pending.get(key)
            owner = future is None
            if owner:
                if now < self.next_request_at:
                    raise ApiError(429, "Please wait before searching again.")
                self.next_request_at = now + 1
                future = Future()
                self.pending[key] = future
        if not owner:
            return future.result(timeout=60)
        try:
            params = {
                "q": query,
                "limit": 15,
                "include": "osm.leisure.golf_course",
            }
            payload = self.get_json(self.endpoint, params)
            courses = parse_course_results(payload)
            provider = "Photon / OpenStreetMap"
            # Photon may only match a Japanese name when its Latin brand prefix is present.
            if not courses and re.fullmatch(r"[\u3040-\u30ff\u3400-\u9fff]+", query):
                payload = self.get_json(self.endpoint, {**params, "q": f"PGM{query}"})
                courses = [
                    course for course in parse_course_results(payload)
                    if query.casefold() in normalize_query(course["name"]).casefold()
                ]
            if not courses and self.overpass_endpoint:
                payload = self.get_json(self.overpass_endpoint, {"data": course_name_query(query)})
                courses = parse_course_results(course_features(payload), limit=50)
                courses = courses[:15]
                provider = "Overpass / OpenStreetMap"
            result = {
                "courses": courses,
                "source": {
                    "provider": provider,
                    "fetchedAt": datetime.now(timezone.utc).isoformat(),
                    "attribution": "© OpenStreetMap contributors, ODbL 1.0",
                },
            }
            with self.lock:
                now = self.clock()
                self.cache = {key: entry for key, entry in self.cache.items() if entry[0] > now}
                if len(self.cache) >= 100:
                    del self.cache[next(iter(self.cache))]
                self.cache[key] = (now + 300, result)
            future.set_result(result)
            return result
        except Exception as error:
            future.set_exception(error)
            raise
        finally:
            with self.lock:
                del self.pending[key]
