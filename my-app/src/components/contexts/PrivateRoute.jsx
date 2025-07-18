import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/login/session`, {
          withCredentials: true,
        });
        if (res.data.username) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (err) {
        setAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  if (authenticated === null) return null; // Or a spinner

  return authenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
