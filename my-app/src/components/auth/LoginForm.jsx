import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TrueFocus from '../animation/TrueFocus';
import './styles.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export default function LoginForm() {
  // Form state to hold email and password
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Message for feedback (success or error)
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();



  // Handle input changes
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with email:', formData.email);
      console.log('API URL:', `${import.meta.env.VITE_BACKEND_URL}/api/login`);

      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
      console.log('Using API URL:', apiUrl);

      // Send POST request to backend login endpoint
      const res = await axios.post(`${apiUrl}/api/login`, formData, {
        withCredentials: true
      });

      console.log('Login response:', res.data);
      setMessage(res.data.message);
      navigate('/list');
    } catch (err) {
      console.error('Login error:', err);

      if (err.code === 'ECONNABORTED') {
        setMessage('Login failed: Request timeout. Please try again.');
      } else if (err.code === 'ERR_NETWORK') {
        setMessage('Login failed: Cannot connect to server. Please check your internet connection.');
      } else if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.error || err.response.data?.message || 'Server error occurred';
        setMessage(`Login failed: ${errorMsg}`);
        console.log('Server error response:', err.response.data);
      } else if (err.request) {
        // Request was made but no response received
        setMessage('Login failed: No response from server. Please try again.');
        console.log('No response received:', err.request);
      } else {
        // Something else happened
        setMessage(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                        <div className="ml-5 w-72 h-45 md:w-80 md:h-72">
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
