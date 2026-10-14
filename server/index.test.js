const request = require("supertest");
const { app, normalizeEvent } = require("./index");

describe("analytics API", () => {
  test("reports health without requiring a database connection", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("normalizes and bounds incoming events", () => {
    const event = normalizeEvent({ sessionId: "abc", type: "click", name: "cta", viewport: { width: "1200" } });
    expect(event.sessionId).toBe("abc");
    expect(event.type).toBe("click");
    expect(event.viewport.width).toBe(1200);
    expect(event.timestamp).toBeInstanceOf(Date);
  });
});
