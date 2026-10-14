# Signal — User Analytics

Signal is a lightweight full-stack analytics app for seeing how visitors use a website. It includes a drop-in browser tracker, a Node.js API backed by MongoDB, and a React dashboard for sessions and interaction heatmaps.

## Features

- **Drop-in event tracker:** captures page views, clicks, form input, scroll depth, and custom events.
- **Session analytics:** groups events by a browser session and shows recent activity, pages, devices, event counts, and the ordered event journey.
- **Interaction heatmap:** visualizes click and input coordinates collected across tracked pages, with a page URL selector.
- **MongoDB storage:** uses indexed event documents designed for session and page queries.
- **Responsive dashboard:** overview metrics, activity chart, session table, session details drawer, and heatmap view.

## Tech stack

- Frontend: React.js with Vite
- Styling: Tailwind CSS and CSS components
- Backend: Node.js with Express.js
- Database: MongoDB with Mongoose
- Tracker: framework-independent Vanilla JavaScript
- API calls: Fetch API
- Backend tests: Jest and Supertest
- Frontend tests: Vitest

## Setup steps

You need Node.js 18 or newer and a running MongoDB database.

```bash
npm install
cp .env.example .env
npm run dev
```

Set these values in `.env` before starting the app:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/causalfunnel_analytics
MONGODB_DB=causalfunnel_analytics
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
```

The dashboard runs at `http://localhost:5173`. The API runs at `http://localhost:4000`.

Check the API with:

```text
http://localhost:4000/api/health
```

To test tracking, serve the project folder and open the demo:

```bash
npx serve .
```

Then open `http://localhost:3000/demo.html`, interact with the page, and refresh the dashboard.


## Project structure

- `client/` — React + Vite dashboard, styled with Tailwind CSS and dashboard CSS components.
- `server/` — Express REST API, Mongoose `Event` model, validation/normalization, and error handling.
- `tracker/` — framework-independent browser tracking script.
- `server/*.test.js` — Jest/Supertest backend tests; `client/**/*.test.jsx` — Vitest frontend tests.

## Embed the tracker

Add `tracker/tracker.js` to any page. It automatically creates or reuses a session ID in `localStorage`:

```html
<script>
  window.SIGNAL_ANALYTICS_ENDPOINT = "https://your-api.example.com/api/events";
</script>
<script src="https://your-site.example.com/tracker/tracker.js"></script>
```

Captured event documents include `eventId`, `sessionId`, `type`, `name`, `timestamp`, `page`, `referrer`, `userAgent`, `viewport`, `position`, `target`, and optional `metadata`.

Custom events are available after the script loads:

```js
window.SignalAnalytics.track("checkout_started", { cartValue: 129.99 });
```

## API

- `POST /api/events` — accepts one event or an array of up to 50 events.
- `GET /api/sessions` — returns grouped sessions.
- `GET /api/sessions/:sessionId` — returns the event timeline for one session.
- `GET /api/pages` — returns tracked page URLs for the heatmap selector.
- `GET /api/heatmap?page=/optional-path` — returns click and input points.
- `GET /api/health` — health check.

All API configuration is environment-driven. Copy `.env.example` to `.env` and set `MONGODB_URI`, `MONGODB_DB`, `CLIENT_ORIGIN`, and `VITE_API_URL` for the target environment.

## Test and production commands

```bash
npm run test:server
npm run test:client
npm run build
NODE_ENV=production npm start
```

For production, build the Vite client, serve the generated `dist/` directory from your static host, and run the Express process with a reachable MongoDB connection string. Set `CLIENT_ORIGIN` to the deployed dashboard origin and set `VITE_API_URL` before building the client.

## Assumptions and trade-offs

- A session is identified with a browser `localStorage` value. Clearing browser storage creates a new session.
- The tracker does not require user login, so sessions are anonymous.
- Click and input positions are approximate browser coordinates. They are useful for trends, not exact screen recordings.
- The API accepts up to 50 events in one request to keep requests small and safe.
- The dashboard currently loads recent data from the API; it does not include user accounts or role-based access.
- MongoDB is required for persistent data. If MongoDB is unavailable, the API cannot save or query analytics data.
- The chart on the overview page is a simple visual summary. Detailed activity is available in the Sessions and Heatmap views.

## Data model

Events are stored in the `events` collection in the configured MongoDB database. Compound indexes on `(sessionId, timestamp)` and `(type, page, timestamp)` support the dashboard queries.
