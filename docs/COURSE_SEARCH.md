# Online course search

The app ships no course directory. Search results exist only in UI state and a bounded, short-lived server memory cache; no course JSON, database, account or persistent place store is used.

## Flow

1. A user enters a course name and clicks Search or presses Enter.
2. `GET /api/courses?q=...` on the separate Flask backend calls Photon. If no valid golf courses match a Japanese-only name fragment, Flask retries Photon once with the PGM brand prefix (for example, `総成` becomes `PGM総成`). It only accepts returned course names containing the original normalized fragment. If still empty, Flask makes one Overpass query for the literal name fragment worldwide. The browser calls same-origin `/api/*`; Next.js rewrites forward the request to server-only `BACKEND_URL` (default `http://127.0.0.1:5001`). Flask retains all API logic; Next.js has no API route handlers.
3. The UI displays the actual provider used and up to 15 golf-course candidates with addresses and retrieval time. The user selects a result and can inspect its OpenStreetMap link and coordinates.
4. Selecting a course calls `POST /api/course-context` with `{ course }`. Flask resolves the coordinate’s IANA time zone through Open-Meteo (`timezone=auto`), returning `timezone` and course-local date `bounds`. Failed lookups block date selection and offer retry. Successful zones are cached per worker for 24 hours with at most 100 entries. The browser refreshes the context once per minute to handle local midnight.
5. `POST /api/forecast` on Flask receives `{ course, date, teeTime }` and requests real Open-Meteo forecasts for the selected coordinates. The old local `courseId` lookup is removed.

Editing or resubmitting a search clears the previous selection and forecast. Stale search responses are discarded. Empty results and service failures never fall back to invented or bundled courses.

## Provider documentation

Verified on 2026-11-07:

- [Photon API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md)
- [Overpass query language](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)
- [Public Overpass instances and usage policies](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)
- [Photon categories](https://github.com/komoot/photon/blob/master/docs/categories.md)
- [Public demo usage terms](https://github.com/komoot/photon#demo-server)
- [OpenStreetMap attribution and ODbL](https://www.openstreetmap.org/copyright)

Default endpoint: `https://photon.komoot.io/api/`. Server-only `PHOTON_SEARCH_URL` can point to a compatible dedicated Photon `/api/` endpoint without changing the frontend. No API key is required for the public demo. Do not place credentials in a `NEXT_PUBLIC_` variable.

The documented query uses `q`, `limit=15`, `include=osm.leisure.golf_course`, without country restrictions or a fixed location bias. The parser independently filters for `leisure=golf_course` point results, valid OSM identities and finite coordinates within latitude −90…90 and longitude −180…180. GeoJSON coordinates are longitude first, latitude second.

Fallback endpoint: `https://overpass.private.coffee/api/interpreter`, configurable through server-only `OVERPASS_SEARCH_URL` (set an empty value to disable). No key or billing account is required. The query selects worldwide `leisure=golf_course` objects with a literal, case-insensitive fragment in `name`, `name:ja`, `name:en`, `alt_name` or `official_name`. User input is escaped as a regex and as an Overpass string. It requests at most 50 tagged objects and representative centers, then validates and deduplicates them and returns at most 15. Missing address tags remain empty; no addresses are invented. Overpass errors, including HTTP 200 runtime-error remarks, produce an error instead of a cached empty result.

The forecast request validates all course fields, coordinate bounds, date and time. It accepts the selected coordinates directly; the OSM identity is used for the source link, not as a signed identity or a server-side registry lookup.

## Caching and service limits

Identical queries share in-flight work and retain successful results for five minutes, including empty results, with at most 100 cached queries. The displayed retrieval timestamp is preserved on cache hits. Different uncached queries are limited to one start per second per Flask worker, and upstream calls use five-second connect and twelve-second read timeouts. A submitted search makes at most two Photon calls and, only if still empty, one Overpass call. No background, autocomplete or bulk harvesting requests are sent. Identical in-flight requests share all stages; their wait limit is 60 seconds.

Photon's public demo allows reasonable usage, can throttle or block extensive usage, and offers no availability guarantee. Per-worker throttling and caches do not coordinate across workers or instances; use a dedicated endpoint with suitable capacity before scaling. Private.coffee currently permits use in any project and asks large projects to contact the operator in advance. Public Overpass availability and response latency are not guaranteed. This limitation does not introduce a database dependency into the MVP.

## Search limitations

Coverage, addresses and names depend on OpenStreetMap and the provider's index and can be incomplete or outdated. Photon can fail to match Japanese name fragments even when a course is indexed: `総成` and `総成ゴルフクラブ` returned no features while `PGM` returned `PGM総成ゴルフクラブ` during diagnosis. The PGM prefix retry addresses this observed Photon matching failure without requiring Overpass. It is a query rewrite, not a stored course alias or local directory; names and coordinates still come from the live provider. Overpass handles other literal name fragments when available. It is not fuzzy matching, transliteration, or a group-membership directory. A combined name-and-prefecture query still relies on Photon unless that entire text occurs in a name tag. PGM and Taiheiyo searches match indexed names; group membership is not separately verified. Results are ranked candidates, not a complete list of a chain's courses. There is no Tokyo location bias. Worldwide coverage does not guarantee a complete course directory.

Course coordinates are representative map points, not surveyed tees or on-course observations. Users should check names, addresses and map locations before selecting. Retrieval time describes the search response, not the last survey or OSM edit time. Weather uncertainty disclosures remain in the UI.

Tests use explicitly synthetic fixtures only; the application never serves them. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from `frontend`. From `backend`, run `.venv/bin/ruff check .` and `.venv/bin/python -m unittest discover -s tests -v`. Forecast math and provider tests live in Python; frontend tests cover date options and saved courses across hemispheres. Live integration checks verify same-origin GET/POST proxying. Flask emits no CORS headers. See `backend/README.md` for independent startup and deployment.
