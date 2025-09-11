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
  Users,
  Globe,
  Zap,
  Award,
  DollarSign,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Floating Elements Component ---
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-lg opacity-20"
        animate={{
          y: [0, 30, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rotate-45 opacity-20"
        animate={{
          y: [0, -15, 0],
          x: [0, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-32 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-15"
        animate={{
          y: [0, -25, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// --- Enhanced Stats Component ---
const StatsSection = () => {
  const stats = [
    { number: "10K+", label: "Active Businesses", icon: Building2 },
    { number: "$2.5B+", label: "Transactions Processed", icon: DollarSign },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "24/7", label: "Customer Support", icon: Clock },
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-4"
          >
            Trusted by businesses worldwide
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300"
          >
            Join the growing community of successful businesses
          </motion.p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4 group-hover:bg-white/20 transition-colors">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- Testimonials Component ---
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CEO, Tech Startup",
      content:
        "FinanceFlow transformed how we handle our accounting. The interface is intuitive and the features are exactly what we needed.",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=64&h=64&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Small Business Owner",
      content:
        "The multi-business management feature is a game-changer. I can handle all my ventures from one place effortlessly.",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Freelance Consultant",
      content:
        "Simple, powerful, and reliable. FinanceFlow handles everything I need without the complexity of enterprise software.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            What our customers say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Real feedback from real businesses
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
        overflowX: "hidden",
      }}
    >
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const [hueA, hueB] = colorPairs[i % colorPairs.length];
        const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(
          hueB
        )})`;
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
                width: "100%",
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

// --- Enhanced FeatureBox for Desktop ---
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
    <div className="group p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-2xl h-full transition-all duration-300 bg-white backdrop-blur-sm hover:bg-gradient-to-br hover:from-white hover:to-primary-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-100 to-transparent rounded-bl-3xl opacity-50"></div>
      <div className="relative z-10">
        <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
          {feature.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {isPC ? (
        <motion.div
          drag
          dragConstraints={
            boxRef?.current || { top: 0, bottom: 0, left: 0, right: 0 }
          }
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ y: -5 }}
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
    description:
      "Manage multiple businesses from one dashboard with ease and precision",
  },
  {
    icon: BarChart3,
    title: "Chart of Accounts",
    description:
      "Organize your finances with a comprehensive chart of accounts system",
  },
  {
    icon: Calculator,
    title: "Double-Entry Accounting",
    description:
      "Professional accounting with automatic balance validation and accuracy",
  },
  {
    icon: FileText,
    title: "Transaction Management",
    description:
      "Track all your financial transactions with detailed records and insights",
  },
  {
    icon: PieChart,
    title: "Financial Reports",
    description:
      "Generate insightful reports to understand your business performance",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Your financial data is protected with enterprise-grade security protocols",
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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/login/session`,
          { withCredentials: true }
        );
        setUser(res.data.username);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
        withCredentials: true,
      });
      localStorage.clear();
      setUser(null);
      navigate("/login");
    } catch {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-x-hidden">
      {/* Enhanced Navbar */}
      <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 min-h-24 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="flex justify-between items-center h-16">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="/final.png"
                alt="Logo"
                className="h-16 w-auto mr-2"
                style={{ marginTop: "18px" }}
              />
            </motion.div>
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {user ? (
                <>
                  <span className="sm:text-gray-700 font-medium max-sm:text-xs flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Logged-in
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 font-medium max-sm:text-xs transition-all duration-300 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 hover:shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 min-h-screen flex items-center">
        <FloatingElements />

        {/* Enhanced Financial Background */}
        <div className="absolute inset-0">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

          {/* Overlay gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-purple-600/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-pink-500/10"></div>

          {/* Financial pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          {/* Animated financial elements */}
          <div className="absolute inset-0">
            {/* Floating money symbols */}
            <div className="absolute top-20 left-10 text-4xl text-green-400/20 animate-pulse">
              $
            </div>
            <div className="absolute top-40 right-20 text-3xl text-yellow-400/20 animate-bounce">
              €
            </div>
            <div className="absolute bottom-40 left-32 text-5xl text-blue-400/20 animate-pulse">
              £
            </div>
            <div className="absolute bottom-20 right-40 text-3xl text-purple-400/20 animate-bounce">
              ¥
            </div>

            {/* Chart lines effect */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ filter: "blur(1px)" }}
            >
              <defs>
                <linearGradient
                  id="chartGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#3b82f6", stopOpacity: 0.2 }}
                  />
                  <stop
                    offset="50%"
                    style={{ stopColor: "#8b5cf6", stopOpacity: 0.3 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#06b6d4", stopOpacity: 0.2 }}
                  />
                </linearGradient>
              </defs>
              <path
                d="M0,400 Q200,200 400,300 T800,250 L800,600 L0,600 Z"
                fill="url(#chartGradient)"
                className="animate-pulse"
              />
              <path
                d="M0,500 Q300,100 600,200 T1200,180"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Subtle mesh pattern */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full text-white text-sm font-medium mb-8 shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Now with Enhanced Features!
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Accounting made{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 block">
                  simple & powerful
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mt-6 leading-relaxed">
                Manage your business finances with professional-grade accounting
                software. From startups to enterprises, we've got you covered
                with intelligent automation and beautiful design.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                {user ? (
                  <motion.button
                    onClick={() => navigate("/list")}
                    className="btn-primary text-lg px-8 py-4 flex items-center justify-center group shadow-2xl hover:shadow-3xl transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </motion.button>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="btn-primary text-lg px-8 py-4 flex items-center justify-center group shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                      Start Free Today
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </Link>
                  </motion.div>
                )}

                <motion.button
                  className="flex items-center justify-center text-gray-300 hover:text-white font-medium transition-colors duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg mr-3 group-hover:shadow-xl group-hover:bg-white/20 transition-all duration-300">
                    <Play className="w-5 h-5 ml-1 text-cyan-400" />
                  </div>
                  Watch Demo
                </motion.button>
              </div>

              <div className="flex flex-wrap items-center mt-8 text-sm text-gray-400 gap-6">
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  No credit card required
                </span>
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  Free forever plan
                </span>
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  Setup in under 5 minutes
                </span>
              </div>
            </motion.div>

            <motion.div
              className="relative mt-10 lg:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Enhanced Dashboard Preview */}
              <div className="relative">
                <motion.div
                  className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-500"
                  style={{
                    transform: `perspective(1000px) rotateX(${
                      scrollY * 0.01
                    }deg) rotateY(${scrollY * 0.005}deg)`,
                  }}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dashboard Overview
                        </h3>
                        <p className="text-sm text-gray-500">
                          Real-time business insights
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm opacity-90">
                            Total Revenue
                          </span>
                          <div className="text-3xl font-bold mt-1">
                            $124,563
                          </div>
                        </div>
                        <TrendingUp className="w-8 h-8 opacity-90" />
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center text-sm">
                          <span className="text-green-300">↗ +12.5%</span>
                          <span className="ml-2 opacity-90">
                            from last month
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">
                          248
                        </div>
                        <div className="text-sm text-gray-500">
                          Transactions
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">
                          $45.2K
                        </div>
                        <div className="text-sm text-gray-500">This Month</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Monthly Goal</span>
                        <span>78%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "78%" }}
                          transition={{ delay: 1, duration: 1.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating notification */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 shadow-lg"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Updates</span>
                  </div>
                </motion.div>

                {/* Additional floating elements */}
                <motion.div
                  className="absolute -bottom-6 -left-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Award className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Everything you need to manage your finances
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Professional accounting features designed for businesses of all
              sizes, with modern design and intelligent automation
            </motion.p>
          </div>

          {/* Mobile/Tablet: Animated Cards */}
          <div className="block lg:hidden">
            <ScrollTriggeredFeatures features={features} />
          </div>

          {/* Desktop: Enhanced Feature Grid */}
          <div
            ref={boxRef}
            className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
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

      {/* Stats Section */}
      <StatsSection />

      {/* Enhanced Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-200 to-transparent rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-200 to-transparent rounded-full opacity-20 translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 rounded-full text-primary-700 text-sm font-medium mb-6"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Simple Pricing
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Choose the perfect plan for your business
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Start free and upgrade as you grow
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border ${
                  plan.popular
                    ? "ring-2 ring-primary-500 lg:scale-105 border-primary-200"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center shadow-lg">
                      <Star className="w-4 h-4 mr-2 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-2 text-lg">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 text-lg">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + featureIndex * 0.1 }}
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/register"
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-center block transition-all duration-300 shadow-lg hover:shadow-xl ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white"
                        : "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Enhanced CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/CTA_banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to transform your business finances?
          </motion.h2>
          <motion.p
            className="text-xl text-primary-100 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of businesses that trust FinanceFlow for their
            accounting needs. Start your journey to better financial management
            today.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-xl transition-colors flex items-center justify-center shadow-2xl hover:shadow-3xl group"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              className="mt-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className=" border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-12 flex items-center justify-center space-x-8 text-white/60"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm">Bank-grade security</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="text-sm">10,000+ users</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              <span className="text-sm">50+ countries</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  FinanceFlow
                </span>
              </div>
              <p className="text-gray-400 mb-6">
                Professional accounting software for modern businesses.
                Streamline your finances with intelligent automation.
              </p>
              <div className="flex space-x-4">
                {/* Social media icons - using simple divs for demonstration */}
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    Cookies
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center group"
                  >
                    <ChevronDown className="w-4 h-4 mr-2 rotate-90 group-hover:translate-x-1 transition-transform" />
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 FinanceFlow. All rights reserved. Built with ❤️ for
                modern businesses.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>🌍 English</span>
                <span>💱 USD</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  All systems operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
