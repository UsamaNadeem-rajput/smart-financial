import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Global Axios Interceptor: Passes x-user-session header so sessions work even if browsers block cross-site cookies
axios.interceptors.request.use((config) => {
  try {
    const username = localStorage.getItem('username');
    if (username) {
      config.headers['x-user-session'] = username;
    }
  } catch {
    // ignore
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <App />
)

