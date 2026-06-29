import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getHealth } from '../api/client';

export default function Sidebar() {
  const location = useLocation();
  const [stats, setStats] = useState({ projects: 0, daily_logs: 0, generated_posts: 0 });
  const [geminiOk, setGeminiOk] = useState(false);

  useEffect(() => {
    getHealth()
      .then((res) => {
        setStats(res.stats);
        setGeminiOk(res.gemini_configured);
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h1>
          <span className="brand-icon">✍️</span>
          PostUp
        </h1>
        <p>LinkedIn Post Writer</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/generate"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">⚡</span>
          Generate Post
          {!geminiOk && <span className="nav-badge" style={{ background: '#FFEBEE', color: '#CC1016' }}>!</span>}
        </NavLink>

        <div className="sidebar-section-label">Content</div>

        <NavLink
          to="/projects"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">📁</span>
          Projects
          {stats.projects > 0 && <span className="nav-badge">{stats.projects}</span>}
        </NavLink>

        <NavLink
          to="/logs"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">📝</span>
          Daily Logs
          {stats.daily_logs > 0 && <span className="nav-badge">{stats.daily_logs}</span>}
        </NavLink>

        <NavLink
          to="/posts"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">📄</span>
          Saved Posts
          {stats.generated_posts > 0 && <span className="nav-badge">{stats.generated_posts}</span>}
        </NavLink>
      </nav>

      {/* Stats */}
      <div className="sidebar-stats">
        <div className="stat-row">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{stats.projects}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Daily Logs</span>
          <span className="stat-value">{stats.daily_logs}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Posts Generated</span>
          <span className="stat-value">{stats.generated_posts}</span>
        </div>
        <div className="stat-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span className="stat-label">Gemini AI</span>
          <span className="stat-value" style={{ color: geminiOk ? 'var(--green)' : 'var(--red)' }}>
            {geminiOk ? '● Connected' : '● Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
