import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const icon = (name) => ({ grid: "▦", map: "⌁", sessions: "◎", settings: "⚙", arrow: "→", click: "↗", page: "◌", input: "✎" }[name]);

function formatRelative(date) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  return minutes < 1 ? "just now" : minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

function App() {
  const [view, setView] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const query = selectedPage ? `?page=${encodeURIComponent(selectedPage)}` : "";
    try {
      const [sessionResponse, pageResponse, heatmapResponse] = await Promise.all([
        fetch(`${API_URL}/api/sessions`),
        fetch(`${API_URL}/api/pages`),
        fetch(`${API_URL}/api/heatmap${query}`)
      ]);
      const [sessionData, pageData, heatmapData] = await Promise.all([
        sessionResponse.ok ? sessionResponse.json() : [],
        pageResponse.ok ? pageResponse.json() : [],
        heatmapResponse.ok ? heatmapResponse.json() : []
      ]);
      setSessions(sessionData);
      setPages(pageData);
      setHeatmap(heatmapData);
    } catch (_error) {
      setSessions([]);
      setPages([]);
      setHeatmap([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    loadAnalytics(true);
    const refreshTimer = window.setInterval(() => loadAnalytics(), 5000);
    return () => window.clearInterval(refreshTimer);
  }, [loadAnalytics]);

  const totals = useMemo(() => ({
    sessions: sessions.length,
    events: sessions.reduce((sum, session) => sum + session.eventCount, 0),
    pages: new Set(sessions.flatMap((session) => session.pages)).size,
    clicks: heatmap.filter((point) => point.type === "click").length
  }), [sessions, heatmap]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>signal<span className="brand-dot">.</span></span></div>
        <div className="workspace"><span className="workspace-avatar">CF</span><span><b>Signal workspace</b><small>Product analytics</small></span><span className="chevron">⌄</span></div>
        <nav>
          <p className="nav-label">Workspace</p>
          <button className={view === "overview" ? "nav-item active" : "nav-item"} onClick={() => setView("overview")}>{icon("grid")} Overview</button>
          <button className={view === "sessions" ? "nav-item active" : "nav-item"} onClick={() => setView("sessions")}>{icon("sessions")} Sessions <span className="nav-count">{sessions.length}</span></button>
          <button className={view === "heatmap" ? "nav-item active" : "nav-item"} onClick={() => setView("heatmap")}>{icon("map")} Heatmap</button>
          <p className="nav-label">Manage</p>
          <button className="nav-item">{icon("settings")} Settings</button>
        </nav>
        <div className="sidebar-footer"><div className="plan-bar"><span>Free plan</span><b>65% used</b></div><div className="progress"><i /></div><button className="upgrade">Upgrade plan <span>{icon("arrow")}</span></button><div className="user"><span className="user-avatar">AT</span><span><b>atish</b><small>atish@example.com</small></span><span className="more">•••</span></div></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><h1>{view === "heatmap" ? "Heatmap" : view === "sessions" ? "Sessions" : "Overview"}</h1><p>See how visitors use your site.</p></div><div className="top-actions"><button className="date-button">Last 7 days <span>⌄</span></button><button className="icon-button" onClick={() => loadAnalytics()} title="Refresh analytics" aria-label="Refresh analytics">↻</button></div></header>
        {loading ? <div className="empty-state">Loading your analytics...</div> : view === "heatmap" ? <Heatmap points={heatmap} pages={pages} selectedPage={selectedPage} onPageChange={setSelectedPage} /> : view === "sessions" ? <Sessions sessions={sessions} onSelect={setSelected} /> : <Overview totals={totals} sessions={sessions} onSelect={setSelected} onHeatmap={() => setView("heatmap")} />}
      </main>
      {selected && <SessionDrawer session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Overview({ totals, sessions, onSelect, onHeatmap }) {
  return <div className="content">
    <section className="stat-grid">
      <Stat label="Total sessions" value={totals.sessions.toLocaleString()} delta="+12.5%" color="purple" />
      <Stat label="Total events" value={totals.events.toLocaleString()} delta="+8.2%" color="orange" />
      <Stat label="Pages viewed" value={totals.pages.toLocaleString()} delta="+5.4%" color="blue" />
      <Stat label="Interactions" value={totals.clicks.toLocaleString()} delta="+18.7%" color="green" />
    </section>
    <section className="panel split-panel"><div className="panel-heading"><div><h2>Activity overview</h2><p>Recent activity from tracked pages</p></div><div className="legend"><span><i className="dot purple-dot" /> Sessions</span><span><i className="dot orange-dot" /> Events</span></div></div><ActivityChart /></section>
    <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><h2>Recent sessions</h2><p>Latest user activity</p></div><button className="text-button" onClick={() => onSelect(sessions[0])}>View all {icon("arrow")}</button></div><SessionTable sessions={sessions.slice(0, 5)} onSelect={onSelect} /></div><div className="panel"><div className="panel-heading"><div><h2>Interaction map</h2><p>Click density across your pages</p></div><button className="text-button" onClick={onHeatmap}>Explore {icon("arrow")}</button></div><MiniHeatmap /></div></section>
  </div>;
}

function Stat({ label, value, delta, color }) { return <div className="stat-card"><div className={`stat-icon ${color}`}>{label === "Total sessions" ? "◎" : label === "Total events" ? "⚡" : label === "Pages viewed" ? "▣" : "↗"}</div><div><p>{label}</p><strong>{value}</strong><small className="positive">↑ {delta} <em>vs previous period</em></small></div></div>; }

function ActivityChart() { const bars = [35, 42, 32, 56, 48, 70, 62, 50, 58, 76, 64, 82, 75, 90, 68, 79, 94, 78, 88, 72, 84, 68, 76, 91, 80, 96, 86, 72, 66, 84]; return <div className="chart"><div className="y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="bars">{bars.map((height, index) => <div className="bar-column" key={index}><i className="bar events" style={{ height: `${height}%` }} /><i className="bar sessions-bar" style={{ height: `${height * .65}%` }} /></div>)}</div><div className="x-axis"><span>Oct 09</span><span>Oct 10</span><span>Oct 11</span><span>Oct 12</span><span>Oct 13</span><span>Oct 14</span><span>Oct 15</span></div></div>; }

function Sessions({ sessions, onSelect }) { return <div className="content"><div className="filter-row"><div className="search">⌕ <input placeholder="Search sessions..." /></div><button className="filter-button">All pages ⌄</button><button className="filter-button">All events ⌄</button></div><div className="panel"><div className="panel-heading"><div><h2>All sessions</h2><p>{sessions.length} sessions in the selected period</p></div><button className="export-button">Export CSV</button></div><SessionTable sessions={sessions} onSelect={onSelect} /></div></div>; }

function SessionTable({ sessions, onSelect }) { return <div className="table-wrap"><table><thead><tr><th>SESSION</th><th>STARTED</th><th>EVENTS</th><th>PAGES</th><th>DEVICE</th><th /></tr></thead><tbody>{sessions.map((session) => <tr key={session.sessionId} onClick={() => onSelect(session)}><td><span className="session-id">{session.sessionId.slice(0, 12)}...</span></td><td>{formatRelative(session.startedAt)}</td><td><b>{session.eventCount}</b></td><td><span className="page-pill">{session.pageViews} page views</span></td><td><span className="device">{session.device?.includes("Mobile") ? "◧ Mobile" : "▣ Desktop"}</span></td><td><span className="row-arrow">{icon("arrow")}</span></td></tr>)}</tbody></table>{!sessions.length && <div className="empty-state compact">No sessions yet. Add the tracker to your demo page to see data here.</div>}</div>; }

function Heatmap({ points, pages, selectedPage, onPageChange }) {
  return <div className="content"><div className="heatmap-toolbar"><div><h2>Click & input heatmap</h2><p>{selectedPage || "All tracked pages"}</p></div><select className="filter-button page-select" value={selectedPage} onChange={(event) => onPageChange(event.target.value)}><option value="">All pages</option>{pages.map((page) => <option key={page} value={page}>{page}</option>)}</select></div><div className="heatmap-canvas large">{points.slice(0, 500).map((point, index) => { const width = point.viewport?.width || 1200; const height = point.viewport?.height || 800; return <span key={`${point.timestamp}-${index}`} className={`heat-point ${point.type}`} title={`${point.type} at (${point.position?.x || 0}, ${point.position?.y || 0})`} style={{ left: `${Math.min(98, Math.max(2, (point.position?.x || 0) / width * 100))}%`, top: `${Math.min(94, Math.max(7, (point.position?.y || 0) / height * 100))}%` }} />; })}{!points.length && <div className="empty-state">No interaction points for this page yet.</div>}<div className="fake-browser"><span>●</span><span>●</span><span>●</span><div>{selectedPage || "All tracked pages"}</div></div><div className="mock-content"><div className="mock-image" /><div className="mock-lines"><b>Tracked page</b><i /><i /><button>Interaction area</button></div></div></div><div className="heat-legend"><span>Less</span><i className="heat-low" /><i className="heat-mid" /><i className="heat-high" /><span>More</span></div></div>;
}

function MiniHeatmap() { return <div className="mini-map"><div className="mini-browser"><span>● ● ●</span><b>demo.example.com</b></div><div className="mini-body"><i /><div><b>See what visitors do</b><span /><span /><button>Explore now</button></div></div><span className="heat-point one" /><span className="heat-point two" /><span className="heat-point three" /><span className="heat-point four" /></div>; }

function SessionDrawer({ session, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/sessions/${encodeURIComponent(session.sessionId)}`)
      .then((response) => response.ok ? response.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [session.sessionId]);
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p>SESSION DETAILS</p><h2>{session.sessionId.slice(0, 16)}...</h2></div><button onClick={onClose}>×</button></div><div className="drawer-meta"><span><b>Started</b>{new Date(session.startedAt).toLocaleString()}</span><span><b>Events</b>{session.eventCount}</span></div><div className="timeline"><div className="timeline-line" />{loading ? <div className="empty-state compact">Loading events...</div> : events.map((event) => <div className="timeline-item" key={event.eventId || `${event.timestamp}-${event.type}`}><i className={`timeline-icon ${event.type === "click" ? "orange" : event.type === "page_view" ? "blue" : "purple"}`}>{event.type === "click" ? "↗" : event.type === "page_view" ? "▣" : "•"}</i><div><b>{event.name || event.type}</b><small>{new Date(event.timestamp).toLocaleString()} · {event.page}</small>{event.type === "click" && <small>Position: {event.position?.x || 0}, {event.position?.y || 0}</small>}</div></div>)}</div><button className="close-drawer" onClick={onClose}>Close details</button></aside></div>;
}

function AppRoot() { return <App />; }
createRoot(document.getElementById("root")).render(<AppRoot />);
