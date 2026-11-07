import json
import re

from http_client import ApiError


def course_name_query(query):
    # Escape both the regular expression and the surrounding Overpass string.
    pattern = json.dumps(re.escape(query), ensure_ascii=False)
    return (
        '[out:json][timeout:10][maxsize:33554432];'
        'nwr["leisure"="golf_course"]'
        f'[~"^(name|name:ja|name:en|alt_name|official_name)$"~{pattern},i];'
        'out center tags 50;'
    )


def course_features(payload):
    if (
        not isinstance(payload, dict)
        or not isinstance(payload.get("elements"), list)
        or payload.get("remark")
    ):
        # Overpass can return HTTP 200 with partial results and a runtime error.
        raise ApiError(502, "Course name lookup failed. Please retry shortly.")
    features = []
    for element in payload["elements"]:
        if not isinstance(element, dict):
            continue
        tags = element.get("tags")
        center = element if element.get("type") == "node" else element.get("center")
        if not isinstance(tags, dict) or not isinstance(center, dict):
            continue
        if tags.get("leisure") != "golf_course":
            continue
        features.append({
            "properties": {
                "osm_type": {"node": "N", "way": "W", "relation": "R"}.get(element.get("type")),
                "osm_id": element.get("id"),
                "osm_key": "leisure",
                "osm_value": "golf_course",
                "countrycode": tags.get("addr:country"),
                "country": tags.get("addr:country"),
                "name": tags.get("name") or tags.get("name:ja"),
                "state": tags.get("addr:province") or tags.get("addr:state"),
                "city": tags.get("addr:city"),
                "locality": tags.get("addr:full"),
                "street": tags.get("addr:street"),
                "housenumber": tags.get("addr:housenumber"),
            },
            "geometry": {"type": "Point", "coordinates": [center.get("lon"), center.get("lat")]},
        })
    return {"features": features}
