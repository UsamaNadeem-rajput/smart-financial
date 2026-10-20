import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Validation from "../validation/Validation";

export default function SignupForm() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_failed") {
      setMessage("Google sign-up failed. Please try again or use email registration.");
      setIsGoogleLoading(false);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  // Real-time calculation and validation for four checks
  const isUsernameValid =
    formData.username.length >= 8 &&
    formData.username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(formData.username);

  const isFullnameValid =
    formData.fullname.trim().length >= 5 && formData.fullname.trim().length <= 20;

  const isEmailValid =
    Boolean(formData.email) &&
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim());

  const isPasswordValid =
    formData.password.length >= 6 &&
    formData.password.length <= 20 &&
    /(?=.*[0-9])/.test(formData.password) &&
    /(?=.*[!@#$%^&*])/.test(formData.password);

  const allChecksPassed =
    isUsernameValid && isFullnameValid && isEmailValid && isPasswordValid;

  const passedChecksCount =
    (isUsernameValid ? 1 : 0) +
    (isFullnameValid ? 1 : 0) +
    (isEmailValid ? 1 : 0) +
    (isPasswordValid ? 1 : 0);

  const completionPercentage = passedChecksCount * 25;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const validationErrors = Validation(formData);
    setErrors(validationErrors);
    setTouched({
      username: true,
      fullname: true,
      email: true,
      password: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setMessage("Please fix the validation errors");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      const res = await axios.post(
        `${apiUrl}/api/register`,
        formData,
        { withCredentials: true }
      );
      setMessage(res.data.message || "Registration successful");
      navigate("/verify", { state: { email: formData.email } });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Server error";
      setMessage(`Registration failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* Google sign-up */
  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    window.location.href = "https://server.khushifinances.com/api/auth/google";
  };

  return (
    <div className="sf-signup-page">
      <div className="sf-split">
        {/* Left Column: Registration Form */}
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

            <h1 className="sf-tt" style={{ fontSize: "60px" }}>
              Sign up now.
            </h1>
            <p className="sf-muted" style={{ fontSize: "19px", margin: "12px 0 26px" }}>
              Create your account and open your first vault.
            </p>

            {/* Google Signup Button */}
            <button
              type="button"
              className="sf-btn sf-out"
              onClick={handleGoogleSignup}
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
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>

            <div className="sf-dv">or sign up with your email</div>

            {/* Error or Success Alert */}
            {message && (
              <div
                className={`sf-al ${
                  message.toLowerCase().includes("fail") ||
                  message.toLowerCase().includes("fix") ||
                  message.toLowerCase().includes("error")
                    ? "err"
                    : "ok"
                }`}
                role="alert"
              >
                {message}
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="sf-row2">
                {/* Username */}
                <div className="sf-fd">
                  <label htmlFor="un">Username</label>
                  <input
                    id="un"
                    name="username"
                    type="text"
                    required
                    placeholder="john_doe123"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      (touched.username && !isUsernameValid && formData.username) || errors.username
                        ? "invalid-input"
                        : ""
                    }
                  />
                  <p className="sf-help">8 to 20 characters: letters, numbers or _</p>
                  {((touched.username && !isUsernameValid && formData.username) || errors.username) && (
                    <p className="sf-hint" style={{ display: "block" }}>
                      {errors.username || "Use 8 to 20 letters, numbers or underscores."}
                    </p>
                  )}
                </div>

                {/* Full name */}
                <div className="sf-fd">
                  <label htmlFor="fn">Full name</label>
                  <input
                    id="fn"
                    name="fullname"
                    type="text"
                    required
                    placeholder="John Doe"
                    autoComplete="name"
                    value={formData.fullname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      (touched.fullname && !isFullnameValid && formData.fullname) || errors.fullname
                        ? "invalid-input"
                        : ""
                    }
                  />
                  <p className="sf-help">5 to 20 characters</p>
                  {((touched.fullname && !isFullnameValid && formData.fullname) || errors.fullname) && (
                    <p className="sf-hint" style={{ display: "block" }}>
                      {errors.fullname || "Use 5 to 20 characters."}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="sf-fd">
                <label htmlFor="em">Email address</label>
                <input
                  id="em"
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    (touched.email && !isEmailValid && formData.email) || errors.email
                      ? "invalid-input"
                      : ""
                  }
                />
                {((touched.email && !isEmailValid && formData.email) || errors.email) && (
                  <p className="sf-hint" style={{ display: "block" }}>
                    {errors.email || "Enter a valid email address."}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="sf-fd">
                <label htmlFor="pw">Password</label>
                <input
                  id="pw"
                  name="password"
                  type="password"
                  required
                  placeholder="Choose a password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    (touched.password && !isPasswordValid && formData.password) || errors.password
                      ? "invalid-input"
                      : ""
                  }
                />
                <p className="sf-help">
                  6 to 20 characters with at least 1 number and 1 special character (!@#$%^&*)
                </p>
                {((touched.password && !isPasswordValid && formData.password) || errors.password) && (
                  <p className="sf-hint" style={{ display: "block" }}>
                    {errors.password ||
                      "Add at least 1 number and 1 special character (!@#$%^&*), 6 to 20 characters in all."}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={`sf-btn ${isLoading ? "busy" : "lime"}`}
                style={{ marginTop: "8px" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="sf-sp"></span>
                    Signing up...
                  </>
                ) : (
                  "Sign up with Email"
                )}
              </button>
            </form>

            <p style={{ marginTop: "20px", fontSize: "16px" }}>
              Already have an account?{" "}
              <Link to="/login" className="sf-lk">
                Go to Login
              </Link>
            </p>

            <p className="sf-muted" style={{ marginTop: "26px", fontSize: "14px" }}>
              Follow us:{" "}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="sf-lk" style={{ fontWeight: 500 }}>
                Facebook
              </a>{" "}
              ·{" "}
              <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="sf-lk" style={{ fontWeight: 500 }}>
                Google
              </a>{" "}
              ·{" "}
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="sf-lk" style={{ fontWeight: 500 }}>
                Twitter
              </a>{" "}
              ·{" "}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="sf-lk" style={{ fontWeight: 500 }}>
                GitHub
              </a>
            </p>
          </div>
        </main>

        {/* Right Column: Interactive Four Checks */}
        <aside className="sf-R">
          <div style={{ maxWidth: "440px", width: "100%", margin: "0 auto" }}>
            <h2 style={{ fontSize: "46px" }}>Four checks and you are in.</h2>

            <ol className="sf-stp">
              {/* Check 1: Username */}
              <li className={`sf-s1 ${isUsernameValid ? "sf-done" : ""}`}>
                <span className="sf-ck" aria-hidden="true">
                  {isUsernameValid ? "✓" : ""}
                </span>
                <span className="sf-nmx">Username</span>
                {isUsernameValid ? (
                  <span className="sf-yes">Done</span>
                ) : (
                  <span className="sf-no">To do</span>
                )}
              </li>

              {/* Check 2: Full name */}
              <li className={`sf-s2 ${isFullnameValid ? "sf-done" : ""}`}>
                <span className="sf-ck" aria-hidden="true">
                  {isFullnameValid ? "✓" : ""}
                </span>
                <span className="sf-nmx">Full name</span>
                {isFullnameValid ? (
                  <span className="sf-yes">Done</span>
                ) : (
                  <span className="sf-no">To do</span>
                )}
              </li>

              {/* Check 3: Email */}
              <li className={`sf-s3 ${isEmailValid ? "sf-done" : ""}`}>
                <span className="sf-ck" aria-hidden="true">
                  {isEmailValid ? "✓" : ""}
                </span>
                <span className="sf-nmx">Email</span>
                {isEmailValid ? (
                  <span className="sf-yes">Done</span>
                ) : (
                  <span className="sf-no">To do</span>
                )}
              </li>

              {/* Check 4: Password */}
              <li className={`sf-s4 ${isPasswordValid ? "sf-done" : ""}`}>
                <span className="sf-ck" aria-hidden="true">
                  {isPasswordValid ? "✓" : ""}
                </span>
                <span className="sf-nmx">Password</span>
                {isPasswordValid ? (
                  <span className="sf-yes">Done</span>
                ) : (
                  <span className="sf-no">To do</span>
                )}
              </li>
            </ol>

            {/* 4 Segment Progress Bar */}
            <div className="sf-bar" aria-hidden="true">
              <i className={`sf-g1 ${isUsernameValid ? "sf-active" : ""}`}></i>
              <i className={`sf-g2 ${isFullnameValid ? "sf-active" : ""}`}></i>
              <i className={`sf-g3 ${isEmailValid ? "sf-active" : ""}`}></i>
              <i className={`sf-g4 ${isPasswordValid ? "sf-active" : ""}`}></i>
            </div>

            {/* Dynamic Status Notification */}
            {allChecksPassed ? (
              <p className="sf-rdy" role="status">
                All four checks passed. Press Sign up with Email.
              </p>
            ) : (
              <p className="sf-progress-hint">
                {passedChecksCount} of 4 checks completed ({completionPercentage}%)
              </p>
            )}

            {/* What happens next */}
            <div className="sf-nx">
              <p style={{ borderTop: 0, color: "#C8F135", fontWeight: 600, paddingBottom: "4px" }}>
                What happens next
              </p>
              <p>
                <b>1.</b> We email a 6-digit code to confirm your address.
              </p>
              <p>
                <b>2.</b> Enter it on the next screen. Until then your account stays locked.
              </p>
              <p style={{ borderBottom: "1px solid #2C3F34" }}>
                <b>3.</b> Log in and open your first vault.
              </p>
            </div>

            <p style={{ marginTop: "22px", fontSize: "14px", color: "#8FA196" }}>
              Your password is stored as a salted hash, never as plain text.
            </p>
          </div>
        </aside>
      </div>

      {/* Brutalist Styles matching Stitch specifications */}
      <style>{`
        .sf-signup-page {
          background: #F2F5EE;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          color: #0E1A14;
          min-height: 100vh;
          width: 100%;
          -webkit-font-smoothing: antialiased;
        }

        .sf-signup-page h1,
        .sf-signup-page h2 {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          margin: 0;
          letter-spacing: -0.04em;
          line-height: .98;
          font-weight: 800;
        }

        .sf-signup-page p {
          margin: 0;
          line-height: 1.5;
        }

        .sf-signup-page a {
          color: inherit;
          text-decoration: none;
        }

        .sf-signup-page a:focus-visible,
        .sf-signup-page input:focus-visible,
        .sf-signup-page button:focus-visible {
          outline: 3px solid #0E1A14;
          outline-offset: 3px;
        }

        .sf-muted {
          color: #44544B;
        }

        .sf-split {
          display: flex;
          flex-wrap: wrap;
          min-height: 960px;
        }

        .sf-L {
          flex: 1 1 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 44px 64px;
          box-sizing: border-box;
        }

        .sf-R {
          flex: 1 1 480px;
          background: #0E1A14;
          color: #F2F5EE;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 56px;
          box-sizing: border-box;
        }

        .sf-fw {
          width: 100%;
          max-width: 560px;
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
          margin: 20px 0;
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

        .sf-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .sf-fd {
          margin-bottom: 16px;
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
          min-height: 52px;
          padding: 0 14px;
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

        .sf-help {
          margin-top: 6px;
          font-size: 13px;
          color: #44544B;
        }

        .sf-hint {
          display: none;
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
          margin-bottom: 16px;
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

        /* Four checks steps styling */
        .sf-stp {
          list-style: none;
          margin: 26px 0 0;
          padding: 0;
        }

        .sf-stp li {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-top: 1px solid #2C3F34;
          font-size: 18px;
        }

        .sf-stp li:last-child {
          border-bottom: 1px solid #2C3F34;
        }

        .sf-ck {
          flex: none;
          width: 28px;
          height: 28px;
          border: 2px solid #8FA196;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0E1A14;
          font-size: 16px;
          transition: background .2s, border-color .2s;
        }

        .sf-done .sf-ck {
          background: #C8F135;
          border-color: #C8F135;
        }

        .sf-nmx {
          flex: 1;
          font-weight: 500;
        }

        .sf-no {
          font-size: 14px;
          color: #8FA196;
          font-weight: 600;
        }

        .sf-yes {
          font-size: 14px;
          color: #C8F135;
          font-weight: 600;
        }

        .sf-bar {
          display: flex;
          gap: 6px;
          margin-top: 22px;
        }

        .sf-bar i {
          flex: 1;
          height: 10px;
          border: 2px solid #8FA196;
          border-radius: 3px;
          background: transparent;
          transition: background .2s, border-color .2s;
        }

        .sf-bar i.sf-active {
          background: #C8F135;
          border-color: #C8F135;
        }

        .sf-progress-hint {
          margin-top: 18px;
          font-size: 14px;
          color: #8FA196;
          font-weight: 600;
        }

        .sf-rdy {
          margin-top: 18px;
          padding: 14px 16px;
          background: #C8F135;
          color: #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          animation: sf-pop 0.3s ease-out;
        }

        @keyframes sf-pop {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .sf-nx {
          margin-top: 34px;
        }

        .sf-nx p {
          padding: 11px 0;
          font-size: 16px;
          color: #B9C6BD;
          border-top: 1px solid #2C3F34;
        }

        .sf-nx p b {
          color: #F2F5EE;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .sf-L, .sf-R {
            padding: 32px 24px;
          }
          .sf-row2 {
            grid-template-columns: 1fr;
          }
          .sf-tt {
            font-size: 44px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sf-signup-page * {
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