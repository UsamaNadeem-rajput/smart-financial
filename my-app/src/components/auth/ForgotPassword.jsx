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
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-900"
      style={{
        minHeight: "100vh",
        width: "100%"
      }}
    >
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 via-transparent to-cyan-800/20"></div>

        {/* Professional grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>

          {/* Network connection lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
            <defs>
              <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              d="M100,100 L300,200 L600,150 L900,300 L1200,200"
              stroke="url(#networkGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M200,400 L500,300 L800,450 L1100,350"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>

        {/* Subtle overlay for content readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Forgot password</h2>
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
  </div>
  );
}
