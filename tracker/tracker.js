(function (window, document) {
  "use strict";
  var endpoint = window.SIGNAL_ANALYTICS_ENDPOINT || "http://localhost:4000/api/events";
  var sessionKey = window.SIGNAL_ANALYTICS_SESSION_KEY || "signal_session_id";
  var storage = window.localStorage;
  var sessionId = storage.getItem(sessionKey);
  var makeId = function () { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : "session-" + Date.now() + "-" + Math.random().toString(36).slice(2); };
  if (!sessionId) { sessionId = makeId(); storage.setItem(sessionKey, sessionId); }
  function send(type, name, details) {
    var event = Object.assign({ eventId: makeId(), sessionId: sessionId, type: type, name: name, timestamp: new Date().toISOString(), page: window.location.href, referrer: document.referrer, userAgent: navigator.userAgent, viewport: { width: window.innerWidth, height: window.innerHeight }, position: { x: 0, y: 0 } }, details || {});
    var body = JSON.stringify(event);
    window.fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    });
  }
  send("page_view", "page_view");
  document.addEventListener("click", function (event) { var target = event.target.closest ? event.target.closest("a,button,[data-track]") : event.target; send("click", target && (target.getAttribute("data-track") || "click"), { position: { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY }, target: target && (target.id || target.getAttribute("aria-label") || target.textContent || target.tagName) }); });
  document.addEventListener("input", function (event) { if (event.target.matches("input,textarea,select")) send("input", "field_focus", { target: event.target.name || event.target.id || event.target.type, position: { x: event.clientX || 0, y: event.clientY || 0 } }); });
  var lastScroll = 0;
  window.addEventListener("scroll", function () { var depth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100); if (depth >= lastScroll + 25) { lastScroll = depth; send("scroll", "scroll_depth", { metadata: { depth: Math.min(depth, 100) }, position: { x: 0, y: window.scrollY } }); } }, { passive: true });
  window.SignalAnalytics = { sessionId: sessionId, track: function (name, metadata) { send("custom", name, { metadata: metadata || {} }); } };
})(window, document);
