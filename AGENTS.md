# Golf Rain Codex instructions

Read `docs/PRD.md` before planning or changing code. Treat the MVP scope and acceptance criteria there as authoritative.

- Build the smallest working implementation first.
- Use Next.js, TypeScript and responsive styling.
- Verify current API documentation before implementing integrations. Never invent endpoints or capabilities.
- Use real forecast data in the application. Mark all mock data explicitly.
- Do not add a database, authentication, LLM, custom weather prediction, push notifications, subscriptions, or scraping without explicit approval.
- Use a small local course dataset with verified coordinates and attribution.
- Keep secrets server-side; never commit credentials.
- Show timestamps, forecast source, and the limits of forecast certainty.
- Validate with lint, typecheck, tests for the tee-time window calculation, and a production build.
- Keep all code comments in English.
- Report what was implemented, how it was tested, and known limitations.
