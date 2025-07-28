import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  FileText,
  TrendingUp,
  Shield,
  Check,
  Star,
  ArrowRight,
  Play,
  BarChart3,
  Calculator,
  PieChart,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Animated Features for Mobile/Tablet ---
const hue = (h) => `hsl(${h}, 100%, 50%)`;

function ScrollTriggeredFeatures({ features }) {
  const colorPairs = [
    [340, 20],
    [200, 260],
    [120, 180],
    [40, 100],
    [280, 340],
    [160, 220],
  ];
  return (
    <div
      style={{
        margin: "40px auto",
        width: "100%",
        paddingBottom: 40,
        boxSizing: "border-box",
        overflowX: "hidden", // Prevent horizontal scroll
      }}
    >
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const [hueA, hueB] = colorPairs[i % colorPairs.length];
        const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`;
        return (
          <div
            key={feature.title}
            style={{
              overflow: "visible",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              paddingTop: 40,
              marginBottom: 56,
              minHeight: 400,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%", // was "92vw"
                height: 400,
                background,
                borderRadius: 40,
                zIndex: 0,
                boxShadow: "0 8px 32px 0 rgba(0,0,0,0.10)",
                clipPath:
                  'path("M 0 373.5 C 0 362.454 8.995 355.101 20 353.5 L 320 289.5 C 330.085 288.033 340 298.454 340 309.5 L 340 400 C 340 411.046 331.046 420 320 420 L 20 420 C 8.954 420 0 411.046 0 400 Z")',
              }}
            />
            <motion.div
              style={{
                fontSize: 56,
                width: "85vw",
                maxWidth: 320,
                minWidth: 0,
                height: 260,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 24,
                background: "#f5f5f5",
                boxShadow:
                  "0 2px 8px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.08)",
                transformOrigin: "50% 100%",
                position: "relative",
                zIndex: 1,
                boxSizing: "border-box",
              }}
              initial={{ scale: 0.7, y: 120, opacity: 0 }}
              whileInView={{ scale: 1, y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                bounce: 0.45,
                duration: 0.85,
              }}
              viewport={{ once: true, amount: 0.7 }}
            >
              <Icon className="w-14 h-14 text-primary-600 mb-2" />
              <div className="font-semibold text-gray-900 text-lg text-center px-2">
                {feature.title}
              </div>
              <div className="text-xs text-gray-500 text-center px-2">
                {feature.description}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// --- FeatureBox for Desktop ---
const FeatureBox = ({ feature, Icon, boxRef }) => {
  const [isPC, setIsPC] = useState(window.innerWidth >= 1024);

  const handleResize = useCallback(() => {
    setIsPC(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const content = (
    <div className="group p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg h-full transition-shadow duration-300 bg-white">
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </div>
  );

  return (
    <div className="h-full">
      {isPC ? (
        <motion.div
          drag
          dragConstraints={boxRef?.current || { top: 0, bottom: 0, left: 0, right: 0 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {content}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {content}
        </motion.div>
      )}
    </div>
  );
};

const features = [
  {
    icon: Building2,
    title: "Multi-Business Management",
    description: "Manage multiple businesses from one dashboard with ease",
  },
  {
    icon: BarChart3,
    title: "Chart of Accounts",
    description: "Organize your finances with a comprehensive chart of accounts",
  },
  {
    icon: Calculator,
    title: "Double-Entry Accounting",
    description: "Professional accounting with automatic balance validation",
  },
  {
    icon: FileText,
    title: "Transaction Management",
    description: "Track all your financial transactions with detailed records",
  },
  {
    icon: PieChart,
    title: "Financial Reports",
    description: "Generate insightful reports to understand your business",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your financial data is protected with enterprise-grade security",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for small businesses getting started",
    features: [
      "Up to 3 businesses",
      "Basic business information",
      "Essential accounting features",
      "Transaction management",
      "Basic reports",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Premium",
    price: "$29",
    period: "per month",
    description: "Advanced features for growing businesses",
    features: [
      "Unlimited businesses",
      "Complete business profiles",
      "Advanced accounting features",
      "Detailed financial reports",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Start Premium Trial",
    popular: true,
  },
];

const LandingPage = () => {
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true });
        setUser(res.data.username);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, { withCredentials: true });
      localStorage.clear();
      setUser(null);
      navigate('/login');
    } catch {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 min-h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-col items-center">
              <Building2 className="w-8 h-8 text-primary-600 mr-2" />
              <div> <span className="sm:text-2xl font-bold text-gray-900">Smart Financial</span></div>

              <div>
                <small className="mt-2 sm:font-bold max-sm:text-xs max-sm:ml-1 ">By khushi vijay</small>
              </div>

            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* <Link to="/list" className="text-gray-600 hover:bg-gray-900 hover:text-warning-50 no-underline max-sm:text-xs font-medium  p-1 rounded border-solid border-black transition-colors">
                    Dashboard
                  </Link> */}
                  <span className="sm:text-gray-700 font-medium max-sm:text-xs">Logged-in</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 font-medium max-sm:text-xs transition-colors border border-gray-300 rounded px-3 py-1"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Accounting made{" "}
                <span className="text-primary-600 block">
                  simple & powerful
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mt-6 leading-relaxed">
                Manage your business finances with professional-grade accounting
                software. From startups to enterprises, we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                {user ? (
                  <button
                    onClick={() => navigate('/list')}
                    className="btn-primary text-lg px-8 py-4 flex items-center justify-center group"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-4 flex items-center justify-center group"
                  >
                    Start Free Today
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <button className="flex items-center justify-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>
              <div className="flex flex-wrap items-center mt-8 text-sm text-gray-500 gap-4">
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-success-500 mr-2" />
                  No credit card required
                </span>
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-success-500 mr-2" />
                  Free forever plan
                </span>
              </div>
            </div>
            <div className="relative mt-10 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Total Revenue
                    </span>
                    <TrendingUp className="w-5 h-5 text-success-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    $124,563
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-progress-bar"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-warning-100 rounded-xl p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-warning-800">
                    Live Updates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your finances
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Professional accounting features designed for businesses of all
              sizes
            </p>
          </div>
          {/* Mobile/Tablet: Animated Cards */}
          <div className="block lg:hidden">
            <ScrollTriggeredFeatures features={features} />
          </div>
          {/* Desktop: Original Feature Grid */}
          <div
            ref={boxRef}
            className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <FeatureBox
                  key={index}
                  feature={feature}
                  Icon={Icon}
                  boxRef={boxRef}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose the perfect plan for your business
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Start free and upgrade as you grow
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl animate-fade-in-up ${plan.popular ? "ring-2 ring-primary-500 scale-105" : ""
                  }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-success-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors ${plan.popular
                      ? "bg-primary-600 hover:bg-primary-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-10 bg-gray-950 overflow-hidden bg-center bg-no-repeat "
        style={{
          backgroundImage: "url('/CTA_banner.jpg')",
          backgroundSize: "cover",
        }}
      >
        <div className="py-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to transform your business finances?
          </h2>
          <p className="text-base sm:text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust FinanceFlow for their
            accounting needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors flex items-center justify-center"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="w-6 h-6 text-primary-400 mr-2" />
                <span className="text-xl font-bold text-white">
                  FinanceFlow
                </span>
              </div>
              <p className="text-gray-400">
                Professional accounting software for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Finance App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
