import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import PageLoader from '../common/PageLoader';

const PrivateRoute = ({ children }) => {
  // Synchronously check URL param (e.g. from Google OAuth) or localStorage
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUser = params.get('username');
      if (urlUser) {
        localStorage.setItem('username', urlUser);
        return true;
      }
      const hasLocalUser = Boolean(localStorage.getItem('username') || localStorage.getItem('user'));
      // If we have cached local auth, start as true (no flash). If not, wait for session check (null).
      return hasLocalUser ? true : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
          withCredentials: true,
        });
        if (isMounted) {
          if (res.data?.username) {
            setAuthenticated(true);
            localStorage.setItem('username', res.data.username);
          } else {
            setAuthenticated(false);
            localStorage.removeItem('username');
          }
        }
      } catch (err) {
        if (isMounted) {
          // If the server explicitly rejected the session with 401, remove local state and redirect
          if (err.response?.status === 401) {
            setAuthenticated(false);
            localStorage.removeItem('username');
          } else if (localStorage.getItem('username')) {
            // If it's a rate limit (429) or transient network issue, preserve existing logged in state
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (authenticated === null) return <PageLoader />;
  return authenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
