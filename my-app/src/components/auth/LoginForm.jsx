import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import TrueFocus from '../animation/TrueFocus';
import './styles.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setMessage('Google login failed. Please try again.');
      setIsGoogleLoading(false);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setMessage('');
    if (!formData.email || !formData.password) { setMessage('Please fill in all fields'); setIsLoading(false); return; }
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
      const res = await axios.post(`${apiUrl}/api/login`, formData, { withCredentials: true });
      setMessage(res.data.message); navigate('/list');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Server error';
      setMessage(`Login failed: ${msg}`);
    } finally { setIsLoading(false); }
  };

  /*  Google login  */
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = "https://server.khushifinances.com/api/auth/google"; // <-- NO SPACE
  };

  return (
    <div className="login-page-wrapper min-h-screen relative overflow-x-hidden" style={{ minHeight: '100vh', width: '100vw' }}>
      {/* Enhanced Professional Background - fixed to cover full screen on scroll */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
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

        {/* Geometric shapes (no heavy animations) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45"></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full"></div>
        </div>

        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <section className="h-100 gradient-form" style={{ backgroundColor: 'transparent' }}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col-xl-10">
                <div className="card rounded-3 border border-white/10" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="row g-0">
                    <div className="col-lg-6" style={{ borderRadius: '.3rem 0 0 .3rem' }}>
                      <div className="card-body p-md-5 mx-md-4">
                        <div className="w-72 h-45 md:w-80 md:h-64">
                          <DotLottieReact
                            src="https://lottie.host/b57769dd-de23-4b79-acb7-8f275ee9ccaa/i1qkmQtZ8q.lottie"
                            loop
                            autoplay
                          />
                        </div>
                        <div className="w-full h-1 bg-white/20 mb-4"></div>
                        <TrueFocus
                          sentence="Smart_Financial by Khushi-Vijay"
                          manualMode={false}
                          blurAmount={5}
                          borderColor="red"
                          animationDuration={2}
                          pauseBetweenAnimations={1}
                        />

                        {/* Google button */}
                        <div className="mb-4">
                          <button
                            type="button"
                            className="btn btn-outline-light w-100 py-3 d-flex align-items-center justify-content-center gap-2"
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
                                  <path fill="#4285F4" d="m18 9.205c0-.639-.057-1.252-.164-1.841H9.167v3.481h4.948c-.212 1.116-.856 2.06-1.823 2.691v2.226h2.956C16.983 14.09 18 11.864 18 9.205z" />
                                  <path fill="#34A853" d="M9.167 18c2.467 0 4.532-.82 6.044-2.238l-2.956-2.226c-.812.562-1.852.892-3.088.892-2.373 0-4.381-1.603-5.098-3.757h-3.04v2.297C2.252 15.312 5.454 18 9.167 18z" />
                                  <path fill="#FBBC04" d="M4.069 10.671c-.185-.562-.29-1.161-.29-1.784s.105-1.222.29-1.784V4.806H1.029C.373 6.118 0 7.588 0 9.171s.373 3.053 1.029 4.365l3.04-2.865z" />
                                  <path fill="#EA4335" d="M9.167 3.572c1.336 0 2.535.459 3.477 1.361l2.602-2.602C13.698.921 11.632 0 9.167 0 5.454 0 2.252 2.688 1.029 6.131l3.04 2.865c.717-2.154 2.725-3.757 5.098-3.757z" />
                                </svg>
                                Continue with Google
                              </>
                            )}
                          </button>
                        </div>

                        <div className="d-flex align-items-center mb-4">
                          <hr className="flex-grow-1 border-white/30" /><span className="px-3 text-gray-300">OR</span><hr className="flex-grow-1 border-white/30" />
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                          <p className='text-center fw-semibold text-white'>Please login to your account</p>

                          {/* Email */}
                          <div className="form-outline mb-3">
                            <label className="form-label text-white">Email</label>
                            <input
                              type="email"
                              name="email"
                              className="form-control bg-white/10 border-white/20"
                              style={{ color: 'white' }}
                              placeholder="Email"
                              value={formData.email}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Password */}
                          <div className="form-outline mb-3">
                            <label className="form-label text-white">Password</label>
                            <input
                              type="password"
                              name="password"
                              className="form-control bg-white/10 border-white/20"
                              style={{ color: 'white' }}
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
                            <a className="d-block text-cyan-400 hover:text-cyan-300" href="/forgot-password">Forgot password?</a>
                          </div>

                          {/* Link to register */}
                          <div className="d-flex align-items-center justify-content-center pb-4 mt-3">
                            <p className="mb-0 me-2 text-gray-300">Don't have an account?</p>
                            <Link to="/register">
                              <button type="button" className="btn btn-outline-light">Create new</button>
                            </Link>
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="col-lg-6 d-flex align-items-center gradient-custom-2" style={{ borderRadius: '0 .3rem .3rem 0' }}>
                      <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                        <h4 className="mb-4">Your Smart Financial Partner</h4>
                        <p className="small mb-0">
                          Welcome to Smart Financial — your all-in-one accounting and ledger
                          management platform. Track transactions, manage multiple businesses,
                          and get AI-powered financial insights, all in one place. Log in to
                          take control of your finances with confidence and clarity.
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
