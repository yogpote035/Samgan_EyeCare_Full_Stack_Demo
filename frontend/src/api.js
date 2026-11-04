import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://samgan-eyecare-full-stack-demo.onrender.com/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('sec_token'); if (t) c.headers.Authorization = 'Bearer ' + t; return c; });
api.interceptors.response.use(r => r, e => { if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) { localStorage.removeItem('sec_token'); location.assign('/login'); } return Promise.reject(e); });
export const errMsg = e => e.response?.data?.error || 'Cannot reach the server. Is the backend running?';
export default api;
