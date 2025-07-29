import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";
import axios from "axios";
import {
  Building2,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Plus,
  HomeIcon,
  Contact,
  ArrowDownIcon,
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBusiness, clearBusiness } = useBusiness();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  useEffect(() => {
    // Fetch session username from API or localStorage
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/login/session`,
          { withCredentials: true }
        );
        setUser(res.data.username);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

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
      // navigate('/login');
      window.location.href = "/";
    }
  };

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Businesses", href: "/list", icon: Building2 },
    { name: "Ledgers", href: "/showbusinessaccount", icon: Users },
    { name: "Post Transactions", href: "/transectionForm", icon: FileText },
    {
      name: "Reports",
      icon: FileText,
      children: [
        {
          name: "Show Transactions",
          href: "/showtransections",
          icon: FileText,
        },
      ],
    },
    { name: "contact", href: "/contact", icon: Contact },
  ];

  const isActive = (path) => location.pathname === path;

  // Handler for dropdown toggle
  const handleDropdownToggle = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const isMobile = () => window.innerWidth < 640;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 ">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/list"
                className="lg:text-2xl font-bold lg:text-primary-600"
              >
                Smart Financial
              </Link>
            </div>

            {selectedBusiness && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  if (item.children) {
                    return (
                      <div
                        key={item.name}
                        className="relative group"
                        onMouseEnter={() => {
                          if (!isMobile()) setOpenDropdown(item.name);
                        }}
                        onMouseLeave={() => {
                          if (!isMobile()) setOpenDropdown(null);
                        }}
                      >
                        <button
                          type="button"
                          className=" inline-flex items-center px-1 pt-4 text-[14px] underline font-medium text-gray-500 hover:text-gray-700 cursor-pointer border-b-2 border-transparent hover:border-gray-300 transition-colors duration-200 bg-transparent"
                          onClick={() => handleDropdownToggle(item.name)}
                          aria-haspopup="true"
                          aria-expanded={openDropdown === item.name}
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.name}
                        </button>
                        <div
                          className={`absolute ${
                            openDropdown === item.name ? "block" : "hidden"
                          } bg-white border shadow-lg mt-2 rounded-md z-50 min-w-[200px]`}
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <child.icon className="w-4 h-4 mr-2 inline-block" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-[14px] font-medium border-b-2 ${
                        isActive(item.href)
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } transition-colors duration-200`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {selectedBusiness && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-primary-50 rounded-lg">
                <Building2 className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">
                  {selectedBusiness.business_name}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Welcome, {user}</span>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {selectedBusiness &&
              navigation.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  return (
                    <div key={item.name} className="relative">
                      <button
                        className="flex items-center w-full pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => handleDropdownToggle(item.name)}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                        <span className="ml-auto">
                          <ArrowDownIcon className="w-4 h-4" />
                        </span>
                      </button>
                      <div
                        className={`${
                          openDropdown === item.name ? "block" : "hidden"
                        } bg-white border shadow-lg rounded-md z-50`}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setOpenDropdown(null);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <child.icon className="w-4 h-4 mr-2 inline-block" />
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block pl-3 pr-4 py-2 text-base font-medium ${
                      isActive(item.href)
                        ? "text-primary-700 bg-primary-50 border-r-4 border-primary-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {selectedBusiness && (
              <div className="flex items-center px-4 py-2">
                <Building2 className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  {selectedBusiness.business_name}
                </span>
              </div>
            )}
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
