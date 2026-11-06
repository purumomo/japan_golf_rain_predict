# Golf Rain Codex instructions

Read `docs/PRD.md` before planning or changing code. Treat the MVP scope and acceptance criteria there as authoritative.

- Build the smallest working implementation first.
- Use Next.js, TypeScript and responsive styling.
- Keep the frontend and backend separate: Next.js renders the UI; Flask in `backend/` owns course search, provider calls, input validation and tee-time forecast calculations. Do not reintroduce Next.js API routes for this logic.
- Verify current API documentation before implementing integrations. Never invent endpoints or capabilities.
- Use real forecast data in the application. Mark all mock data explicitly.
- Do not add a database, authentication, LLM, custom weather prediction, push notifications, subscriptions, or scraping without explicit approval.
- Search courses online and use the selected result's coordinates with attribution. Do not maintain a bundled local course dataset (user instruction, 2026-11-06).
- Keep secrets server-side; never commit credentials.
- Show timestamps, forecast source, and the limits of forecast certainty.
- Validate with lint, typecheck, tests for the tee-time window calculation, and a production build.
- Run backend Ruff checks and Python unit tests as well as frontend checks. Use same-origin `/api/*` forwarding to Flask; do not add CORS or a public backend URL to browser code.
- Keep all code comments in English.
- Report what was implemented, how it was tested, and known limitations.
