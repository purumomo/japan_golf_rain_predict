import os
import re
from datetime import date as calendar_date
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from courses import CourseSearch, valid_course
from http_client import ApiError
from tee_window import ROUND_DURATION_HOURS, TIMEZONE, build_round_window, forecast_bounds
from weather import fetch_forecast_window

ENV_FILE = Path(__file__).with_name(".env")


def create_app(test_config=None):
    load_dotenv(ENV_FILE, override=False)
    app = Flask(__name__)
    app.config.from_mapping(
        MAX_CONTENT_LENGTH=16 * 1024,
        PHOTON_SEARCH_URL=os.environ.get("PHOTON_SEARCH_URL", "https://photon.komoot.io/api/"),
        OVERPASS_SEARCH_URL=os.environ.get(
            "OVERPASS_SEARCH_URL", "https://overpass.private.coffee/api/interpreter"
        ),
        FORECAST_FETCHER=fetch_forecast_window,
    )
    if test_config:
        app.config.update(test_config)
    app.json.ensure_ascii = False
    app.extensions["course_search"] = CourseSearch(
        app.config["PHOTON_SEARCH_URL"], overpass_endpoint=app.config["OVERPASS_SEARCH_URL"]
    )

    @app.errorhandler(ApiError)
    def api_error(error):
        response = jsonify(error=str(error))
        response.status_code = error.status
        if error.status == 429:
            response.headers["Retry-After"] = "1"
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="golf-rain-flask", timezone=TIMEZONE)

    @app.get("/api/courses")
    def courses():
        try:
            return jsonify(app.extensions["course_search"].search(request.args.get("q", "")))
        except ApiError:
            raise
        except Exception as error:
            app.logger.warning("Course search failed: %s", type(error).__name__)
            raise ApiError(502, "Course search failed. Please retry shortly.") from error

    @app.post("/api/forecast")
    def forecast():
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            raise ApiError(400, "Invalid JSON request.")
        course, date, tee_time = body.get("course"), body.get("date"), body.get("teeTime")
        if not valid_course(course) or not isinstance(date, str) or not isinstance(tee_time, str):
            raise ApiError(400, "Select a valid course, date and tee time.")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date) or not re.fullmatch(
            r"(?:[01]\d|2[0-3]):[0-5]\d", tee_time
        ):
            raise ApiError(400, "Date or tee time format is invalid.")
        try:
            calendar_date.fromisoformat(date)
        except ValueError as error:
            raise ApiError(400, "Invalid calendar date.") from error
        bounds = forecast_bounds()
        if not bounds["minDate"] <= date <= bounds["maxDate"]:
            return jsonify(error="Selected date is outside the supported forecast range.", bounds=bounds), 422
        try:
            result = app.config["FORECAST_FETCHER"](course, date, tee_time)
        except Exception as error:
            app.logger.warning("Forecast lookup failed: %s", type(error).__name__)
            raise ApiError(502, "Forecast lookup failed. Please retry shortly.") from error
        start, end = build_round_window(date, tee_time)
        # Return only the selected course contract, not arbitrary client fields.
        selected = {
            key: course[key]
            for key in ("id", "name", "prefecture", "address", "latitude", "longitude", "sourceUrl")
        }
        return jsonify(
            course=selected,
            timezone=TIMEZONE,
            round={
                "estimatedDurationHours": ROUND_DURATION_HOURS,
                "teeTime": tee_time,
                "start": start.isoformat(timespec="minutes")[:16],
                "end": end.isoformat(timespec="minutes")[:16],
            },
            source={
                "provider": "Open-Meteo Forecast API",
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "notes": [],
            },
            bounds=bounds,
            summary=result["summary"],
            clothing=result.get("clothing"),
            hours=result["hours"],
            missingForecast=not result["hours"],
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5001")))
