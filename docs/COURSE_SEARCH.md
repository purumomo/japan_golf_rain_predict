# Online course search

The app ships no course directory. Search results exist only in UI state and a bounded, short-lived server memory cache; no course JSON, database, account or persistent place store is used.

## Flow

1. A user enters a course name and clicks Search or presses Enter.
2. `GET /api/courses?q=...` on the separate Flask backend calls Photon. The browser calls same-origin `/api/*`; Next.js rewrites forward the request to server-only `BACKEND_URL` (default `http://127.0.0.1:5001`). Flask retains all API logic; Next.js has no API route handlers.
3. The UI displays up to 15 golf-course candidates with addresses and retrieval time. The user selects a result and can inspect its OpenStreetMap link and coordinates.
4. `POST /api/forecast` on Flask receives `{ course, date, teeTime }` and requests real Open-Meteo forecasts for the selected coordinates. The old local `courseId` lookup is removed.

Editing or resubmitting a search clears the previous selection and forecast. Stale search responses are discarded. Empty results and service failures never fall back to invented or bundled courses.

## Provider documentation

Verified on 2026-11-06:

- [Photon API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md)
- [Photon categories](https://github.com/komoot/photon/blob/master/docs/categories.md)
- [Public demo usage terms](https://github.com/komoot/photon#demo-server)
- [OpenStreetMap attribution and ODbL](https://www.openstreetmap.org/copyright)

Default endpoint: `https://photon.komoot.io/api/`. Server-only `PHOTON_SEARCH_URL` can point to a compatible dedicated Photon `/api/` endpoint without changing the frontend. No API key is required for the public demo. Do not place credentials in a `NEXT_PUBLIC_` variable.

The documented query uses `q`, `limit=15`, `include=osm.leisure.golf_course`, `countrycode=JP` and a Tokyo location bias (`lat=35.68`, `lon=139.76`). The parser independently filters for Japanese `leisure=golf_course` point results, valid OSM identities and finite coordinates in Japan's bounding range. GeoJSON coordinates are longitude first, latitude second.

The forecast request validates all course fields, coordinate bounds, date and time. It accepts the selected coordinates directly; the OSM identity is used for the source link, not as a signed identity or a server-side registry lookup.

## Caching and service limits

Identical queries share in-flight work and retain successful results for five minutes, including empty results, with at most 100 cached queries. The displayed retrieval timestamp is preserved on cache hits. Different uncached queries are limited to one start per second per Flask worker, and upstream calls use five-second connect and twelve-second read timeouts. No background, autocomplete or bulk harvesting requests are sent.

Photon's public demo allows reasonable usage, can throttle or block extensive usage, and offers no availability guarantee. Per-worker throttling and caches do not coordinate across workers or instances; use a dedicated endpoint with suitable capacity before scaling. This limitation does not introduce a database dependency into the MVP.

## Search limitations

Coverage, addresses and names depend on OpenStreetMap and the provider's index and can be incomplete or outdated. Exact Japanese names, optionally with a prefecture, usually give clearer candidates. PGM and Taiheiyo searches match indexed names; group membership is not separately verified. Results are ranked candidates, not a complete list of a chain's courses. Tokyo is a preference, not a geographic restriction.

Course coordinates are representative map points, not surveyed tees or on-course observations. Users should check names, addresses and map locations before selecting. Retrieval time describes the search response, not the last survey or OSM edit time. Weather uncertainty disclosures remain in the UI.

Tests use explicitly synthetic fixtures only; the application never serves them. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from `frontend`. From `backend`, run `.venv/bin/ruff check .` and `.venv/bin/python -m unittest discover -s tests -v`. Forecast math and provider tests live in Python; frontend tests cover its JST date picker. Live integration checks verify same-origin GET/POST proxying. Flask emits no CORS headers. See `backend/README.md` for independent startup and deployment.
