const fs = require("node:fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Event = require("./models/Event");

if (typeof process.loadEnvFile === "function") { try { process.loadEnvFile(); } catch (_) {} }
else if (fs.existsSync(".env")) for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/causalfunnel_analytics";
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required in production.");
}
const allowedTypes = new Set(["page_view", "click", "input", "scroll", "custom"]);
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "100kb" }));

function normalizeEvent(input = {}) {
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
  return {
    eventId: typeof input.eventId === "string" && input.eventId ? input.eventId.slice(0, 100) : `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sessionId: typeof input.sessionId === "string" && input.sessionId ? input.sessionId.slice(0, 100) : "unknown",
    type: allowedTypes.has(input.type) ? input.type : "custom",
    name: typeof input.name === "string" && input.name ? input.name.slice(0, 100) : "custom",
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    page: typeof input.page === "string" ? input.page.slice(0, 500) : "/",
    referrer: typeof input.referrer === "string" ? input.referrer.slice(0, 500) : "",
    userAgent: typeof input.userAgent === "string" ? input.userAgent.slice(0, 500) : "",
    viewport: { width: Number(input.viewport?.width) || 0, height: Number(input.viewport?.height) || 0 },
    position: { x: Number(input.position?.x) || 0, y: Number(input.position?.y) || 0 },
    target: typeof input.target === "string" ? input.target.slice(0, 200) : "",
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {}
  };
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.post("/api/events", async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    if (!payload.length || payload.length > 50) return res.status(400).json({ error: "Send between 1 and 50 events." });
    const documents = payload.map(normalizeEvent);
    await Event.insertMany(documents, { ordered: true });
    res.status(201).json({ accepted: documents.length });
  } catch (error) { next(error); }
});

app.get("/api/sessions", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const sessions = await Event.aggregate([
      { $group: { _id: "$sessionId", startedAt: { $min: "$timestamp" }, lastActivity: { $max: "$timestamp" }, eventCount: { $sum: 1 }, pageViews: { $sum: { $cond: [{ $eq: ["$type", "page_view"] }, 1, 0] } }, pages: { $addToSet: "$page" }, device: { $first: "$userAgent" } } },
      { $sort: { lastActivity: -1 } }, { $limit: limit },
      { $project: { _id: 0, sessionId: "$_id", startedAt: 1, lastActivity: 1, eventCount: 1, pageViews: 1, pages: 1, device: 1 } }
    ]);
    res.json(sessions);
  } catch (error) { next(error); }
});

app.get("/api/sessions/:sessionId", async (req, res, next) => {
  try {
    const events = await Event.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 }).lean();
    if (!events.length) return res.status(404).json({ error: "Session not found." });
    res.json(events);
  } catch (error) { next(error); }
});

app.get("/api/pages", async (_req, res, next) => {
  try { res.json((await Event.distinct("page", { type: { $in: ["page_view", "click", "input"] } })).filter(Boolean).sort()); } catch (error) { next(error); }
});

app.get("/api/heatmap", async (req, res, next) => {
  try {
    const query = { type: { $in: ["click", "input"] } };
    if (typeof req.query.page === "string" && req.query.page) query.page = req.query.page.slice(0, 500);
    res.json(await Event.find(query).select("type position viewport page timestamp").sort({ timestamp: -1 }).limit(5000).lean());
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: "Unable to process analytics request." }); });

async function start() {
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });
  app.listen(port, () => console.log(`Analytics API listening on http://localhost:${port}`));
}

if (require.main === module) start().catch((error) => { console.error("Could not connect to MongoDB.", error); process.exitCode = 1; });
module.exports = { app, normalizeEvent, start };
