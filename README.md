# Signal Analytics

Signal is a small analytics app that shows how people use a website. It records page views, clicks, form inputs, scroll depth, and custom events. The dashboard groups these events into sessions and displays user journeys and click heatmaps.

## What is included?

- React dashboard for analytics
- Express API for collecting and reading events
- MongoDB storage through Mongoose
- Standalone browser tracker
- Demo page for creating real events
- Session timeline and click/input heatmap

## Technology stack

- Frontend: React.js and Vite
- Styling: Tailwind CSS and CSS components
- Backend: Node.js and Express.js
- Database: MongoDB and Mongoose
- Tracking: Vanilla JavaScript
- API calls: Fetch API
- Frontend tests: Vitest
- Backend tests: Jest and Supertest

## Project structure

```text
client/          React + Vite dashboard
server/          Express API and Mongoose model
tracker/         Framework-independent tracking script
demo.html        Local demo page
vercel.json      Vercel routes for /analytics and /demo
```

## Run the project locally

### Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas database

### Install

```bash
npm install
cp .env.example .env
```

Update `.env` with your database settings:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/causalfunnel_analytics
MONGODB_DB=causalfunnel_analytics
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
```

Start the dashboard and API together:

```bash
npm run dev
```

Local URLs:

- Dashboard: `http://localhost:5173`
- API health check: `http://localhost:4000/api/health`

## Test the real tracking flow

Serve the project folder:

```bash
npx serve .
```

Then open:

```text
http://localhost:3000/demo.html
```

On the demo page:

1. Load the page.
2. Click the email input.
3. Type a test value.
4. Click **Get started**.
5. Scroll down the page.
6. Open the dashboard and refresh it.

The tracker sends real browser timestamps and events to the API. The session should then appear in the dashboard.

## Production URLs

After deployment, the Vercel routes are:

```text
https://your-vercel-domain.vercel.app/analytics
https://your-vercel-domain.vercel.app/demo
```

The demo sends events to the deployed Render API:

```text
https://your-backend.onrender.com/api/events
```

Open `/demo`, interact with the page, then open `/analytics`. The dashboard refreshes automatically every five seconds; you can also use the refresh button.

## API routes

```text
GET  /api/health
POST /api/events
GET  /api/sessions
GET  /api/sessions/:sessionId
GET  /api/pages
GET  /api/heatmap?page=<page-url>
```

`POST /api/events` accepts one event or an array of up to 50 events.

## Add the tracker to another website

```html
<script>
  window.SIGNAL_ANALYTICS_ENDPOINT =
    "https://your-backend.onrender.com/api/events";
</script>
<script src="https://your-static-host.com/tracker/tracker.js"></script>
```

The tracker creates or reuses a session ID in `localStorage` and exposes custom events through:

```js
window.SignalAnalytics.track("checkout_started", {
  cartValue: 129.99
});
```

## Environment variables

Local development uses `.env`. Production services need their own environment variables.

### Render backend

```env
MONGODB_URI=your-mongodb-atlas-uri
MONGODB_DB=causalfunnel_analytics
NODE_ENV=production
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
```

Render settings:

```text
Root Directory: blank
Build Command: npm install
Start Command: npm start
```

### Vercel frontend

```env
VITE_API_URL=https://your-backend.onrender.com
```

Vercel settings:

```text
Root Directory: blank
Build Command: npm run build
Output Directory: dist
```

Never commit `.env` or database credentials to GitHub.

## Testing and build commands

```bash
npm run test:server
npm run test:client
npm test
npm run build
```

## Assumptions and trade-offs

- Sessions are anonymous. The tracker identifies a browser using `localStorage` and does not require login.
- Clearing browser storage creates a new session.
- Click and input coordinates are approximate. They show interaction patterns, not screen recordings.
- The API limits each event request to 50 events to keep requests small.
- MongoDB is required for permanent storage. If MongoDB is unavailable, events cannot be saved.
- The dashboard has no user accounts or role-based access yet.
- The overview chart is a simple visual summary. The Sessions and Heatmap pages show the detailed data.
