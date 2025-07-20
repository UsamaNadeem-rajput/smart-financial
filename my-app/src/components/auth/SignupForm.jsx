import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState(''); // Used to show success or error

  

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register`, formData,{ withCredentials: true});
      setMessage(res.data.message); // Show server response on success
      navigate('/business');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setMessage('Registration failed: ' + err.response.data.error);
      } else {
        setMessage('Registration failed: Unknown error');
      }
      console.error(err);
    }
  };

  return (
    <div>
      <section className="text-center">
        <div className="p-5 bg-image" style={{
          backgroundImage: "url('./bgpicture.jpg')",
          height: "300px",
        }}></div>

        <div className="card mx-4 mx-md-5 shadow-5-strong bg-body-tertiary"
          style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}>
          <div className="card-body py-5 px-md-5">
            <div className="row d-flex justify-content-center">
              <div className="col-lg-8">
                <h2 className="fw-bold mb-5">Sign up now</h2>

                {/* Display server response */}
                {message && (
                  <div className="alert alert-info">{message}</div>
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
                  </div>

                  <div className="form-check d-flex justify-content-center mb-4">
                    <input className="form-check-input" type="checkbox" id="checkDefault" />
                    <label className="form-check-label ms-2" htmlFor="checkDefault">
                      Subscribe to our newsletter
                    </label>
                  </div>

                  <div className="d-flex flex-column align-items-center mt-3">
                    <button type="submit" className="btn btn-primary btn-block mb-2 mx-2">
                      Sign up
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
