# Golf Rain Flask backend

Python 3.11+ is recommended. The backend owns online course search, provider HTTP calls, input validation, caching, throttling and JST tee-time forecast calculations. It stores no course directory or database.

From this directory:

```sh
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
cp .env.example .env
.venv/bin/python app.py
```

The backend listens at http://127.0.0.1:5001. Port 5001 avoids macOS services that may occupy 5000. The Flask development server is for local development. A Python WSGI host can load `app:app` or the `create_app` factory for deployment.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health; no upstream call |
| GET | `/api/courses?q=...` | Photon search with a PGM-prefix retry and Overpass fallback |
| POST | `/api/forecast` | Real Open-Meteo forecast for `{ course, date, teeTime }` |

A forecast `course` is the selected object returned by search, including `id`, `name`, `prefecture`, `address`, `latitude`, `longitude`, and `sourceUrl`. The response shape stays compatible with the frontend. Invalid input returns 400; unsupported dates return 422 with current bounds; search throttling returns 429; provider failures return 502. No mock fallback values are served.

## Configuration

Copy `.env.example` to `.env` and edit the values as needed. `app.py` explicitly loads `backend/.env`, including when imported by a WSGI server. Existing shell or hosting environment values take precedence. Real `.env` files are ignored by Git. Restart Flask after changing configuration.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5001` | Local `python app.py` port |
| `PHOTON_SEARCH_URL` | `https://photon.komoot.io/api/` | Server-side Photon-compatible search endpoint |
| `OVERPASS_SEARCH_URL` | `https://overpass.private.coffee/api/interpreter` | Free name-fragment fallback; empty disables it |

No API key is needed for the default providers. Keep any future credentials only in backend environment variables. The frontend server forwards `/api/*` using its private `BACKEND_URL`; the browser uses relative URLs and Flask needs no CORS configuration.

```sh
export PHOTON_SEARCH_URL=https://your-photon.example/api/
```

Caching and throttling are in memory per Flask worker: five-minute cache, at most 100 queries, shared in-flight identical searches, one new distinct query per second. They do not coordinate across workers or instances. Photon public demo usage is limited to reasonable traffic with no availability guarantee. See [course search and provider terms](../docs/COURSE_SEARCH.md). Use a suitable dedicated endpoint before scaling.

Open-Meteo precipitation bins refer to the preceding hour. Half-hour tee times include both boundary bins. Rainfall totals preserve the full hourly source values for overlapping bins, so boundary-hour rainfall is an approximation rather than an exact five-hour accumulation; wind is the source's instantaneous hourly value. The maximum hourly probability is never a whole-round rain probability.

Hourly forecasts also include `temperatureC` from Open-Meteo's `temperature_2m`, explicitly requested in Celsius. Negative and zero temperatures are valid; absent or invalid values remain null. Temperature and wind correspond to the bucket end timestamp, while precipitation describes the preceding hour.

The scene uses separate hourly precipitation types: `rainMm` combines documented `rain` and `showers` values only when both are available; `snowfallCm` comes directly from `snowfall` in centimeters. Missing or invalid values stay null. `precipitationMm` remains total precipitation, including snow water equivalent. The frontend can show rain, snow, or both without guessing snow from temperature, and does not treat snowfall as accumulated ground snow depth.

`weatherCode` preserves a documented WMO code, `cloudCoverPct` carries cloud cover from 0–100%, and `isDay` is true for day, false for night, or null if unavailable. All three are hourly values for the bucket end time. The scene uses these provider values to distinguish clear, cloudy, overcast, fog, rain, snow and thunderstorms; sun and moon are shown only when daylight data and the weather state support them. Weather codes can indicate rain or snow even when a rounded hourly amount is zero. The app does not infer sunny skies merely from zero precipitation.

The `clothing` response supplies a packing checklist and the range of available hourly temperatures. These are app guidelines, not provider recommendations or a thermal comfort model: the coldest hourly temperature selects a warm layer below 10°C, long sleeves below 20°C, or a breathable shirt otherwise. Any positive rainfall amount or hourly probability of at least 40% adds a waterproof jacket and spare gloves; an hourly amount of at least 3 mm adds waterproof trousers. Without a rain recommendation, wind of at least 18 km/h adds a windproof layer. Missing weather values are flagged, and missing temperature never defaults to warm conditions. The frontend displays simple garment animations and translates the checklist without making provider calls.

## Checks

```sh
.venv/bin/ruff check .
.venv/bin/python -m unittest discover -s tests -v
```

Tests use explicitly synthetic fixtures only and cover time windows, timezone boundaries, response parsing, course validation, caching, concurrency, throttling, dotenv loading, request limits and provider failures. Provider documentation checked during implementation: [Flask](https://flask.palletsprojects.com/en/stable/), [Requests](https://requests.readthedocs.io/en/latest/user/quickstart/), [Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md), [Open-Meteo](https://open-meteo.com/en/docs).
