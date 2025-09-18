// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [stage, setStage] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const api = import.meta.env.VITE_BACKEND_URL;

  const sendEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      await axios.post(`${api}/api/authreset/forgot-password`, { email });
      setMessage('Reset code sent (if email exists). Check your inbox.');
      setStage('reset');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await axios.post(`${api}/api/authreset/reset-password`, { email, code, newPassword });
      setMessage(res.data.message);
      // Optionally redirect to login
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Forgot password</h2>
      {stage === 'email' ? (
        <form onSubmit={sendEmail}>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter your email" required className="input-field"/>
          <button disabled={loading} className="btn-primary mt-2">{loading ? 'Sending...' : 'Send reset code'}</button>
        </form>
      ) : (
        <form onSubmit={submitReset}>
          <p>Code sent to <strong>{email}</strong>. Enter it below with new password.</p>
          <input value={code} onChange={e => setCode(e.target.value)} type="text" placeholder="6-digit code" required className="input-field"/>
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="New password" required className="input-field"/>
          <button disabled={loading} className="btn-primary mt-2">{loading ? 'Resetting...' : 'Reset password'}</button>
        </form>
      )}
      {message && <div className="mt-3 text-sm">{message}</div>}
    </div>
  );
}
