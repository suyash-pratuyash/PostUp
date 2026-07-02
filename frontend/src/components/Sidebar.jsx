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

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-150 border-l-[3px] cursor-pointer ${
      isActive
        ? 'bg-linkedin-blue-subtle text-linkedin-blue border-l-linkedin-blue font-semibold'
        : 'text-text-secondary border-l-transparent hover:bg-bg-hover hover:text-text-primary'
    }`;

  return (
    <aside className="fixed top-0 left-0 w-[280px] h-screen bg-bg-white border-r border-border-light flex flex-col z-[200] overflow-y-auto">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-border-light">
        <h1 className="text-[22px] font-extrabold text-linkedin-blue flex items-center gap-2.5">
          <span className="w-8 h-8 bg-linkedin-blue rounded-lg flex items-center justify-center text-white text-lg">
            ✍️
          </span>
          Inked In
        </h1>
        <p className="text-xs text-text-tertiary mt-1 pl-[42px]">LinkedIn Post Writer</p>
      </div>

      {/* Navigation */}
      <nav className="py-3 flex-1">
        <div className="px-5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Main</div>

        <NavLink to="/" end className={navLinkClass}>
          <span className="w-[22px] h-[22px] flex items-center justify-center text-lg shrink-0">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/generate" className={navLinkClass}>
          <span className="w-[22px] h-[22px] flex items-center justify-center text-lg shrink-0">⚡</span>
          Generate Post
          {!geminiOk && (
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[10px] bg-status-red-light text-status-red">!</span>
          )}
        </NavLink>

        <div className="px-5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Content</div>

        <NavLink to="/projects" className={navLinkClass}>
          <span className="w-[22px] h-[22px] flex items-center justify-center text-lg shrink-0">📁</span>
          Projects
          {stats.projects > 0 && (
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[10px] bg-linkedin-blue-light text-linkedin-blue">{stats.projects}</span>
          )}
        </NavLink>

        <NavLink to="/logs" className={navLinkClass}>
          <span className="w-[22px] h-[22px] flex items-center justify-center text-lg shrink-0">📝</span>
          Daily Logs
          {stats.daily_logs > 0 && (
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[10px] bg-linkedin-blue-light text-linkedin-blue">{stats.daily_logs}</span>
          )}
        </NavLink>

        <NavLink to="/posts" className={navLinkClass}>
          <span className="w-[22px] h-[22px] flex items-center justify-center text-lg shrink-0">📄</span>
          Saved Posts
          {stats.generated_posts > 0 && (
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[10px] bg-linkedin-blue-light text-linkedin-blue">{stats.generated_posts}</span>
          )}
        </NavLink>
      </nav>

      {/* Stats */}
      <div className="px-5 py-4 border-t border-border-light">
        <div className="flex justify-between items-center py-1.5 text-[13px]">
          <span className="text-text-secondary">Projects</span>
          <span className="font-bold text-text-primary">{stats.projects}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 text-[13px]">
          <span className="text-text-secondary">Daily Logs</span>
          <span className="font-bold text-text-primary">{stats.daily_logs}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 text-[13px]">
          <span className="text-text-secondary">Posts Generated</span>
          <span className="font-bold text-text-primary">{stats.generated_posts}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 text-[13px] mt-2 pt-2 border-t border-border-light">
          <span className="text-text-secondary">Gemini AI</span>
          <span className={`font-bold ${geminiOk ? 'text-status-green' : 'text-status-red'}`}>
            {geminiOk ? '● Connected' : '● Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
