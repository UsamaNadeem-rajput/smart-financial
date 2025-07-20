import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
        withCredentials: true,
      })
      .then((res) => setAuth(Boolean(res.data.username)))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div>Loading…</div>;
  return auth ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;