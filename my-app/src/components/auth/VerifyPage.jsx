import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const handleVerify = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/verify`, {
        email,
        code
      });
      setMessage(res.data.message);
      setTimeout(() => navigate('/business'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div className="container mt-5">
      <h3>Email Verification</h3>
      <p>We sent a code to: <b>{email}</b></p>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Enter verification code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleVerify} className="btn btn-primary">Verify</button>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}
