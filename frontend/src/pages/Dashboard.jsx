import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHealth, getLogs, getPosts } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, logsRes, postsRes] = await Promise.all([
          getHealth(),
          getLogs({ limit: 5 }),
          getPosts({ limit: 5 }),
        ]);
        setStats(healthRes.stats);
        setRecentLogs(logsRes.data || []);
        setRecentPosts(postsRes.data || []);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'Z');
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto">
        <div className="mb-6">
          <div className="animate-shimmer h-6 w-[40%] mb-3 rounded-md" />
          <div className="animate-shimmer h-3.5 w-[60%] rounded-md" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer h-[120px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Merge and sort recent activity
  const activities = [
    ...recentLogs.map((log) => ({
      type: 'log',
      id: `log-${log.id}`,
      title: log.title,
      subtitle: log.project_name ? `Day ${log.day_number || '?'} · ${log.project_name}` : 'Standalone log',
      time: log.created_at,
      onClick: () => navigate('/logs'),
    })),
    ...recentPosts.map((post) => ({
      type: 'post',
      id: `post-${post.id}`,
      title: post.generated_content?.substring(0, 60) + '...',
      subtitle: `${post.tone} tone${post.project_name ? ` · ${post.project_name}` : ''}`,
      time: post.created_at,
      onClick: () => navigate('/posts'),
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  const statCards = [
    { icon: '📁', label: 'Active Projects', value: stats?.projects || 0, color: 'bg-linkedin-blue-subtle text-linkedin-blue' },
    { icon: '📝', label: 'Daily Logs', value: stats?.daily_logs || 0, color: 'bg-status-green-light text-status-green' },
    { icon: '⚡', label: 'Posts Generated', value: stats?.generated_posts || 0, color: 'bg-status-orange-light text-status-orange' },
    {
      icon: '🎯',
      label: 'Log → Post Rate',
      value: stats?.generated_posts && stats?.daily_logs
        ? Math.round((stats.generated_posts / Math.max(stats.daily_logs, 1)) * 100) + '%'
        : '0%',
      color: 'bg-status-purple-light text-status-purple',
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-text-primary mb-1">{getGreeting()} 👋</h2>
        <p className="text-sm text-text-secondary">Here's your PostUp activity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`animate-fade-in animate-fade-in-${i + 1} bg-bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] p-5 transition-all duration-250 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <div className="text-[28px] font-extrabold text-text-primary leading-none mb-1">{card.value}</div>
            <div className="text-[13px] text-text-secondary font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '⚡', title: 'Generate Post', desc: 'Write what you did, get a LinkedIn post', route: '/generate' },
          { icon: '📁', title: 'New Project', desc: 'Start tracking a learning journey', route: '/projects' },
          { icon: '📝', title: 'Add Daily Log', desc: 'Record today\'s progress', route: '/logs' },
        ].map((action, i) => (
          <div
            key={action.title}
            className={`animate-fade-in animate-fade-in-${i + 1} bg-bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] p-6 text-center cursor-pointer transition-all duration-250 border-2 border-transparent hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.1)] hover:border-linkedin-blue hover:-translate-y-0.5 group`}
            onClick={() => navigate(action.route)}
          >
            <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 bg-linkedin-blue-subtle text-linkedin-blue transition-all duration-250 group-hover:bg-linkedin-blue group-hover:text-white">
              {action.icon}
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary mb-1">{action.title}</h3>
            <p className="text-xs text-text-secondary">{action.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="animate-fade-in bg-bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden transition-shadow duration-250 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.1)]">
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Recent Activity</h3>
        </div>

        {activities.length > 0 ? (
          <div className="flex flex-col">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3.5 px-5 py-4 border-b border-border-light last:border-b-0 transition-colors duration-150 cursor-pointer hover:bg-bg-hover"
                onClick={activity.onClick}
              >
                <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-base shrink-0 ${
                  activity.type === 'log'
                    ? 'bg-linkedin-blue-subtle text-linkedin-blue'
                    : 'bg-status-green-light text-status-green'
                }`}>
                  {activity.type === 'log' ? '📝' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-text-primary truncate">{activity.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{activity.subtitle}</p>
                </div>
                <span className="text-[11px] text-text-tertiary whitespace-nowrap shrink-0 pt-0.5">
                  {formatTime(activity.time)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <div className="text-5xl mb-4 opacity-50">🚀</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Welcome to PostUp!</h3>
            <p className="text-sm text-text-secondary mb-5 max-w-[360px] mx-auto">
              Start by creating a project or generating your first LinkedIn post.
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-2xl bg-linkedin-blue text-white transition-all duration-150 hover:bg-linkedin-blue-hover"
              onClick={() => navigate('/generate')}
            >
              Generate Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
