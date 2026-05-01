const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ein Fehler ist aufgetreten.');
  }

  return data;
}

export const api = {
  // Auth
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),

  // Profiles
  getProfile: (id) => apiRequest(`/profiles/${id}`),
  updateProfile: (data) => apiRequest('/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Search
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/search?${query}`);
  },

  // Matches
  createMatch: (data) => apiRequest('/matches', { method: 'POST', body: JSON.stringify(data) }),
  getMatches: () => apiRequest('/matches'),
  updateMatch: (id, data) => apiRequest(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Messages
  getMessages: (matchId) => apiRequest(`/messages/${matchId}`),
  sendMessage: (matchId, content) => apiRequest(`/messages/${matchId}`, { method: 'POST', body: JSON.stringify({ content }) }),
};
