import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import { Mail, Phone, MessageSquare, Send, User, Globe } from 'lucide-react';

const ContactForm = () => {
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [iframeLoadCount, setIframeLoadCount] = useState(0);

  const handleIframeLoad = () => {
    setIframeLoadCount((count) => {
      const next = count + 1;
      if (next >= 2) {
        setAlert({ show: true, message: '🎉 Submitted successfully!', type: 'success' });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
      }
      return next;
    });
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 via-transparent to-cyan-800/20"></div>

        {/* Professional grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Animated transaction display elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating transaction display icons */}
          <div className="absolute top-20 left-10 text-blue-400/20 animate-pulse flex items-center justify-center">
            <Mail className="w-10 h-10" />
          </div>
          <div className="absolute top-40 right-20 text-cyan-400/20 animate-bounce flex items-center justify-center">
            <Phone className="w-8 h-8" />
          </div>
          <div className="absolute bottom-40 left-32 text-purple-400/20 animate-pulse flex items-center justify-center">
            <MessageSquare className="w-12 h-12" />
          </div>
          <div className="absolute bottom-20 right-40 text-indigo-400/20 animate-bounce flex items-center justify-center">
            <Send className="w-8 h-8" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-teal-400/20 animate-pulse flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div className="absolute top-1/3 right-1/3 text-violet-400/20 animate-bounce flex items-center justify-center">
            <Globe className="w-10 h-10" />
          </div>

          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: "20s" }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>

          {/* Network connection lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ filter: "blur(0.5px)" }}>
            <defs>
              <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: "#8b5cf6", stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: "#06b6d4", stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              d="M100,100 L300,200 L600,150 L900,300 L1200,200"
              stroke="url(#networkGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M200,400 L500,300 L800,450 L1100,350"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </svg>
        </div>

        {/* Subtle overlay for content readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-grow py-10 px-4 flex items-center justify-center pb-20">
          <div className="bg-white/95 backdrop-blur-sm shadow-xl sm:rounded-2xl p-6 border border-white/20 max-w-3xl w-full mx-auto relative z-20">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center w-full">Contact Us</h1>
            </div>

            <div className="flex justify-center w-full overflow-hidden rounded-xl bg-white/50 relative z-30">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLScHrLwnLzDbdEYpl0Mp8IebiwMQWWhTLOtJGPU1KBqJX8XYEQ/viewform?embedded=true"
                width="640"
                height="883"
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
                onLoad={handleIframeLoad}
                className="bg-transparent"
                style={{ position: 'relative', zIndex: 40 }}
              >
                Loading…
              </iframe>
            </div>

            {/* Alert */}
            {alert.show && (
              <div
                className={`mt-6 transition-all duration-300 ease-in-out p-4 rounded-lg text-white font-semibold text-center ${alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}
              >
                {alert.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
