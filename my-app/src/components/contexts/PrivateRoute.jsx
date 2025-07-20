import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session at:', `${import.meta.env.VITE_BACKEND_URL}/api/login/session`);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
          withCredentials: true,
        });
        console.log('Session response:', res.data);
        setAuthenticated(!!res.data.username);
      } catch (err) {
        console.error('Session check error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
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