import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Validation from '../validation/Validation';


export default function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrors(Validation(formData));

    if (Object.keys(errors).length > 0) {
      setMessage('Please fix the validation errors');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', { ...formData, password: '[HIDDEN]' });
      console.log('API URL:', `${import.meta.env.VITE_BACKEND_URL}/api/register`);

      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
      console.log('Using API URL:', apiUrl);

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register`, formData, {
        withCredentials: true
      });

      console.log('Registration response:', res.data);
      setMessage(res.data.message);
      navigate('/business');
    } catch (err) {
      console.error('Registration error:', err);

      if (err.code === 'ECONNABORTED') {
        setMessage('Registration failed: Request timeout. Please try again.');
      } else if (err.code === 'ERR_NETWORK') {
        setMessage('Registration failed: Cannot connect to server. Please check your internet connection.');
      } else if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.error || err.response.data?.message || 'Server error occurred';
        setMessage(`Registration failed: ${errorMsg}`);
        console.log('Server error response:', err.response.data);
      } else if (err.request) {
        // Request was made but no response received
        setMessage('Registration failed: No response from server. Please try again.');
        console.log('No response received:', err.request);
      } else {
        // Something else happened
        setMessage(`Registration failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <section className="text-center">
        <div
          className="hidden md:block bg-image"
          style={{
            backgroundImage: "url('./bgpicture.jpg')",
            height: "200px"
          }}
        >
        </div>

        <div className="card mx-4 mx-md-5 shadow-5-strong bg-body-tertiary"
          style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}>
          <div className="card-body py-5 px-md-5">
            <div className="row d-flex justify-content-center">
              <div className="col-lg-8">
                 <div className="md:ml-28 w-[20rem] h-[18rem] md:w-[40rem] md:h-[32rem]">
                  <DotLottieReact
                    src="https://lottie.host/c027fbf1-862a-4041-89a1-6ee30378a4fb/WvvjwTn1Ff.lottie"
                    loop
                    autoplay
                  />
                </div>
                <h2 className="fw-bold mb-5">Sign up now</h2>

                {/* Display server response */}
                {message && (
                  <div className={`alert ${message.includes('failed') ? 'alert-danger' : 'alert-success'}`}>
                    {message}
                  </div>
                )}

                {/* FORM STARTS */}
                <form onSubmit={handleSubmit} >
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                      {errors.username && <p className="text-danger mt-1">{errors.username}</p>}
                    </div>
                    <div className="col-md-6 mb-4">
                      <input
                        type="text"
                        name="fullname"
                        className="form-control"
                        placeholder="Full Name"
                        value={formData.fullname}
                        onChange={handleChange}
                      />
                      {errors.fullname && <p className="text-danger mt-1">{errors.fullname}</p>}
                    </div>
                  </div>

                  <div className="form-outline mb-4">
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <p className="text-danger mt-1">{errors.email}</p>}
                  </div>

                  <div className="form-outline mb-4">
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {errors.password && <p className="text-danger mt-1">{errors.password}</p>}
                  </div>

                  <div className="d-flex flex-column align-items-center mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-block mb-2 mx-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing up...
                        </>
                      ) : (
                        'Sign up'
                      )}
                    </button>
                    <Link to="/login" className="text-decoration-none mb-4 mt-2">
                      Go to Login
                    </Link>
                  </div>

                  <div className="text-center">
                    <p>Follow us on:</p>
                    <button type="button" className="btn btn-link btn-floating mx-1">
                      <i className="fab fa-facebook-f"></i>
                    </button>
                    <button type="button" className="btn btn-link btn-floating mx-1">
                      <i className="fab fa-google"></i>
                    </button>
                    <button type="button" className="btn btn-link btn-floating mx-1">
                      <i className="fab fa-twitter"></i>
                    </button>
                    <button type="button" className="btn btn-link btn-floating mx-1">
                      <i className="fab fa-github"></i>
                    </button>
                  </div>
                </form>
                {/* FORM ENDS */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
