import { preloadInternalPages } from '../../App';
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";
import axios from "axios";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBusiness, clearBusiness, businesses, selectBusiness, setBusinesses } = useBusiness();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return localStorage.getItem('username') || localStorage.getItem('user') || null;
    } catch {
      return null;
    }
  });
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  useEffect(() => {
    // Fetch session username from API or localStorage
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/login/session`,
          { withCredentials: true }
        );
        if (res.data?.username) {
          setUser(res.data.username);
          localStorage.setItem('username', res.data.username);
        } else {
          setUser(null);
          localStorage.removeItem('username');
        }
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Automatically fetch businesses and restore selected business if not yet loaded
    const loadBusinesses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/showbusinesses`,
          { withCredentials: true }
        );
        const list = res.data.businesses || [];
        if (list.length > 0) {
          if (setBusinesses) setBusinesses(list);
          if (!selectedBusiness) {
            const stored = localStorage.getItem("selectedBusiness");
            if (stored) {
              try {
                selectBusiness(JSON.parse(stored));
              } catch {
                selectBusiness(list[0]);
              }
            } else {
              selectBusiness(list[0]);
            }
          }
        }
      } catch (err) {
        // User may not be logged in or guest
      }
    };
    loadBusinesses();
  }, [selectedBusiness]);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
        withCredentials: true,
      });
      localStorage.clear();
      clearBusiness();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if API call fails
      clearBusiness();
      window.location.href = "/";
    }
  };

  const isActive = (path) => location.pathname === path;
  const isReportsActive = [
    "/showtransections",
    "/ledger-balancing",
    "/trial-balance",
    "/income-report",
    "/balance-sheet",
  ].includes(location.pathname);

  // Close open dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.sf-dd')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Handler for dropdown toggle (mobile click support)
  const handleDropdownToggle = (name, e) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <>
      {/* Top Context Utility Banner */}
      {selectedBusiness && (
        <aside className="sf-ub">
          <div
            className="sf-wrap"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              Working in <b>{selectedBusiness.business_name}</b>. Every page shows this business only.{" "}
              <Link to="/list">Switch business</Link>
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              Smart Financial v2.4 · Single-Entity Scope
            </div>
          </div>
        </aside>
      )}

      {/* Main Header & Navbar */}
      <header className="sf-nav-header">
        <div className="sf-wrap">
          <nav className="sf-nb" aria-label="Main Navigation">
            {/* Logo */}
            <Link to="/" className="sf-logo" aria-label="Smart Financials Home">
              <img
                src="/final.png"
                alt="Smart Financials by Khushi Vijay"
                className="sf-nav-logo-img"
              />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="sf-mbtn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span>Menu</span>
            </button>

            {/* Navigation Links */}
            <ul className={`sf-nv ${isMobileMenuOpen ? "mobile-open" : ""}`}>
              <li className="sf-it">
                <Link
                  to="/"
                  className={`sf-tr ${isActive("/") ? "cur" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li className="sf-it">
                <Link
                  to="/list"
                  className={`sf-tr ${isActive("/list") ? "cur" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Businesses
                </Link>
              </li>
              <li className="sf-it">
                <Link
                  to="/showbusinessaccount"
                  className={`sf-tr ${isActive("/showbusinessaccount") ? "cur" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ledgers
                </Link>
              </li>

              {/* Reports Dropdown Trigger */}
              <li className={`sf-it sf-dd ${openDropdown === "Reports" ? "open" : ""}`}>
                <button
                  type="button"
                  className={`sf-tr ${isReportsActive ? "cur" : ""}`}
                  onClick={(e) => handleDropdownToggle("Reports", e)}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === "Reports"}
                >
                  Reports
                  <svg
                    className="sf-cr"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className={`sf-pnl sf-p-rep ${openDropdown === "Reports" ? "open" : ""}`}>
                  <div className="sf-pc">
                    <p className="sf-ph">Four statements & accounting records</p>
                    <div className="sf-g2">
                      {/* 1. General Journal */}
                      <Link
                        to="/showtransections"
                        className="sf-mi sf-rp"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span>
                          <b>General Journal</b>
                          <em>All journal entries & audit log</em>
                        </span>
                        <span className="sf-ar" aria-hidden="true">→</span>
                      </Link>

                      {/* 2. Ledger Balancing */}
                      <button
                        type="button"
                        onClick={(e) => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                          e.preventDefault();
                          navigate("/ledger-balancing", { state: { selectedLedger: "all" } });
                        }}
                        className="sf-mi sf-rp"
                      >
                        <span>
                          <b>Ledger Balancing</b>
                          <em>Balance = debits − credits</em>
                        </span>
                        <span className="sf-ar" aria-hidden="true">→</span>
                      </button>

                      {/* 3. Trail Balance */}
                      <Link
                        to="/trial-balance"
                        className="sf-mi sf-rp"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span>
                          <b>Trail Balance</b>
                          <em>Debits = credits</em>
                        </span>
                        <span className="sf-ar" aria-hidden="true">→</span>
                      </Link>

                      {/* 4. Income Statement */}
                      <Link
                        to="/income-report"
                        className="sf-mi sf-rp"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span>
                          <b>Income Statement</b>
                          <em>Revenue − COGS − OPEX</em>
                        </span>
                        <span className="sf-ar" aria-hidden="true">→</span>
                      </Link>

                      {/* 5. Balance sheet */}
                      <Link
                        to="/balance-sheet"
                        className="sf-mi sf-rp"
                        style={{ gridColumn: "span 2" }}
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span>
                          <b>Balance sheet</b>
                          <em>Assets = liabilities + equity</em>
                        </span>
                        <span className="sf-ar" aria-hidden="true">→</span>
                      </Link>
                    </div>
                    <p className="sf-pf">Every report downloads as a PDF.</p>
                  </div>
                </div>
              </li>

              {/* Primary CTA Button: Post transactions */}
              <li className="sf-it">
                <Link
                  to="/transectionForm"
                  className="sf-tr-post"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Post transactions
                </Link>
              </li>

              {/* Contact Link */}
              <li className="sf-it">
                <Link
                  to="/contact"
                  className={`sf-tr ${isActive("/contact") ? "cur" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Right Section: Business Switcher & User Profile */}
            <div className={`sf-rt ${isMobileMenuOpen ? "mobile-open" : ""}`}>
              {/* Active Business Selector Trigger - Always Rendered */}
              <div className={`sf-it sf-dd ${openDropdown === "business" ? "open" : ""}`}>
                <button
                  type="button"
                  className="sf-chip"
                  onClick={(e) => handleDropdownToggle("business", e)}
                  aria-haspopup="true"
                  aria-label={
                    selectedBusiness
                      ? `Active business: ${selectedBusiness.business_name}. Switch business`
                      : "Select business"
                  }
                >
                  {selectedBusiness?.logo_url ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${selectedBusiness.logo_url}`}
                      alt="Biz Logo"
                      className="h-5 w-5 object-contain rounded bg-white"
                    />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                      <path d="M12 2v4" stroke="currentColor" strokeWidth="2.5" />
                    </svg>
                  )}
                  <span>{selectedBusiness?.business_name || "Select business"}</span>
                  <svg
                    className="sf-cr"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="sf-pnl sf-p-biz r">
                  <div className="sf-pc">
                    <p className="sf-ph">
                      {selectedBusiness ? "Switch business" : "Choose business"}
                    </p>
                    {selectedBusiness && (
                      <Link
                        to="/showbusinessaccount"
                        className="sf-mi sf-bz"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span className="sf-rd on" />
                        <span>
                          <b>{selectedBusiness.business_name}</b>
                          <small>
                            {selectedBusiness.business_type || "Sole Proprietorship"} · Active
                          </small>
                        </span>
                        <span className="sf-tg">Active</span>
                      </Link>
                    )}

                    {businesses &&
                      businesses
                        .filter((b) => !selectedBusiness || b.business_id !== selectedBusiness.business_id)
                        .slice(0, 4)
                        .map((b) => (
                          <button
                            key={b.business_id}
                            type="button"
                            onClick={() => {
                              selectBusiness(b);
                              setOpenDropdown(null);
                              setIsMobileMenuOpen(false);
                              navigate("/showbusinessaccount");
                            }}
                            className="sf-mi sf-bz"
                          >
                            <span className="sf-rd" />
                            <span>
                              <b>{b.business_name}</b>
                              <small>{b.business_type || "Sole Proprietorship"}</small>
                            </span>
                            <span className="sf-ar" aria-hidden="true">→</span>
                          </button>
                        ))}

                    <div className="sf-pf2">
                      <Link
                        to="/business"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        + New business
                      </Link>
                      <Link
                        to="/list"
                        onClick={() => {
                          setOpenDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Manage all →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Profile Avatar Trigger */}
              <div className={`sf-it sf-dd ${openDropdown === "user" ? "open" : ""}`}>
                <button
                  type="button"
                  className="sf-av"
                  onClick={(e) => handleDropdownToggle("user", e)}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${user || "user"}`}
                >
                  <i>{user ? user.charAt(0).toUpperCase() : "U"}</i>
                  <svg
                    className="sf-cr"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="sf-pnl sf-p-usr r">
                  <div className="sf-pc">
                    <p className="sf-ph">Signed in as</p>
                    <p
                      style={{
                        padding: "0 16px 12px",
                        fontWeight: 700,
                        fontSize: "17px",
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      {user || "Account"}
                    </p>
                    <Link
                      to="/profile"
                      className="sf-mi sf-sm"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span><b>Profile settings</b></span>
                      <span className="sf-ar" aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/list"
                      className="sf-mi sf-sm"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span><b>Your businesses</b></span>
                      <span className="sf-ar" aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/contact"
                      className="sf-mi sf-sm"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span><b>Contact</b></span>
                      <span className="sf-ar" aria-hidden="true">→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="sf-mi sf-sm sf-out"
                    >
                      <span><b>Log out</b></span>
                      <span className="sf-ar" aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Navbar;