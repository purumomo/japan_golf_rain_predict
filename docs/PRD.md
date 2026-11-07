# Golf Rain MVP Product Requirements

## 1. Product goal
A mobile-first worldwide golf-course weather web app. Users select a golf course, a date and tee-off time, then see forecast rain risk during their planned round (default five hours). The key pain point is that general weather apps can be inaccurate for a specific golf course. The MVP focuses on location-specific, transparent information, **not** a claim of superior forecast accuracy.

## 2. Audience
Golfers booking rounds worldwide; the original Japan experience remains supported (global expansion authorized 2026-11-07). Search real courses online instead of maintaining a local directory (user instruction, 2026-11-06). PGM and Taiheiyo courses can be found by their mapped names, subject to the place provider's coverage.

## 3. Core user journey
1. Enter a golf-course name and explicitly submit an online place search.
2. Check the candidate names, addresses and map links, then select the intended course. Do not automatically pick the first match.
3. Choose a future date within the provider's available forecast horizon.
4. Choose a tee time, such as 08:30.
5. View hourly precipitation probability and precipitation amount across the next five hours, including wind speed when available.
6. Highlight riskier hours; display the data source and most recent forecast time.

## 4. Required features
- Flask-hosted online course search through Photon / OpenStreetMap, with one PGM-prefix retry for empty Japanese-name searches and a free Overpass name-fragment fallback when Photon still returns no courses. Return named worldwide golf-course features with coordinates, address, source link and retrieval time. No bundled course JSON or fake fallback results.
- Explicit search submission, short-lived bounded memory caching, throttling, timeouts and clear empty/error states. Search worldwide without a fixed country restriction or Tokyo location bias.
- Date and tee-time selection, using the selected course’s local IANA time zone for date bounds, tee times and forecast display. Resolve the zone server-side from coordinates; never silently fall back to Tokyo.
- Live forecast request for the course coordinates, using an officially documented weather API such as Open-Meteo, subject to applicable usage terms.
- Readable mobile-first hourly chart and a plain-language risk summary.
- Clear loading, API failure, missing forecast, and out-of-range date states.
- Accessible UI and responsive design.

## 5. Weather calculation rules
- A round spans five hours after tee-off by default; clearly label this as an estimate.
- Hourly precipitation probability describes the provider's relevant hourly forecast probability. Never treat the maximum hourly probability as the mathematical probability of rain at any point in the five-hour window.
- Present the highest hourly probability clearly labeled as such, plus the hourly timeline. Do not invent an overall-round probability.
- Where an API supplies hourly data, align hour bins correctly for half-hour tee times and explain any approximation.
- Do not present forecast model output as measured rain or guarantee accuracy.

## 6. Explicitly out of scope
- Training a forecast model or claiming forecast improvements without evidence.
- Historical backtesting and radar fusion.
- Account creation, login, database, payments, subscriptions, notifications.
- Booking integration, consumer weather scraping, LLM integration.
- Multi-provider comparison in the first release; revisit after validating the basic product.

## 7. Technical approach
- Next.js with TypeScript and Tailwind CSS, using existing stable and supported versions verified before installation.
- Separate Flask backend in `backend/`, with independent dependencies, process and deployment. The browser requests same-origin `/api/*`; Next.js rewrites forward these requests to Flask using server-only `BACKEND_URL`. CORS is unnecessary for this flow. No Next.js API routes for course or weather logic (user instruction, 2026-11-06).
- A server-side place-search API and selected course coordinates passed to the forecast API. Validate coordinates and request fields; no database or permanent course storage.
- Configurable Photon endpoint, using its documented golf-course category without a fixed country filter. The public demo permits reasonable use but has no availability guarantee; use an appropriate dedicated endpoint before scaling traffic. Use a configurable free Overpass endpoint for course name fragments worldwide that Photon cannot match. See `docs/COURSE_SEARCH.md`.
- Open-Meteo or an alternative documented forecast API with precipitation probability, precipitation amount and optional wind speed; inspect current documentation before coding.
- The Next.js frontend can deploy to Vercel; Flask runs on a separate Python-capable service. No database needed.
- Keep weather source attribution and licensing/usage limitations visible. Check commercial usage terms before monetizing.
- Since independent weather forecasting in Japan can trigger licensing requirements, display and contextualize licensed source forecasts instead of generating a proprietary probability for public release.

## 8. Acceptance criteria
- A user can select a course, date and tee time and see **real** forecast values for the relevant five-hour window.
- Hourly values and selected window match source timestamps in the course’s local time zone, including cross-midnight and daylight-saving boundaries.
- Loading, failure, and unsupported dates are handled without fake results.
- Works on a mobile-sized screen.
- The maximum hourly rain probability is labeled correctly.
- No course directory is shipped. A real online result must be explicitly selected before requesting its coordinate-based forecast. Changing a search must invalidate previous results and selection.
- `lint`, TypeScript checks, tests for time-window logic, and production build pass.
- Flask health, search, forecast and failure states work independently of Next.js, and same-origin GET/POST forwarding works without CORS; backend lint and unit tests pass. Live search-to-forecast integration is verified when outbound network access is available.

## 9. Future hypotheses (do not build yet)
- Add a second weather provider with comparable definitions and transparent disagreement.
- Track forecast changes after users save a scheduled round.
- Collect optional verified on-course feedback and evaluate forecast calibration.
- Explore weather-data partnerships and a premium product only after validation.

## 10. Development priorities
First build the course search, date/time selection and working hourly forecast display. Then verify time calculations, error handling and responsive design. Avoid architectural complexity.

Global time acceptance: resolving a course time zone must precede choosing a play date or submitting a forecast. Compute five elapsed hours on UTC instants, retain offsets in response timestamps, and reject nonexistent or ambiguous local tee times. Changing the course must invalidate an in-flight time-zone lookup.
