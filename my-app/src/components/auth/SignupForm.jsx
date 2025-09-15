import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
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

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const authStatus = searchParams.get("auth");
    const error = searchParams.get("error");

    if (authStatus === "success") {
      setMessage("Google sign-up successful! Redirecting to dashboard...");
      setTimeout(() => navigate("/business"), 1500);
    }
    if (error === "auth_failed") {
      setMessage("Google sign-up failed. Please try again or use email registration.");
      setIsGoogleLoading(false);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setErrors(Validation(formData));

    if (Object.keys(errors).length > 0) {
      setMessage("Please fix the validation errors");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        formData,
        { withCredentials: true }
      );
      setMessage(res.data.message);
      navigate("/verify", { state: { email: formData.email } });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Server error";
      setMessage(`Registration failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /*  Google sign-up  */
  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    window.location.href = "https://server.khushifinances.com/api/auth/google"; // <-- NO SPACE
  };

  return (
    <div>
      <section className="text-center">
        <div
          className="hidden md:block bg-image"
          style={{ backgroundImage: "url('./bgpicture.jpg')", height: "200px" }}
        ></div>

        <div
          className="card mx-4 mx-md-5 shadow-5-strong bg-body-tertiary"
          style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}
        >
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

                {message && (
                  <div className={`alert ${message.includes("failed") ? "alert-danger" : "alert-success"}`}>
                    {message}
                  </div>
                )}

                {/* Google button */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-light border w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleGoogleSignup}
                    disabled={isGoogleLoading}
                    style={{ fontSize: "16px", fontWeight: "500" }}
                  >
                    {isGoogleLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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

                <div className="d-flex align-items-center mb-4">
                  <hr className="flex-grow-1" /><span className="px-3 text-muted">OR</span><hr className="flex-grow-1" />
                </div>

                {/* FORM STARTS */}
                <form onSubmit={handleSubmit}>
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
                      {errors.username && (
                        <p className="text-danger mt-1">{errors.username}</p>
                      )}
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
                      {errors.fullname && (
                        <p className="text-danger mt-1">{errors.fullname}</p>
                      )}
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
                    {errors.email && (
                      <p className="text-danger mt-1">{errors.email}</p>
                    )}
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
                    {errors.password && (
                      <p className="text-danger mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="d-flex flex-column align-items-center mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-block mb-2 mx-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Signing up...
                        </>
                      ) : (
                        "Sign up with Email"
                      )}
                    </button>
                    <Link
                      to="/login"
                      className="text-decoration-none mb-4 mt-2"
                    >
                      Already have an account? Go to Login
                    </Link>
                  </div>

                  <div className="text-center">
                    <p>Follow us on:</p>
                    <button
                      type="button"
                      className="btn btn-link btn-floating mx-1"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-floating mx-1"
                    >
                      <i className="fab fa-google"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-floating mx-1"
                    >
                      <i className="fab fa-twitter"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-floating mx-1"
                    >
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