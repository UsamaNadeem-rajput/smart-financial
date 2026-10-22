import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  Check
} from 'lucide-react';

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Email passed from SignupForm state or fallback query / session storage
  const queryEmail = new URLSearchParams(location.search).get('email') || '';
  const storedEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('pending_verify_email') || localStorage.getItem('pending_verify_email') || '') : '';
  const initialEmail = (location.state?.email || queryEmail || storedEmail || '').trim();
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [newEmailInput, setNewEmailInput] = useState(initialEmail);

  // Persist email in sessionStorage if available
  useEffect(() => {
    if (email) {
      sessionStorage.setItem('pending_verify_email', email);
    }
  }, [email]);

  // 6-digit OTP code state
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned[cleaned.length - 1];
    setDigits(nextDigits);

    // Auto advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste full code (e.g. "123456" or "123-456")
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasteData[i] || '';
    }
    setDigits(nextDigits);

    const focusIdx = Math.min(pasteData.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasteData.length === 6 && email) {
      triggerVerification(pasteData);
    }
  };

  const currentCode = digits.join('');
  const filledCount = digits.filter((d) => d !== '').length;

  // Trigger verify API
  const triggerVerification = async (codeToVerify) => {
    const code = codeToVerify || currentCode;
    const targetEmail = (email || newEmailInput || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_verify_email') : '') || '').trim();

    if (!targetEmail) {
      setIsEditingEmail(true);
      setMessage('Please enter your email address to verify.');
      setIsSuccess(false);
      return;
    }
    if (code.length < 6) {
      setMessage('Please enter all 6 digits of your verification code.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${apiUrl}/api/verify`, {
        email: targetEmail,
        code
      });

      setIsSuccess(true);
      setMessage(res.data.message || 'Account verified successfully!');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_verify_email');
      }
      setTimeout(() => {
        navigate('/list');
      }, 1600);
    } catch (err) {
      setIsSuccess(false);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Verification failed. Please check the code.';
      setMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    triggerVerification();
  };

  // Resend Verification Code with dual fallback and 24h limit error support
  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;

    const targetEmail = (email || newEmailInput || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_verify_email') : '') || '').trim();
    if (!targetEmail) {
      setIsEditingEmail(true);
      setMessage('Please enter your email address so we can send a new code.');
      setIsSuccess(false);
      return;
    }

    setIsResending(true);
    setMessage('');
    try {
      let res;
      try {
        // Try dedicated resend route first
        res = await axios.post(`${apiUrl}/api/verify/resend`, { email: targetEmail });
      } catch (firstErr) {
        // If 404 (endpoint not deployed yet on remote server), fallback to POST /api/verify
        if (firstErr.response && firstErr.response.status === 404) {
          res = await axios.post(`${apiUrl}/api/verify`, {
            email: targetEmail,
            action: 'resend',
            resend: true
          });
        } else {
          throw firstErr;
        }
      }

      setMessage(res.data.message || 'A fresh verification code was sent to your email.');
      setIsSuccess(true);
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setIsSuccess(false);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to resend code. Please try again.';
      setMessage(errMsg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveEmail = () => {
    const trimmed = newEmailInput.trim();
    if (trimmed) {
      setEmail(trimmed);
      sessionStorage.setItem('pending_verify_email', trimmed);
      setIsEditingEmail(false);
      setMessage('');
    }
  };

  return (
    <div className="sf-verify-page font-sans">
      <div className="sf-split">
        {/* Left Panel: Verification Form (Clean, perfectly aligned, zero horizontal scroll) */}
        <main className="sf-L">
          <div className="sf-fw">
            {/* Top Bar: Logo on left, Back to Login on right in one line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '28px',
                width: '100%'
              }}
            >
              <Link
                to="/"
                className="sf-logo"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                <img
                  src="/final.png"
                  alt="Smart Financials by Khushi Vijay"
                  className="sf-nav-logo-img"
                  style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
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
                <ArrowLeft size={14} /> Back to Log In
              </Link>
            </div>

            {/* Title & Context */}
            <h1 className="sf-tt" style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginBottom: '10px' }}>
              Check your inbox.
            </h1>
            <p className="sf-muted" style={{ fontSize: '15px', marginBottom: '20px', lineHeight: 1.5 }}>
              We dispatched a 6-digit security code to your email. Enter the code below to verify your account and unlock your financial vault.
            </p>

            {/* Target Email Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '2px solid #0E1A14',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                boxShadow: '2px 2px 0 #0E1A14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    background: '#C8F135',
                    border: '1.5px solid #0E1A14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Mail size={16} color="#0E1A14" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#44544B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Code Dispatched To
                  </div>
                  {isEditingEmail ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '4px 6px',
                          border: '1.5px solid #0E1A14',
                          borderRadius: '4px',
                          background: '#FBFFE6',
                          color: '#0E1A14',
                          width: '100%',
                          maxWidth: '190px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="sf-btn sf-btn-lime"
                        style={{ minHeight: '28px', padding: '0 10px', fontSize: '12px' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0E1A14',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {email || 'No email provided'}
                    </div>
                  )}
                </div>
              </div>

              {!isEditingEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput(email);
                    setIsEditingEmail(true);
                  }}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0E1A14',
                    background: '#F2F5EE',
                    border: '1.5px solid #0E1A14',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Change
                </button>
              )}
            </div>

            {/* Status Alert Notification */}
            {message && (
              <div
                className={`sf-al ${isSuccess ? 'ok' : 'err'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
                role="alert"
              >
                {isSuccess ? (
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="flex-shrink-0" />
                )}
                <div style={{ flex: 1, fontSize: '14px' }}>{message}</div>
              </div>
            )}

            {/* OTP Form (Boxes and Button exactly locked to 304px width) */}
            <form onSubmit={handleVerifySubmit} noValidate style={{ boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#0E1A14',
                    marginBottom: '10px'
                  }}
                >
                  Enter 6-Digit Code <span aria-hidden="true">*</span>
                </label>

                {/* 6 Digit Cells: Exactly 44px each, constrained track, no overflow */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 44px)',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '304px',
                    boxSizing: 'border-box'
                  }}
                  onPaste={handlePaste}
                >
                  {digits.map((digit, idx) => {
                    const isFilled = Boolean(digit);
                    return (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        autoComplete="one-time-code"
                        aria-label={`Digit ${idx + 1}`}
                        style={{
                          width: '44px',
                          minWidth: '44px',
                          maxWidth: '44px',
                          height: '46px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: 700,
                          fontFamily: "'Courier New', Courier, monospace",
                          border: '2px solid #0E1A14',
                          borderRadius: '6px',
                          background: isFilled ? '#FBFFE6' : '#FFFFFF',
                          color: '#0E1A14',
                          boxShadow: isFilled ? '2px 2px 0 #0E1A14' : 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          transition: 'all 0.15s ease'
                        }}
                        className="sf-otp-box"
                      />
                    );
                  })}
                </div>

                <p style={{ marginTop: '8px', fontSize: '13px', color: '#44544B' }}>
                  Paste or type the 6 digits sent to your inbox.
                </p>
              </div>

              {/* Verify Button (Directly aligned with 304px input row) */}
              <button
                type="submit"
                disabled={isLoading || isSuccess || filledCount < 6}
                className="sf-btn sf-btn-lime"
                style={{
                  width: '100%',
                  maxWidth: '304px',
                  minHeight: '46px',
                  boxShadow: '2px 2px 0 #0E1A14',
                  fontSize: '15px',
                  fontWeight: 800,
                  opacity: filledCount < 6 || isLoading ? 0.65 : 1,
                  cursor: filledCount < 6 || isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <>
                    <span className="sf-sp"></span>
                    <span>Verifying Code...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check size={18} />
                    <span>Verified! Opening Vault...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify & Open Vault</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Code Section */}
            <div
              style={{
                marginTop: '24px',
                paddingTop: '18px',
                borderTop: '1px solid #D2DDD4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '13px', color: '#44544B' }}>
                Didn't receive the email?
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isResending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: countdown > 0 ? '#829188' : '#0E1A14',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: countdown > 0 || isResending ? 'not-allowed' : 'pointer',
                  textDecoration: countdown > 0 ? 'none' : 'underline',
                  padding: 0
                }}
              >
                <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                {countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : isResending ? (
                  'Sending new code...'
                ) : (
                  'Resend verification code'
                )}
              </button>
            </div>

            {/* Quick Tips */}
            <div
              style={{
                marginTop: '16px',
                background: '#FFFFFF',
                border: '1px dashed #A4B89D',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#44544B',
                lineHeight: 1.5
              }}
            >
              <strong>Tip:</strong> Look for <em>"Verify your Smart Financial account"</em> in your inbox or spam folder.
            </div>
          </div>
        </main>

        {/* Right Panel: Sleek Dark Vault Banner (Fixed width, zero overflow) */}
        <aside className="sf-R" aria-label="Security checkpoint and verification progress">
          <div className="sf-fw-right">
            {/* Live Vault Lock Dial Illustration */}
            <div
              style={{
                background: '#15241C',
                border: '2px solid #2C3F34',
                borderRadius: '10px',
                padding: '24px 20px',
                marginBottom: '28px',
                boxShadow: '3px 3px 0 #000000',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              {/* Top Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: filledCount === 6 ? '#C8F135' : '#F2B66B',
                      boxShadow: filledCount === 6 ? '0 0 8px #C8F135' : 'none'
                    }}
                  ></div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#C8F135', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Vault Checkpoint
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#88A392' }}>
                  {filledCount}/6 Digits
                </span>
              </div>

              {/* Central Lock Icon */}
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: filledCount === 6 ? '#C8F135' : '#0E1A14',
                    border: '2.5px solid #C8F135',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: filledCount === 6 ? '#0E1A14' : '#C8F135',
                    boxShadow: '0 0 16px rgba(200, 241, 53, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {isSuccess ? (
                    <Unlock size={32} strokeWidth={2.5} />
                  ) : filledCount === 6 ? (
                    <KeyRound size={32} strokeWidth={2.5} />
                  ) : (
                    <Lock size={30} strokeWidth={2} />
                  )}
                </div>

                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: '19px',
                    fontWeight: 800,
                    color: '#F2F5EE',
                    marginTop: '12px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {isSuccess
                    ? 'Vault Unlocked!'
                    : filledCount === 6
                      ? 'Code Ready to Verify'
                      : 'Awaiting Code Entry'}
                </div>
                <p style={{ color: '#A4B89D', fontSize: '13px', marginTop: '4px', maxWidth: '280px', margin: '4px auto 0', lineHeight: 1.4 }}>
                  {isSuccess
                    ? 'Redirecting to your businesses...'
                    : filledCount === 6
                      ? 'Click Verify & Open Vault to activate'
                      : 'Enter the 6 digits sent to your email to verify account ownership'}
                </p>
              </div>

              {/* 6 Segment Pins visual */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #2C3F34'
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const isEntered = Boolean(digits[idx]);
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '24px',
                        height: '5px',
                        borderRadius: '3px',
                        background: isEntered ? '#C8F135' : '#2C3F34',
                        boxShadow: isEntered ? '0 0 6px #C8F135' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Step-by-Step Onboarding Track */}
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: '17px',
                fontWeight: 800,
                color: '#F2F5EE',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              Account Setup Progress
            </h2>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {/* Step 1 */}
              <li
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderTop: '1px solid #2C3F34',
                  color: '#C8F135'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#C8F135',
                    color: '#0E1A14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '11px'
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F2F5EE' }}>
                    1. Account Registered
                  </div>
                  <div style={{ fontSize: '12px', color: '#88A392' }}>
                    Credentials securely saved
                  </div>
                </div>
              </li>

              {/* Step 2 */}
              <li
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderTop: '1px solid #2C3F34'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isSuccess ? '#C8F135' : '#FBFFE6',
                    color: '#0E1A14',
                    border: '2px solid #C8F135',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '11px'
                  }}
                >
                  {isSuccess ? '✓' : '2'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#C8F135' }}>
                    2. Email Verification (Active)
                  </div>
                  <div style={{ fontSize: '12px', color: '#88A392' }}>
                    Validating one-time 6-digit passcode
                  </div>
                </div>
              </li>

              {/* Step 3 */}
              <li
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderTop: '1px solid #2C3F34',
                  color: '#64756B'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#1F3025',
                    color: '#64756B',
                    border: '1px solid #2C3F34',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#88A392' }}>
                    3. Launch Business Ledgers
                  </div>
                  <div style={{ fontSize: '12px', color: '#5A6E63' }}>
                    Chart of accounts and transactions
                  </div>
                </div>
              </li>
            </ul>

            {/* Security Guarantee Note */}
            <div
              style={{
                marginTop: '24px',
                padding: '12px 14px',
                background: '#15241C',
                border: '1px solid #2C3F34',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: '#A4B89D'
              }}
            >
              <strong>Smart Financial Isolation:</strong> Every business created in your account operates in an isolated vault. Verification ensures only authorized operators access financial transactions.
            </div>
          </div>
        </aside>
      </div>

      {/* Scoped CSS with strict box-sizing and zero horizontal scroll */}
      <style>{`
        .sf-verify-page {
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          background: #F2F5EE;
          color: #0E1A14;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
        }

        .sf-verify-page * {
          box-sizing: border-box;
        }

        .sf-verify-page a {
          color: inherit;
          text-decoration: none;
        }

        .sf-verify-page a:focus-visible,
        .sf-verify-page input:focus-visible,
        .sf-verify-page button:focus-visible {
          outline: 2px solid #0E1A14;
          outline-offset: 2px;
        }

        .sf-muted {
          color: #44544B;
        }

        .sf-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .sf-L {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 48px;
          box-sizing: border-box;
          overflow-x: hidden;
          min-width: 0;
        }

        .sf-R {
          background: #0E1A14;
          color: #F2F5EE;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 48px;
          box-sizing: border-box;
          overflow-x: hidden;
          min-width: 0;
        }

        .sf-fw {
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .sf-fw-right {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .sf-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #0E1A14;
        }

        .sf-tt {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #0E1A14;
          margin: 0;
        }

        .sf-otp-box:focus {
          border-color: #0E1A14 !important;
          background: #FBFFE6 !important;
          box-shadow: 2px 2px 0 #0E1A14 !important;
          transform: translateY(-1px);
        }

        .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 6px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          box-sizing: border-box;
          transition: transform .15s ease-out, background .15s, box-shadow .15s;
          user-select: none;
        }

        .sf-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 #0E1A14 !important;
        }

        .sf-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 1px 1px 0 #0E1A14 !important;
        }

        .sf-btn-lime {
          background: #C8F135;
          color: #0E1A14;
        }

        .sf-al {
          padding: 10px 14px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          color: #0E1A14;
          box-shadow: 2px 2px 0 #0E1A14;
        }

        .sf-al.err {
          background: #F2B66B;
        }

        .sf-al.ok {
          background: #C8F135;
        }

        .sf-sp {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2.5px solid #0E1A14;
          border-top-color: transparent;
          border-radius: 50%;
          animation: sf-spin .8s linear infinite;
        }

        @keyframes sf-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 960px) {
          .sf-split {
            grid-template-columns: 1fr;
          }
          .sf-L {
            padding: 32px 20px;
          }
          .sf-R {
            width: 100%;
            padding: 32px 20px;
          }
          .sf-fw-right {
            max-width: 460px;
          }
        }
      `}</style>
    </div>
  );
}
