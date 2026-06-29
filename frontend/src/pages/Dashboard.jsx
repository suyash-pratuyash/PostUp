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
      <div className="page-container">
        <div className="dashboard-header" style={{ marginBottom: '24px' }}>
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-text short" />
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header fade-in">
        <h2>{getGreeting()} 👋</h2>
        <p>Here's your PostUp activity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card fade-in fade-in-delay-1">
          <div className="stat-card-icon blue">📁</div>
          <div className="stat-card-number">{stats?.projects || 0}</div>
          <div className="stat-card-label">Active Projects</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-2">
          <div className="stat-card-icon green">📝</div>
          <div className="stat-card-number">{stats?.daily_logs || 0}</div>
          <div className="stat-card-label">Daily Logs</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-3">
          <div className="stat-card-icon orange">⚡</div>
          <div className="stat-card-number">{stats?.generated_posts || 0}</div>
          <div className="stat-card-label">Posts Generated</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-4">
          <div className="stat-card-icon purple">🎯</div>
          <div className="stat-card-number">
            {stats?.generated_posts && stats?.daily_logs
              ? Math.round((stats.generated_posts / Math.max(stats.daily_logs, 1)) * 100)
              : 0}%
          </div>
          <div className="stat-card-label">Log → Post Rate</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card fade-in fade-in-delay-1" onClick={() => navigate('/generate')}>
          <div className="action-icon">⚡</div>
          <h3>Generate Post</h3>
          <p>Write what you did, get a LinkedIn post</p>
        </div>
        <div className="action-card fade-in fade-in-delay-2" onClick={() => navigate('/projects')}>
          <div className="action-icon">📁</div>
          <h3>New Project</h3>
          <p>Start tracking a learning journey</p>
        </div>
        <div className="action-card fade-in fade-in-delay-3" onClick={() => navigate('/logs')}>
          <div className="action-icon">📝</div>
          <h3>Add Daily Log</h3>
          <p>Record today's progress</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card fade-in">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        {activities.length > 0 ? (
          <div className="activity-list">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="activity-item"
                onClick={activity.onClick}
              >
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'log' ? '📝' : '📄'}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.subtitle}</p>
                </div>
                <span className="activity-time">{formatTime(activity.time)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h3>Welcome to PostUp!</h3>
            <p>Start by creating a project or generating your first LinkedIn post.</p>
            <button className="btn btn-primary" onClick={() => navigate('/generate')}>
              Generate Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
