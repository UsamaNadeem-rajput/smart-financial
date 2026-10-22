// src/components/auth/ForgotPassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function ForgotPassword() {
  const [stage, setStage] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const api = import.meta.env.VITE_BACKEND_URL;

  const isEmailValid = /^[^s@]+@[^s@]+.[^s@]+$/.test(email.trim());

  const sendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await axios.post(`${api}/api/authreset/forgot-password`, { email: cleanEmail });
      setMessage(res.data?.message || 'Reset code sent. Please check your inbox.');
      setIsError(false);
      setStage('reset');
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to send reset code');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await axios.post(`${api}/api/authreset/reset-password`, { 
        email: cleanEmail, 
        code: code.trim(), 
        newPassword 
      });
      setMessage(res.data.message || 'Password reset successfully! Redirecting to login...');
      setIsError(false);
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Reset failed');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // Password strength logic
  let passwordStrength = 'weak';
  if (newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) {
    passwordStrength = 'strong';
  } else if (newPassword.length >= 6) {
    passwordStrength = 'fair';
  }

  return (
    <div className="sf-forgot-page">
      <div className="sf-split">
        {/* Left Side: Form Container */}
        <main className="sf-L">
          <div className="sf-fw">
            {/* Top Bar: Logo and Back to login in the same row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '32px',
                width: '100%'
              }}
            >
              <Link to="/" className="sf-logo" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                <img
                  src="/final.png"
                  alt="Smart Financials by Khushi Vijay"
                  className="sf-nav-logo-img"
                  style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>

              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0E1A14',
                  background: '#FFFFFF',
                  border: '1.5px solid #0E1A14',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  boxShadow: '2px 2px 0 #0E1A14',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to login</span>
              </Link>
            </div>

            {/* Step Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: stage === 'reset' ? '#C8F135' : '#E8EFE2',
                border: '2px solid #0E1A14',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '2px 2px 0 #0E1A14',
                marginBottom: '16px',
                width: 'fit-content',
              }}
            >
              {stage === 'email' ? 'Step 1 of 2: Identity Verification' : 'Step 2 of 2: Key Rotation'}
            </div>

            {/* Title & Subtitle */}
            <h1 className="sf-tt" style={{ fontSize: 'clamp(38px, 4.5vw, 56px)' }}>
              {stage === 'email' ? 'Recover access.' : 'Set new key.'}
            </h1>
            <p className="sf-muted" style={{ fontSize: '18px', margin: '14px 0 28px', lineHeight: 1.45 }}>
              {stage === 'email'
                ? 'Enter your registered email address and we will dispatch a 6-digit recovery code.'
                : 'Enter the 6-digit recovery code sent to your email, along with your new password.'}
            </p>

            {/* Status Alert Banner */}
            {message && (
              <div
                className={`sf-al ${isError ? 'err' : 'ok'}`}
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {isError ? (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#0E1A14]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#0E1A14]" />
                )}
                <span style={{ fontSize: '15px' }}>{message}</span>
              </div>
            )}

            {/* Stage 1: Email Request Form */}
            {stage === 'email' ? (
              <form onSubmit={sendEmail}>
                <div className="sf-fd">
                  <label htmlFor="recovery-email">Account Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="recovery-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {email && !isEmailValid && (
                    <p className="sf-hint" style={{ display: 'block' }}>
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`sf-btn ${loading ? 'busy' : 'lime'}`}
                  style={{ marginTop: '8px' }}
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <span className="sf-sp"></span>
                      <span>Sending reset code...</span>
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            ) : (
              /* Stage 2: Code & New Password Form */
              <form onSubmit={submitReset}>
                {/* Email recap banner */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#FFFFFF',
                    border: '2px solid #0E1A14',
                    borderRadius: '6px',
                    boxShadow: '3px 3px 0 #0E1A14',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: '#44544B', fontSize: '12px', display: 'block', fontWeight: 600 }}>
                      Code dispatched to:
                    </span>
                    <strong style={{ color: '#0E1A14', wordBreak: 'break-all' }}>{email}</strong>
                  </div>
                  <button
                    type="button"
                    className="sf-lk"
                    style={{ fontSize: '12px', cursor: 'pointer', background: 'none', border: 'none', padding: '0 0 2px' }}
                    onClick={() => {
                      setStage('email');
                      setMessage('');
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* 6-Digit Code Input */}
                <div className="sf-fd">
                  <label htmlFor="recovery-code">6-Digit Verification Code</label>
                  <input
                    id="recovery-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    autoComplete="one-time-code"
                    autoFocus
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                    }}
                  />
                </div>

                {/* New Password Input */}
                <div className="sf-fd">
                  <label htmlFor="new-password">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#44544B',
                        padding: '4px',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', height: '5px' }}>
                        <div
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: '#0E1A14',
                          }}
                        ></div>
                        <div
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: passwordStrength === 'fair' || passwordStrength === 'strong' ? '#C8F135' : '#D1D8CB',
                          }}
                        ></div>
                        <div
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: passwordStrength === 'strong' ? '#C8F135' : '#D1D8CB',
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#44544B', marginTop: '4px', display: 'block' }}>
                        Strength: <b>{passwordStrength.toUpperCase()}</b>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`sf-btn ${loading ? 'busy' : 'lime'}`}
                  style={{ marginTop: '8px' }}
                  disabled={loading || !code || !newPassword}
                >
                  {loading ? (
                    <>
                      <span className="sf-sp"></span>
                      <span>Updating password...</span>
                    </>
                  ) : (
                    'Reset Password & Log In'
                  )}
                </button>
              </form>
            )}

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '28px',
                fontSize: '15px',
              }}
            >
              <span>
                Remembered your password?{' '}
                <Link to="/login" className="sf-lk">
                  Log in
                </Link>
              </span>
              <span>
                Need help?{' '}
                <Link to="/contact" className="sf-lk">
                  Support Hub
                </Link>
              </span>
            </div>

            <p className="sf-muted" style={{ marginTop: '36px', fontSize: '13px', lineHeight: 1.5 }}>
              Security protocol: Reset tokens are strictly cryptographically verified and expire automatically.
              Smart Financial will never ask you for your recovery code via phone or email.
            </p>
          </div>
        </main>

        {/* Right Side: Interactive Vault Recovery Visualization */}
        <aside className="sf-R">
          <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
            {/* Vault Dial / Graphic */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: '#16281F',
                border: '3px solid #C8F135',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '36px',
                boxShadow: '0 0 24px rgba(200, 241, 53, 0.15)',
                position: 'relative',
                transition: 'transform 0.4s ease',
                transform: stage === 'reset' ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              {stage === 'email' ? (
                <KeyRound className="w-12 h-12 text-[#C8F135]" />
              ) : (
                <Lock className="w-12 h-12 text-[#C8F135]" />
              )}
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#C8F135',
                }}
              ></div>
            </div>

            <h2 style={{ fontSize: '42px', lineHeight: 1.05, marginBottom: '20px' }}>
              Vault access recovery.
            </h2>

            <p style={{ color: '#B8C7BC', fontSize: '16px', lineHeight: 1.5, marginBottom: '28px' }}>
              Account security is anchored in relational ledger encryption. Follow the verification steps to regain vault access.
            </p>

            {/* Recovery Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  border: '2px solid #2C3F34',
                  background: stage === 'email' ? '#1D3025' : '#14221A',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: stage === 'reset' ? '#C8F135' : '#2C3F34',
                    color: '#0E1A14',
                    fontWeight: 700,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {stage === 'reset' ? '✓' : '1'}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F2F5EE', margin: 0 }}>
                    Email Verification
                  </h3>
                  <p style={{ fontSize: '13px', color: '#8FA196', margin: '3px 0 0' }}>
                    Confirm your registered email address to receive an authorization token.
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  border: '2px solid #2C3F34',
                  background: stage === 'reset' ? '#1D3025' : '#14221A',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: stage === 'reset' ? '#C8F135' : '#2C3F34',
                    color: '#0E1A14',
                    fontWeight: 700,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F2F5EE', margin: 0 }}>
                    Token Authentication & Rotation
                  </h3>
                  <p style={{ fontSize: '13px', color: '#8FA196', margin: '3px 0 0' }}>
                    Supply the 6-digit code and replace your encryption key with a new password.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom trust assurance */}
            <div
              style={{
                marginTop: '36px',
                paddingTop: '20px',
                borderTop: '1px solid #2C3F34',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#8FA196',
                fontSize: '13px',
              }}
            >
              <ShieldCheck className="w-5 h-5 text-[#C8F135] flex-shrink-0" />
              <span>ACID double-entry transactions and ledger vaults remain strictly isolated.</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Scoped Brutalist Styling Matching Stitch Auth */}
      <style>{`
        .sf-forgot-page {
          background: #F2F5EE;
          font-family: 'Instrument Sans', system-ui, sans-serif;
          color: #0E1A14;
          min-height: 100vh;
          width: 100%;
          -webkit-font-smoothing: antialiased;
        }

        .sf-forgot-page h1,
        .sf-forgot-page h2 {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          margin: 0;
          letter-spacing: -0.04em;
          line-height: .98;
          font-weight: 800;
        }

        .sf-forgot-page p {
          margin: 0;
          line-height: 1.5;
        }

        .sf-forgot-page a {
          color: inherit;
          text-decoration: none;
        }

        .sf-forgot-page a:focus-visible,
        .sf-forgot-page input:focus-visible,
        .sf-forgot-page button:focus-visible {
          outline: 3px solid #0E1A14;
          outline-offset: 3px;
        }

        .sf-muted {
          color: #44544B;
        }

        .sf-split {
          display: flex;
          flex-wrap: wrap;
          min-height: 100vh;
        }

        .sf-L {
          flex: 1 1 560px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 64px;
          box-sizing: border-box;
        }

        .sf-R {
          flex: 1 1 560px;
          background: #0E1A14;
          color: #F2F5EE;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
          box-sizing: border-box;
          position: relative;
        }

        .sf-fw {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
        }

        .sf-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .sf-logo span {
          display: flex;
          flex-direction: column;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .sf-logo small {
          font-size: 11px;
          font-weight: 500;
          color: #44544B;
          letter-spacing: 0;
          margin-top: 2px;
        }

        .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 54px;
          padding: 0 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 17px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          box-sizing: border-box;
          transition: transform .15s ease-out, background .15s;
          user-select: none;
        }

        .sf-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .sf-btn.lime {
          background: #C8F135;
          color: #0E1A14;
        }

        .sf-btn.busy {
          background: #E5EBDF;
          cursor: progress;
          transform: none;
          color: #0E1A14;
        }

        .sf-fd {
          margin-bottom: 20px;
        }

        .sf-fd label {
          display: block;
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 7px;
          color: #0E1A14;
        }

        .sf-fd input {
          width: 100%;
          box-sizing: border-box;
          min-height: 54px;
          padding: 0 16px;
          font-size: 17px;
          font-family: inherit;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          color: #0E1A14;
          transition: box-shadow .15s, border-color .15s;
        }

        .sf-fd input:focus {
          outline: none;
          box-shadow: 0 0 0 3px #C8F135;
        }

        .sf-hint {
          font-size: 13px;
          color: #C0392B;
          margin-top: 6px;
          font-weight: 500;
        }

        .sf-al {
          padding: 14px 16px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 20px;
          box-shadow: 3px 3px 0 #0E1A14;
          color: #0E1A14;
        }

        .sf-al.err {
          background: #F2B66B;
        }

        .sf-al.ok {
          background: #C8F135;
        }

        .sf-lk {
          font-weight: 600;
          border-bottom: 2px solid #0E1A14;
          color: #0E1A14;
          padding-bottom: 1px;
          transition: background .15s;
          text-decoration: none;
        }

        .sf-lk:hover {
          background: #C8F135;
        }

        .sf-sp {
          width: 18px;
          height: 18px;
          border: 2px solid #0E1A14;
          border-top-color: transparent;
          border-radius: 50%;
          animation: sfSpin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes sfSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .sf-L {
            padding: 36px 24px;
          }
          .sf-R {
            padding: 40px 24px;
          }
        }
      
        .sf-nav-logo-img {
          height: 48px;
          width: auto;
          max-width: 200px;
          object-fit: contain;
          display: block;
          transition: transform .15s ease;
        }
        .sf-logo:hover .sf-nav-logo-img {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
