import { preloadInternalPages } from '../../App';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setMessage('Google login failed. Please try again.');
      setIsGoogleLoading(false);
      return;
    }

    // If user already has an active session, auto-navigate to /list
    let isMounted = true;
    const checkAlreadyLoggedIn = async () => {
      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://server.khushifinances.com';
        const res = await axios.get(`${apiUrl}/api/login/session`, { withCredentials: true });
        if (isMounted && res.data?.authenticated && res.data?.username) {
          localStorage.setItem('username', res.data.username);
          navigate('/list', { replace: true });
        }
      } catch {
        // Session not active, stay on login page
      }
    };
    checkAlreadyLoggedIn();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
      const res = await axios.post(`${apiUrl}/api/login`, formData, { withCredentials: true });
      if (res.data?.username) {
        localStorage.setItem('username', res.data.username);
        preloadInternalPages();
      }
      setMessage(res.data.message || 'Login successful. Taking you to your businesses.');
      navigate('/list');
    } catch (err) {
      if (err.response?.data?.unverified) {
        const unverifiedEmail = err.response.data.email || formData.email;
        setMessage('Please verify your email address. Taking you to the verification screen...');
        setTimeout(() => {
          navigate('/verify', { state: { email: unverifiedEmail } });
        }, 1400);
        return;
      }
      const msg = err.response?.data?.error || err.response?.data?.message || 'Server error';
      setMessage(`Login failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* Google login */
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = 'https://server.khushifinances.com/api/auth/google';
  };

  // Calculation & Percentage Logic: Form validation & readiness percentage
  const isEmailFilled = Boolean(formData.email && formData.email.trim().length > 0);
  const isPasswordFilled = Boolean(formData.password && formData.password.trim().length > 0);
  const isEmailValid = isEmailFilled && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isUnlatched = isEmailValid && isPasswordFilled;

  let completionPct = 0;
  if (isEmailFilled && isPasswordFilled) {
    completionPct = isEmailValid ? 100 : 75;
  } else if (isEmailFilled || isPasswordFilled) {
    completionPct = 50;
  }

  // Interactive Vault Dial Rotation Calculation
  let dialRotation = 0;
  if (isUnlatched) {
    dialRotation = 330;
  } else if (focusedField === 'password') {
    dialRotation = 250;
  } else if (focusedField === 'email') {
    dialRotation = 120;
  }

  return (
    <div className="sf-login-page">
      <div className="sf-split">
        {/* Left Side: Form */}
        <main className="sf-L">
          <div className="sf-fw">
            {/* Logo */}
            <Link to="/" className="sf-logo" style={{ marginBottom: '40px', textDecoration: 'none', display: 'inline-block' }}>
              <img
                src="/final.png"
                alt="Smart Financials by Khushi Vijay"
                className="sf-nav-logo-img"
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>

            {/* Title & Subtitle */}
            <h1 className="sf-tt" style={{ fontSize: '64px' }}>
              Welcome back.
            </h1>
            <p className="sf-muted" style={{ fontSize: '19px', margin: '14px 0 30px' }}>
              Log in to open your businesses.
            </p>

            {/* Google Authentication Button */}
            <button
              type="button"
              className="sf-btn sf-out"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.5 7l7.3 5.7c4.3-4 6.9-9.9 6.9-17.2z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.6 2.2-8.6 2.2-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
                />
              </svg>
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="sf-dv">or use your email</div>

            {/* Error or Status Alert */}
            {message && (
              <div
                className={`sf-al ${
                  message.toLowerCase().includes('fail') ||
                  message.toLowerCase().includes('error') ||
                  message.toLowerCase().includes('invalid') ||
                  message.toLowerCase().includes('please')
                    ? 'err'
                    : 'ok'
                }`}
                role="alert"
              >
                {message}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="sf-fd">
                <label htmlFor="em">Email</label>
                <input
                  id="em"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={isEmailFilled && !isEmailValid ? 'invalid-input' : ''}
                />
                {isEmailFilled && !isEmailValid && (
                  <p className="sf-hint" style={{ display: 'block' }}>
                    Enter a valid email address.
                  </p>
                )}
              </div>

              <div className="sf-fd">
                <label htmlFor="pw">Password</label>
                <input
                  id="pw"
                  name="password"
                  type="password"
                  required
                  placeholder="Your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>

              {/* Form readiness and vault security percentage indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  marginTop: '10px',
                }}
              >
                <span style={{ color: '#44544B' }}>Vault security check:</span>
                <span style={{ color: completionPct === 100 ? '#0E1A14' : '#44544B' }}>
                  {completionPct}% verified {completionPct === 100 ? '✓' : ''}
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  background: '#E5EBDF',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1.5px solid #0E1A14',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${completionPct}%`,
                    background: completionPct === 100 ? '#C8F135' : '#44544B',
                    transition: 'width 0.3s ease-out, background 0.3s',
                  }}
                />
              </div>

              <button
                type="submit"
                className={`sf-btn ${isLoading ? 'busy' : 'lime'}`}
                style={{ marginTop: '6px' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="sf-sp"></span>
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            {/* Links */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '22px',
                fontSize: '16px',
              }}
            >
              <Link to="/forgot-password" className="sf-lk">
                Forgot password?
              </Link>
              <span>
                New here?{' '}
                <Link to="/register" className="sf-lk">
                  Create an account
                </Link>
              </span>
            </div>

            <p className="sf-muted" style={{ marginTop: '34px', fontSize: '14px' }}>
              Your password is never stored as plain text. You stay logged in on this device for 24 hours.
            </p>
          </div>
        </main>

        {/* Right Side: Interactive Vault Door Showcase */}
        <aside className="sf-R">
          <div
            className="sf-stage"
            role="img"
            aria-label="A vault door. While you type, the dial turns. Once your email and password are filled in, the door unlatches, ready for you to press Log in."
          >
            {/* Vault interior with businesses */}
            <div className="sf-inner">
              <small>Your businesses</small>
              <b>
                nav shop
                <br />
                New shop 3
                <br />
                Animal food
                <br />
                Ai agency
              </b>
            </div>

            {/* Vault door SVG */}
            <svg
              className="sf-door"
              viewBox="0 0 500 500"
              aria-hidden="true"
              style={{
                transform: isUnlatched ? 'rotateY(26deg)' : 'none',
              }}
            >
              <circle cx="250" cy="250" r="250" fill="#0E1A14" stroke="#2C3F34" strokeWidth="2" />
              <circle cx="250" cy="250" r="226" fill="none" stroke="#2C3F34" strokeWidth="6" />
              <circle cx="250" cy="250" r="168" fill="none" stroke="#2C3F34" strokeWidth="6" />
              <circle cx="447.0" cy="250.0" r="9" fill="#44544B" />
              <circle cx="389.3" cy="389.3" r="9" fill="#44544B" />
              <circle cx="250.0" cy="447.0" r="9" fill="#44544B" />
              <circle cx="110.7" cy="389.3" r="9" fill="#44544B" />
              <circle cx="53.0" cy="250.0" r="9" fill="#44544B" />
              <circle cx="110.7" cy="110.7" r="9" fill="#44544B" />
              <circle cx="250.0" cy="53.0" r="9" fill="#44544B" />
              <circle cx="389.3" cy="110.7" r="9" fill="#44544B" />

              {/* Turning Dial */}
              <g
                className="sf-dial"
                style={{
                  transform: `rotate(${dialRotation}deg)`,
                  transformOrigin: '250px 250px',
                }}
              >
                <circle cx="250" cy="250" r="100" fill="#C8F135" stroke="#0E1A14" strokeWidth="6" />
                <line
                  x1="330.0"
                  y1="250.0"
                  x2="340.0"
                  y2="250.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="319.3"
                  y1="290.0"
                  x2="327.9"
                  y2="295.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="290.0"
                  y1="319.3"
                  x2="295.0"
                  y2="327.9"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="250.0"
                  y1="330.0"
                  x2="250.0"
                  y2="340.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="210.0"
                  y1="319.3"
                  x2="205.0"
                  y2="327.9"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="180.7"
                  y1="290.0"
                  x2="172.1"
                  y2="295.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="170.0"
                  y1="250.0"
                  x2="160.0"
                  y2="250.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="180.7"
                  y1="210.0"
                  x2="172.1"
                  y2="205.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="210.0"
                  y1="180.7"
                  x2="205.0"
                  y2="172.1"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="250.0"
                  y1="170.0"
                  x2="250.0"
                  y2="160.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="290.0"
                  y1="180.7"
                  x2="295.0"
                  y2="172.1"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="319.3"
                  y1="210.0"
                  x2="327.9"
                  y2="205.0"
                  stroke="#0E1A14"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="250.0"
                  y2="316.0"
                  stroke="#0E1A14"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="192.8"
                  y2="217.0"
                  stroke="#0E1A14"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="307.2"
                  y2="217.0"
                  stroke="#0E1A14"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <circle cx="250" cy="250" r="16" fill="#0E1A14" />
              </g>
              <path d="M250 148l-11-24h22z" fill="#F2F5EE" />
            </svg>
          </div>

          {/* Dynamic Status Text */}
          <p
            style={{
              marginTop: '22px',
              fontWeight: 600,
              fontSize: '16px',
              color: '#C8F135',
              minHeight: '24px',
            }}
          >
            {isUnlatched ? (
              <span className="sf-c2">Unlatched. Press Log in to open.</span>
            ) : (
              <span className="sf-c1">Sealed. Log in to open your vaults.</span>
            )}
          </p>

          {/* Value Propositions */}
          <div className="sf-vp">
            <p>Track every transaction in double-entry books.</p>
            <p>Manage multiple businesses with one login.</p>
            <p style={{ borderBottom: '1px solid #2C3F34' }}>
              Ask your books questions and get AI-powered insights.
            </p>
          </div>
        </aside>
      </div>

      {/* Scoped Brutalist Styling Matching Stitch */}
      <style>{`
        .sf-login-page {
          background: #F2F5EE;
          font-family: 'Instrument Sans', system-ui, sans-serif;
          color: #0E1A14;
          min-height: 100vh;
          width: 100%;
          -webkit-font-smoothing: antialiased;
        }

        .sf-login-page h1,
        .sf-login-page h2 {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          margin: 0;
          letter-spacing: -0.04em;
          line-height: .98;
          font-weight: 800;
        }

        .sf-login-page p {
          margin: 0;
          line-height: 1.5;
        }

        .sf-login-page a {
          color: inherit;
          text-decoration: none;
        }

        .sf-login-page a:focus-visible,
        .sf-login-page input:focus-visible,
        .sf-login-page button:focus-visible {
          outline: 3px solid #0E1A14;
          outline-offset: 3px;
        }

        .sf-muted {
          color: #44544B;
        }

        .sf-split {
          display: flex;
          flex-wrap: wrap;
          min-height: 860px;
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
          gap: 10px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 24px;
          letter-spacing: -0.04em;
          color: #0E1A14;
        }

        .sf-logo small {
          display: block;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0;
          color: #44544B;
          margin-top: 1px;
        }

        .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
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

        .sf-btn.sf-out {
          background: #fff;
          color: #0E1A14;
        }

        .sf-btn.sf-out:hover:not(:disabled) {
          background: #E4EBDC;
        }

        .sf-btn.busy {
          background: #E5EBDF;
          cursor: progress;
          transform: none;
          color: #0E1A14;
        }

        .sf-dv {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 22px 0;
          font-size: 14px;
          font-weight: 600;
          color: #44544B;
        }

        .sf-dv::before,
        .sf-dv::after {
          content: "";
          flex: 1;
          border-top: 1px solid #B8C4B1;
        }

        .sf-fd {
          margin-bottom: 18px;
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
          transition: background .15s, border-color .15s;
        }

        .sf-fd input:focus {
          background: #FBFFE6;
        }

        .sf-fd input.invalid-input {
          border-style: dashed;
          background: #FBEBD0;
        }

        .sf-hint {
          margin-top: 7px;
          font-size: 14px;
          font-weight: 600;
          padding: 6px 10px;
          background: #F2B66B;
          border: 2px solid #0E1A14;
          border-radius: 4px;
          color: #0E1A14;
        }

        .sf-al {
          padding: 14px 16px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 18px;
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
        }

        .sf-lk:hover {
          background: #C8F135;
        }

        .sf-sp {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid #0E1A14;
          border-top-color: transparent;
          border-radius: 50%;
          animation: sf-spin .8s linear infinite;
        }

        @keyframes sf-spin {
          to { transform: rotate(360deg); }
        }

        /* Vault Stage */
        .sf-stage {
          position: relative;
          width: 340px;
          max-width: 100%;
          aspect-ratio: 1;
          perspective: 1300px;
        }

        .sf-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 12px solid #2C3F34;
          background: #E4EBDC;
          color: #0E1A14;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-align: center;
        }

        .sf-inner small {
          font-size: 13px;
          font-weight: 600;
          color: #44544B;
        }

        .sf-inner b {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.03em;
          line-height: 1.25;
        }

        .sf-door {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          transition: transform .6s cubic-bezier(.4,0,.2,1);
        }

        .sf-dial {
          transform-origin: 250px 250px;
          transition: transform .5s cubic-bezier(.4,0,.2,1);
        }

        .sf-vp {
          margin-top: 38px;
          max-width: 420px;
          width: 100%;
        }

        .sf-vp p {
          padding: 12px 0;
          border-top: 1px solid #2C3F34;
          font-size: 17px;
          color: #F2F5EE;
        }

        @media (max-width: 900px) {
          .sf-L, .sf-R {
            padding: 32px 24px;
          }
          .sf-tt {
            font-size: 44px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sf-login-page * {
            animation: none !important;
            transition: none !important;
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
