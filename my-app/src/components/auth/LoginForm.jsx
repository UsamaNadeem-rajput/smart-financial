import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TrueFocus from '../animation/TrueFocus';
import './styles.css'


export default function LoginForm() {
  // Form state to hold email and password
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Message for feedback (success or error)
  const [message, setMessage] = useState('');

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
    // setIsLoading(true);
    
    try {
      // Send POST request to backend login endpoint
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login`, formData, { 
        withCredentials: true 
      });
      // localStorage.setItem('user', JSON.stringify(res.data.user));
      // if (res.data.user && res.data.user.username) {
        // localStorage.setItem('username', res.data.user.username);
      // }
      setMessage(res.data.message); // Show success message
      navigate('/list');
    } catch (err) {
      // Show error message from server
      if (err.response && err.response.data && err.response.data.error) {
        setMessage('Login failed: ' + err.response.data.error);
      } else {
        setMessage('Login failed: Unknown error');
      }
      console.error(err);
    // } finally {
    //   setIsLoading(false);
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
                      <div className="text-center">
                        <img src="./coins.png" style={{ width: '160px', margin: '20px' }} alt="logo" />
                       

                        <TrueFocus
                          sentence="Smart_Financial by Vijay_Kumar"
                          manualMode={false}
                          blurAmount={5}
                          borderColor="red"
                          animationDuration={2}
                          pauseBetweenAnimations={1}
                        />
                        {/* <h4 className="mt-1 mb-5 pb-1 text-white">Smart Financial by Vijay Kumar</h4> */}
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
                        {message && <div className="alert alert-info">{message}</div>}

                        {/* Submit button */}
                        <div className="text-end">
                          <button className="btn btn-primary w-100" type="submit">Log in</button>
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
