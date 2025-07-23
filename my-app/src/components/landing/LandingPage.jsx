import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Check,
  Star,
  ArrowRight,
  Play,
  BarChart3,
  Calculator,
  PieChart
} from 'lucide-react';
import { motion } from "motion/react";
import { useRef } from "react";

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('free');
   const boxRef = useRef(null);

  const features = [
    {
      icon: Building2,
      title: 'Multi-Business Management',
      description: 'Manage multiple businesses from one dashboard with ease'
    },
    {
      icon: BarChart3,
      title: 'Chart of Accounts',
      description: 'Organize your finances with a comprehensive chart of accounts'
    },
    {
      icon: Calculator,
      title: 'Double-Entry Accounting',
      description: 'Professional accounting with automatic balance validation'
    },
    {
      icon: FileText,
      title: 'Transaction Management',
      description: 'Track all your financial transactions with detailed records'
    },
    {
      icon: PieChart,
      title: 'Financial Reports',
      description: 'Generate insightful reports to understand your business'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your financial data is protected with enterprise-grade security'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 3 businesses',
        'Basic business information',
        'Essential accounting features',
        'Transaction management',
        'Basic reports'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Premium',
      price: '$29',
      period: 'per month',
      description: 'Advanced features for growing businesses',
      features: [
        'Unlimited businesses',
        'Complete business profiles',
        'Advanced accounting features',
        'Detailed financial reports',
        'Priority support',
        'Custom integrations'
      ],
      cta: 'Start Premium Trial',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-primary-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">FinanceFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Accounting made
                <span className="text-primary-600 block">simple & powerful</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Manage your business finances with professional-grade accounting software.
                From startups to enterprises, we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-4 flex items-center justify-center group"
                >
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="flex items-center justify-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center mt-8 text-sm text-gray-500">
                <Check className="w-4 h-4 text-success-500 mr-2" />
                No credit card required
                <Check className="w-4 h-4 text-success-500 ml-6 mr-2" />
                Free forever plan
              </div>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                    <TrendingUp className="w-5 h-5 text-success-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">$124,563</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-progress-bar"></div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-warning-100 rounded-xl p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-warning-800">Live Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your finances
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional accounting features designed for businesses of all sizes
            </p>
          </div>

          <div ref={boxRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  drag
                  initial={{ opacity: 0, y: 40 }} // thoda neeche aur invisible
                  animate={{ opacity: 1, y: 0 }}  // full visible aur position 0
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1], // CSS-style cubic bezier easing
                  }}
                  dragConstraints={boxRef}
                  key={index}
                  className="group p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg "
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose the perfect plan for your business
            </h2>
            <p className="text-xl text-gray-600">
              Start free and upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl animate-fade-in-up ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
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
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-950 h-screen bg-center bg-no-repeat md:[background-size:100%]" style={{ backgroundImage: "url('/CTA_banner.jpg')" , width:'100vw' , height:'50vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to transform your business finances?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust FinanceFlow for their accounting needs
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
                <span className="text-xl font-bold text-white">FinanceFlow</span>
              </div>
              <p className="text-gray-400">
                Professional accounting software for modern businesses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
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