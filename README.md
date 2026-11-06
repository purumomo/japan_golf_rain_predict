# Golf Rain

Separate Next.js frontend and Flask backend for online Japanese golf-course search and real five-hour weather forecasts. No local course JSON, database or authentication.

Start both services from separate terminals at the repository root.

Backend (Python 3.11+):

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
cp .env.example .env
.venv/bin/python app.py
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Flask listens on http://localhost:5001; health is http://localhost:5001/api/health. The browser calls same-origin `/api/*`, forwarded to Flask by Next.js rewrites; CORS is not needed. Both services must run for search and weather; the page itself remains accessible when Flask is stopped and shows a request error if a lookup fails.

For separate hosting, set server-only frontend `BACKEND_URL` to the Flask URL reachable from the frontend host before building. Backend settings are documented in `backend/.env.example` and loaded from `backend/.env`. Next.js can deploy to Vercel; Flask requires its own Python WSGI hosting. Details: [frontend](frontend/README.md), [backend](backend/README.md), [PRD](docs/PRD.md), [course search](docs/COURSE_SEARCH.md).
