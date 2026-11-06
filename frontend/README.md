# Golf Rain frontend

Next.js / TypeScript frontend. The separate [Flask backend](../backend/README.md) must run at http://localhost:5001 for search and forecasts. The frontend has no API route handlers or provider integrations; Next.js rewrites only forward `/api/*` requests to Flask.

From this directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Enter a course name such as `太平洋クラブ 市原` or `PGM総成`, click Search, confirm the address and map, then select a date and tee time. No local course directory is bundled.

The browser calls relative `/api/*` URLs on the frontend origin. Next.js proxies these requests to `http://127.0.0.1:5001` by default, so no CORS is needed. Copy `.env.example` to `.env.local` to configure another Flask address:

```sh
BACKEND_URL=http://127.0.0.1:5001
```

This setting is server-only. Restart development or rebuild production after changing it because rewrite destinations are resolved during configuration/build. In deployment, use a Flask address reachable from the Next.js host; do not use localhost for a backend on a different machine. The browser always accesses the frontend origin, even when Flask is hosted separately.

```sh
npm run lint
npm test
npm run build
npm run typecheck
npm start
```

Frontend tests cover JST date-picker bounds; live integration checks cover GET/POST proxying. The backend owns forecast calculations and their tests. See the [PRD](../docs/PRD.md) and [online search documentation](../docs/COURSE_SEARCH.md).
