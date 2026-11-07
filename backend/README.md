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

Open-Meteo precipitation bins refer to the preceding hour. Half-hour tee times include both boundary bins. `summary.totalPrecipitationMm` sums full hourly source values for overlapping bins, including any portions outside the round. The UI labels this as a full-hour bucket total, not an exact five-hour accumulation. Wind is the source's instantaneous hourly value. The maximum hourly probability is never a whole-round rain probability.

Summary metrics require coverage of all 300 playing minutes and non-null values for the corresponding precipitation metric. Otherwise that summary metric is null, not zero. If either metric is incomplete, `summary.incomplete` is true and `summary.riskLevel` is `unknown`; only complete precipitation data can produce `low`, `medium`, or `high`. Available individual hourly values remain visible alongside an incomplete-data notice in Japanese, Chinese, or English.

Hourly forecasts also include `temperatureC` from Open-Meteo's `temperature_2m`, explicitly requested in Celsius. Negative and zero temperatures are valid; absent or invalid values remain null. Temperature and wind correspond to the bucket end timestamp, while precipitation describes the preceding hour.

The scene uses separate hourly precipitation types: `rainMm` combines documented `rain` and `showers` values only when both are available; `snowfallCm` comes directly from `snowfall` in centimeters. Missing or invalid values stay null. `precipitationMm` remains total precipitation, including snow water equivalent. The frontend can show rain, snow, or both without guessing snow from temperature, and does not treat snowfall as accumulated ground snow depth.

`weatherCode` preserves a documented WMO code, `cloudCoverPct` carries cloud cover from 0–100%, and `isDay` is true for day, false for night, or null if unavailable. All three are hourly values for the bucket end time. The scene uses these provider values to distinguish clear, cloudy, overcast, fog, rain, snow and thunderstorms; sun and moon are shown only when daylight data and the weather state support them. Weather codes can indicate rain or snow even when a rounded hourly amount is zero. The app does not infer sunny skies merely from zero precipitation.

The `clothing` response supplies a packing checklist and the range of available hourly temperatures. These are app guidelines, not provider recommendations or a thermal comfort model: the coldest hourly temperature selects a layered outfit. Below 5°C: base layer, long-sleeve top, insulated jacket, warm trousers, beanie and neck warmer. From 5–10°C: base layer, long sleeves, fleece and warm trousers. From 10–15°C: long sleeves, vest and stretch trousers. From 15–20°C: long sleeves and stretch trousers. At 20°C and above: a breathable shirt with stretch trousers, switching to lightweight trousers at 25°C. A round maximum of at least 25°C adds a breathable cap; at least 28°C adds a towel. These choices do not imply sunny weather or a UV forecast. An hourly precipitation amount of at least 0.5 mm or probability of at least 40% adds a waterproof jacket, rain hat, waterproof shoes, spare gloves and a towel; an hourly amount of at least 3 mm adds waterproof trousers. A towel is listed only once. Without a rain recommendation or an insulated jacket, a windproof layer is suggested only when the same hour has a known temperature below 20°C and wind of at least 18 km/h (5 m/s). Warm windy rounds do not add a jacket, and missing temperature cannot imply cold weather. Cool calm hours and warm windy hours are not combined into a fictional cold windy condition. Wind values and trends remain visible regardless of the clothing recommendation. This threshold is an app guideline, not a calculated feels-like temperature. Missing weather values are flagged, and missing temperature never defaults to warm conditions. The frontend shows the 19 supported items in one checklist, each with an illustrated icon and a short explanation. A shuffle button chooses from 24 visual styles combining male/female characters, six palettes, different cuts and patterns. Only the character appearance changes; Flask's weather-derived garment list stays intact across all styles. `wearItems` identifies the garments displayed on the character; `packItems` identifies checklist supplies or optional layers labeled as packed. Probability alone packs rain gear without wearing it. At least 0.5 mm in an hour displays the rain shell, and at least 3 mm displays rain trousers. A cool-wind shell is packed by default; it is worn only when the same hour is below 15°C with wind of at least 25.2 km/h (7 m/s). These are presentation guidelines, not live observations. The vest is drawn as a sleeveless V-neck sweater over the shirt, without coat sleeves or a jacket zipper. Legacy responses without these fields show the base outfit and treat rain/wind shells as packed. The animated outfit changes hats, neckwear, trouser colors, footwear and outerwear silhouettes/textures to match the selected garments. Golf caps or visors complete ordinary looks, while recommended beanies and rain hats retain priority. Hand-held clubs, a glove, a stand bag, a ball on a tee, polo details, belts, argyle vests and spiked shoes provide golf styling; rainy looks also show a bag rain cover. These illustrated props do not add weather claims or change the clothing API. The checklist and preparation sentence are translated into Japanese, Chinese and English without frontend provider calls.

The same response supplies `temperatureTrend`, `windTrend`, and `maxWindSpeedKmh` for a short preparation sentence beside the weather animation. A trend is `rising` or `falling` only when all round values for that metric are present, every step follows the same direction, and the first-to-last change reaches 2°C or 3.6 km/h respectively. Otherwise the trend is null; the UI shows available ranges instead of inventing a trend. This sentence reuses the outfit checklist. Course, play date, round times, and forecast retrieval time appear above it; retrieval time is not the provider's model update time.

## Checks

Hourly `highlights` are presentation hints calculated only from the selected round. A single coldest-time hint requires complete temperature data, a minimum below 20°C, and a round range of at least 2°C. A single wind-increase hint requires at least 18 km/h and a rise of at least 7.2 km/h over an earlier minimum, without bridging missing wind values. Rain/snow hints mark the first hour of a precipitation episode or a change in precipitation type, using source amounts, weather codes, or hourly probability of at least 40%. Probability alone does not determine precipitation type. Each card shows at most two hints. These are app display rules, not provider alerts or playability decisions.

```sh
.venv/bin/ruff check .
.venv/bin/python -m unittest discover -s tests -v
```

Tests use explicitly synthetic fixtures only and cover time windows, timezone boundaries, response parsing, course validation, caching, concurrency, throttling, dotenv loading, request limits and provider failures. Provider documentation checked during implementation: [Flask](https://flask.palletsprojects.com/en/stable/), [Requests](https://requests.readthedocs.io/en/latest/user/quickstart/), [Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md), [Open-Meteo](https://open-meteo.com/en/docs).
