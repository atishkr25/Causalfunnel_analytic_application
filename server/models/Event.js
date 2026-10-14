const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  type: { type: String, enum: ["page_view", "click", "input", "scroll", "custom"], required: true },
  name: { type: String, required: true, maxlength: 100 },
  timestamp: { type: Date, required: true, index: true },
  page: { type: String, required: true, maxlength: 500, index: true },
  referrer: { type: String, maxlength: 500, default: "" },
  userAgent: { type: String, maxlength: 500, default: "" },
  viewport: { width: { type: Number, default: 0 }, height: { type: Number, default: 0 } },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  target: { type: String, maxlength: 200, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { versionKey: false });

eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ type: 1, page: 1, timestamp: -1 });

module.exports = mongoose.models.Event || mongoose.model("Event", eventSchema);
