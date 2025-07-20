// import { useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import axios from 'axios';

// const PrivateRoute = ({ children }) => {
//   const [auth, setAuth] = useState(null);

//   useEffect(() => {
//     axios
//       .get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
//         withCredentials: true,
//       })
//       .then((res) => setAuth(Boolean(res.data.username)))
//       .catch(() => setAuth(false));
//   }, []);

//   if (auth === null) return <div>Loading…</div>;
//   return auth ? children : <Navigate to="/login" replace />;
// };

// export default PrivateRoute;

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`https://smart-financial-production.up.railway.app/api/login/session`, {
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
