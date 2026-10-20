import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import PageLoader from '../common/PageLoader';

const PrivateRoute = ({ children }) => {
  // Synchronously initialize auth state from localStorage to prevent loading flash
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return Boolean(localStorage.getItem('username') || localStorage.getItem('user'));
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
      } catch {
        if (isMounted) {
          setAuthenticated(false);
          localStorage.removeItem('username');
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
