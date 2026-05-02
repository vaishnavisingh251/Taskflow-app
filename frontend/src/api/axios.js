import axios from 'axios';

const api = axios.create({
  baseURL: 'taskflow-app-production-bf6b.up.railway.app',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to handle paginated task responses (backwards compatible)
export const fetchTasks = async (params = {}) => {
  const { data } = await api.get('/tasks', { params });
  // handle both old array response and new paginated response
  return Array.isArray(data) ? data : data.tasks;
};

export default api;
