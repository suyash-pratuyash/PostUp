const API_BASE = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ─── Health ───
export const getHealth = () => request('/health');

// ─── Projects ───
export const getProjects = () => request('/projects');
export const getProject = (id) => request(`/projects/${id}`);
export const createProject = (data) => request('/projects', { method: 'POST', body: data });
export const updateProject = (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data });
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' });

// ─── Daily Logs ───
export const getLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/logs${query ? `?${query}` : ''}`);
};
export const getLog = (id) => request(`/logs/${id}`);
export const createLog = (data) => request('/logs', { method: 'POST', body: data });
export const updateLog = (id, data) => request(`/logs/${id}`, { method: 'PUT', body: data });
export const deleteLog = (id) => request(`/logs/${id}`, { method: 'DELETE' });

// ─── Posts ───
export const getPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/posts${query ? `?${query}` : ''}`);
};
export const getPost = (id) => request(`/posts/${id}`);
export const generatePost = (data) => request('/posts/generate', { method: 'POST', body: data });
export const regeneratePost = (data) => request('/posts/regenerate', { method: 'POST', body: data });
export const generateProjectOverview = (data) => request('/posts/project-overview', { method: 'POST', body: data });
export const toggleFavorite = (id) => request(`/posts/${id}/favorite`, { method: 'PUT' });
export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' });
