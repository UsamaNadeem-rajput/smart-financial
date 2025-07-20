import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const backendUrl = `${import.meta.env.VITE_BACKEND_URL}/api/login/session`;
        console.log('Checking session at:', backendUrl);
        const res = await axios.get(backendUrl, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        console.log('Session response:', res.data, 'Cookies:', document.cookie, 'Headers:', res.headers);
        setAuthenticated(!!res.data.username);
      } catch (err) {
        console.error('Session check error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
          cookies: document.cookie,
          message: err.message,
        });
        setAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  if (authenticated === null) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;