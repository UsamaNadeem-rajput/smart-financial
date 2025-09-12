/* 1️⃣  NEW IMPORT ---------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';   // ⬅️ added useSearchParams
import axios from 'axios';
import TrueFocus from '../animation/TrueFocus';
import './styles.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LoginForm() {
  /* 2️⃣  STATE SECTION ---------------------------------------------- */
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);   // ⬅️ new

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();                        // ⬅️ new

  /* 3️⃣  GOOGLE CALLBACK HANDLER (copy from SignupForm) ------------- */
  useEffect(() => {
    const authStatus = searchParams.get('auth');
    const error = searchParams.get('error');

    if (authStatus === 'success') {
      setMessage('Google login successful! Redirecting…');
      setTimeout(() => navigate('/business'), 1500);
    }
    if (error === 'auth_failed') {
      setMessage('Google login failed. Please try again.');
      setIsGoogleLoading(false);
    }
  }, [searchParams, navigate]);

  /* 4️⃣  ORIGINAL handleChange / handleSubmit STAY UNCHANGED -------- */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      setMessage(res.data.message);
      navigate('/list');
    } catch (err) {
      /* … existing error handling … */
    } finally {
      setIsLoading(false);
    }
  };

  /* 5️⃣  GOOGLE LOGIN HANDLER --------------------------------------- */
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = 'https://server.khushifinances.com/api/auth/google';
  };

  /* 6️⃣  RENDER – button inserted RIGHT ABOVE the e-mail field ----- */
  return (
    <div className="login-page-wrapper">
      <div>
        <section className="h-100 gradient-form" style={{ backgroundColor: '#eee' }}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col-xl-10">
                <div className="card rounded-3 text-black">
                  <div className="row g-0">
                    <div className="col-lg-6 bg-white">
                      <div className="card-body p-md-5 mx-md-4">
                        <div className="w-72 h-45 md:w-80 md:h-64">
                          <DotLottieReact
                            src="https://lottie.host/b57769dd-de23-4b79-acb7-8f275ee9ccaa/i1qkmQtZ8q.lottie"
                            loop
                            autoplay
                          />
                        </div>
                        <div className="w-full h-1 bg-gray-300 mb-4"></div>
                        <TrueFocus
                          sentence="Smart_Financial by Vijay_Kumar"
                          manualMode={false}
                          blurAmount={5}
                          borderColor="red"
                          animationDuration={2}
                          pauseBetweenAnimations={1}
                        />

                        {/*  Google Login Button  */}
                        <div className="mb-4">
                          <button
                            type="button"
                            className="btn btn-light border w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                          >
                            {isGoogleLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                Connecting to Google...
                              </>
                            ) : (
                              <>
                                <svg width="20" height="20" viewBox="0 0 18 18">
                                  <path fill="#4285F4" d="m18 9.205c0-.639-.057-1.252-.164-1.841H9.167v3.481h4.948c-.212 1.116-.856 2.06-1.823 2.691v2.226h2.956C16.983 14.09 18 11.864 18 9.205z"/>
                                  <path fill="#34A853" d="M9.167 18c2.467 0 4.532-.82 6.044-2.238l-2.956-2.226c-.812.562-1.852.892-3.088.892-2.373 0-4.381-1.603-5.098-3.757h-3.04v2.297C2.252 15.312 5.454 18 9.167 18z"/>
                                  <path fill="#FBBC04" d="M4.069 10.671c-.185-.562-.29-1.161-.29-1.784s.105-1.222.29-1.784V4.806H1.029C.373 6.118 0 7.588 0 9.171s.373 3.053 1.029 4.365l3.04-2.865z"/>
                                  <path fill="#EA4335" d="M9.167 3.572c1.336 0 2.535.459 3.477 1.361l2.602-2.602C13.698.921 11.632 0 9.167 0 5.454 0 2.252 2.688 1.029 6.131l3.04 2.865c.717-2.154 2.725-3.757 5.098-3.757z"/>
                                </svg>
                                Continue with Google
                              </>
                            )}
                          </button>
                        </div>

                        {/*  Divider  */}
                        <div className="d-flex align-items-center mb-4">
                          <hr className="flex-grow-1" /><span className="px-3 text-muted">OR</span><hr className="flex-grow-1" />
                        </div>
                        

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                          <p className='text-center fw-semibold text-black'>Please login to your account</p>
                            
                          {/* Email */}
                          <div className="form-outline mb-3">
                            <label className="form-label text-black">Email</label>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              placeholder="Email"
                              value={formData.email}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Password */}
                          <div className="form-outline mb-3">
                            <label className="form-label text-black">Password</label>
                            <input
                              type="password"
                              name="password"
                              className="form-control"
                              placeholder="Password"
                              value={formData.password}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Feedback message */}
                          {message && (
                            <div className={`alert ${message.includes('failed') ? 'alert-danger' : 'alert-success'}`}>
                              {message}
                            </div>
                          )}

                          {/* Submit button */}
                          <div className="text-end">
                            <button
                              className="btn btn-primary w-100"
                              type="submit"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Logging in...
                                </>
                              ) : (
                                'Log in'
                              )}
                            </button>
                          </div>

                          <div className="text-center mt-2">
                            <a className="text-muted d-block text-black" href="#!">Forgot password?</a>
                          </div>

                          {/* Link to register */}
                          <div className="d-flex align-items-center justify-content-center pb-4 mt-3">
                            <p className="mb-0 me-2 text-black">Don't have an account?</p>
                            <Link to="/register">
                              <button type="button" className="btn btn-outline-danger">Create new</button>
                            </Link>
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="col-lg-6 d-flex align-items-center gradient-custom-2">
                      <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                        <h4 className="mb-4">We are more than just a company</h4>
                        <p className="small mb-0">
                          Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
