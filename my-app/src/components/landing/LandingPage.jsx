import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Menu, X, ArrowRight } from 'lucide-react';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '../Visister/firebase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ visitors: 0, clicks: 0 });

  // Auth & Visitor Tracking Logic
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
          withCredentials: true
        });
        setUser(res.data.username);
      } catch {
        setUser(null);
      }
    };
    fetchUser();

    // Visitor tracking logic preserved
    const visitorsRef = ref(db, 'site_stats/visitors');
    runTransaction(visitorsRef, (currentCount) => (currentCount || 0) + 1).catch(console.error);

    const statsRef = ref(db, 'site_stats');
    const unsub = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats({
          visitors: data.visitors || 0,
          clicks: data.clicks || 0
        });
      }
    });

    let lastClickTime = 0;
    const handleGlobalClick = () => {
      const now = Date.now();
      if (now - lastClickTime > 1000) {
        lastClickTime = now;
        const clicksRef = ref(db, 'site_stats/clicks');
        runTransaction(clicksRef, (currentCount) => (currentCount || 0) + 1).catch(console.error);
      }
    };
    window.addEventListener('click', handleGlobalClick);

    return () => {
      unsub();
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
        withCredentials: true
      });
      localStorage.clear();
      setUser(null);
      navigate('/login');
    } catch {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <div
      className="bg-[#FCFCFC] text-[#111315] antialiased selection:bg-brand-lime selection:text-black min-h-screen font-sans"
      style={{ backgroundColor: 'rgb(242, 245, 238)' }}
    >
      {/* BEGIN: MainHeader */}
      <header
        className="w-full bg-[#FCFCFC]/90 backdrop-blur-md sticky top-0 z-50 border-b border-black/5"
        data-purpose="site-navigation"
        style={{ backgroundColor: 'rgba(242, 245, 238, 0.9)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link className="flex items-center gap-2.5 group" data-purpose="brand-logo" to="/">
            <div className="w-7 h-7 bg-brand-lime rounded-md flex items-center justify-center border border-black shadow-sm">
              <div className="w-3.5 h-3.5 bg-black rounded-[2px] transform rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111315]">Ledgerly</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-neutral-600" data-purpose="nav-links">
            <a className="hover:text-black transition-colors" href="#product">Product</a>
            <a className="hover:text-black transition-colors" href="#solutions">Solutions</a>
            <a className="hover:text-black transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-black transition-colors" href="#resources">Resources</a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-6 text-[15px] font-medium" data-purpose="header-cta">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/list')}
                  className="text-neutral-700 hover:text-black transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Logout
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 bg-brand-dark text-white hover:bg-black px-5 py-2.5 rounded-full font-medium transition-all shadow-sm"
                >
                  <User className="w-4 h-4 text-brand-lime" />
                  <span>Welcome, {user}</span>
                </Link>
              </>
            ) : (
              <>
                <Link className="text-neutral-700 hover:text-black transition-colors" to="/login">
                  Log in
                </Link>
                <Link
                  className="bg-brand-dark text-white hover:bg-black px-5 py-2.5 rounded-full font-medium transition-all shadow-sm"
                  to="/register"
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-800 p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 py-4 flex flex-col space-y-4">
            <a onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-700 hover:text-black font-medium" href="#product">
              Product
            </a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-700 hover:text-black font-medium" href="#solutions">
              Solutions
            </a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-700 hover:text-black font-medium" href="#pricing">
              Pricing
            </a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-700 hover:text-black font-medium" href="#resources">
              Resources
            </a>
            <div className="pt-2 border-t border-neutral-200 flex flex-col space-y-3">
              {user ? (
                <>
                  <span className="text-xs font-semibold text-neutral-500">Welcome, {user}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/list');
                    }}
                    className="text-left font-medium text-neutral-900 cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-left font-medium text-red-500 cursor-pointer"
                  >
                    Logout
                  </button>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-left font-medium text-neutral-900"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-left font-medium text-neutral-900"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center bg-brand-dark text-white py-2.5 rounded-full font-medium"
                  >
                    Start free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: HeroSection */}
      <section className="pt-12 pb-20 overflow-hidden" data-purpose="hero-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Column: Copy & CTAs */}
            <div className="lg:col-span-7 pr-0 lg:pr-4" data-purpose="hero-text-block">
              {/* Announcement Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 mb-7 text-xs sm:text-sm font-medium text-neutral-800">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>New · Ask your books anything</span>
              </div>
              {/* Hero Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#111315] leading-[1.05] mb-6">
                Books that<br />
                balance<br />
                themselves.
              </h1>
              {/* Hero Subheading */}
              <p className="text-lg sm:text-xl text-neutral-600 font-normal leading-relaxed max-w-xl mb-9">
                Invoices, expenses, bank feeds and reports in one calm workspace — with an AI that does the boring bookkeeping while you run the business.
              </p>
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Link
                  className="inline-flex items-center justify-center bg-brand-lime hover:bg-brand-lime-hover text-black font-semibold px-7 py-3.5 rounded-full text-base transition-all shadow-sm"
                  to={user ? "/list" : "/register"}
                >
                  {user ? "Go to Dashboard" : "Try it free for 30 days"}
                </Link>
                <a
                  className="inline-flex items-center justify-center bg-transparent hover:bg-neutral-100 text-neutral-800 font-medium px-7 py-3.5 rounded-full text-base border border-neutral-300 transition-all"
                  href="#demo"
                >
                  Watch 2-min demo
                </a>
              </div>
              {/* Fine note */}
              <p className="text-xs text-neutral-500 font-medium pl-1">
                No card needed. Cancel anytime.
              </p>
            </div>

            {/* Hero Right Column: Dynamic App Preview / Dark Dashboard Mockup */}
            <div className="lg:col-span-5 relative" data-purpose="hero-dashboard-mockup">
              {/* Main Obsidian Dashboard Container */}
              <div className="bg-brand-dark text-white rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-neutral-800">
                {/* Dashboard Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-neutral-400 font-medium">Cash flow · This quarter</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-[#34D399] border border-emerald-500/20 text-xs font-semibold">
                    Live
                  </span>
                </div>
                {/* Net Balance Highlight */}
                <div className="mb-6">
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">$48,920</div>
                  <div className="text-xs text-neutral-400 mt-1">Net balance across 3 accounts</div>
                </div>
                {/* Bar Chart Visual representation */}
                <div className="flex items-end justify-between gap-2.5 h-32 pt-4 pb-2 px-1 mb-6 border-b border-neutral-800/80">
                  <div className="w-full bg-neutral-800/80 rounded-lg h-14"></div>
                  <div className="w-full bg-neutral-800/80 rounded-lg h-20"></div>
                  <div className="w-full bg-neutral-800/80 rounded-lg h-16"></div>
                  <div className="w-full bg-neutral-800/80 rounded-lg h-24"></div>
                  <div className="w-full bg-neutral-800/80 rounded-lg h-20"></div>
                  <div className="w-full bg-brand-lime rounded-lg h-28 shadow-[0_0_15px_rgba(216,249,41,0.3)]"></div>
                </div>
                {/* Recent Invoices List */}
                <div className="space-y-2.5 max-w-[65%]">
                  <div className="bg-neutral-900/90 hover:bg-neutral-800/80 transition-colors border border-neutral-800 px-4 py-3 rounded-xl text-xs font-medium text-neutral-300">
                    Invoice #1042 · Studio Nova
                  </div>
                  <div className="bg-neutral-900/90 hover:bg-neutral-800/80 transition-colors border border-neutral-800 px-4 py-3 rounded-xl text-xs font-medium text-neutral-300">
                    Invoice #1043 · Kite Labs
                  </div>
                </div>
                {/* Floating AI Prompt Notification Card */}
                <div className="absolute -bottom-6 -right-3 sm:-right-6 w-64 sm:w-72 bg-white text-black rounded-2xl p-4 shadow-2xl border border-neutral-100 z-10" data-purpose="floating-ai-card">
                  <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">Ledgerly AI</div>
                  <p className="text-xs font-bold leading-snug text-neutral-900 mb-3">
                    I matched 14 bank transactions and flagged 1 duplicate bill. Review?
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer">
                      Review
                    </button>
                    <button type="button" className="border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-medium px-4 py-1.5 rounded-full transition-colors cursor-pointer">
                      Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: HeroSection */}

      {/* BEGIN: FeaturePills */}
      <section className="py-6 overflow-x-auto scrollbar-none bg-transparent" data-purpose="feature-tags-nav">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-start sm:justify-center gap-2.5 min-w-max">
            {['Invoicing', 'Expenses', 'Bank feeds', 'Payroll', 'Inventory', 'Tax & VAT', 'Multi-currency', 'Reports'].map((tag, i) => (
              <span
                key={i}
                className="px-5 py-2 rounded-full border border-neutral-200 bg-white text-neutral-700 text-sm font-medium hover:border-black cursor-pointer transition-colors shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
      {/* END: FeaturePills */}

      {/* BEGIN: BentoSection */}
      <section className="py-24 bg-transparent" data-purpose="everything-in-one-place" id="product">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Headers */}
          <div className="mb-14">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block mb-3">
              Everything in one place
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 flex flex-wrap items-center gap-3">
              <span>Less spreadsheet. More</span>
              <span className="inline-block bg-brand-lime px-3.5 py-1 rounded-2xl text-black">business.</span>
            </h2>
          </div>

          {/* Bento Grid (3 Columns x 2 Rows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Invoicing (Vibrant Neon Accent) */}
            <div className="bg-brand-lime text-black rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-sm transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-800">Invoicing</span>
                <h3 className="text-3xl font-extrabold mt-8 mb-3 tracking-tight leading-snug">
                  Get paid days sooner.
                </h3>
              </div>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
                Branded invoices, automatic reminders and one-tap payment links.
              </p>
            </div>

            {/* Card 2: Bank Feeds (White Card with Progress Bar) */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-xs transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Bank feeds</span>
                {/* Progress indicator mock */}
                <div className="mt-4 mb-4">
                  <div className="w-full bg-neutral-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div className="bg-brand-dark h-full rounded-full w-[86%]"></div>
                  </div>
                  <span className="text-xs font-medium text-neutral-500">86% reconciled automatically</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
                  Reconcile in minutes.
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Transactions match themselves. You only touch the odd ones out.
              </p>
            </div>

            {/* Card 3: Reports (Dark Obsidian Card) */}
            <div className="bg-brand-dark text-white rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-lg transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-brand-lime">Reports</span>
                <h3 className="text-3xl font-extrabold mt-8 mb-3 tracking-tight">
                  Know your numbers.
                </h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Profit &amp; loss, balance sheet and cash forecast — always current, never exported.
              </p>
            </div>

            {/* Card 4: Expenses */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-xs transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Expenses</span>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mt-8 mb-2">
                  Snap a receipt. Done.
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Scan, categorise and attach to the right bill.
              </p>
            </div>

            {/* Card 5: Tax */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-xs transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Tax</span>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mt-8 mb-2">
                  Tax-ready all year.
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                VAT and sales tax tracked as you go, filed without panic.
              </p>
            </div>

            {/* Card 6: Team */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between min-h-[290px] shadow-xs transition-transform hover:-translate-y-1 duration-200">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Team</span>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mt-8 mb-2">
                  Your accountant, invited.
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Share access with roles — no more emailing files.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: BentoSection */}

      {/* BEGIN: RealTimeInsightsSection */}
      <section className="py-24 bg-transparent" data-purpose="realtime-business-insights" id="insights">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header & Badge */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/5 border border-black/10 text-neutral-800 text-xs font-bold tracking-widest uppercase mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              FINFLOW ANALYTICS // REAL-TIME TELEMETRY
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-4">
              Real-time Business Insights
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed">
              Instant visibility across all active ledger syncs, live visitors, and continuous interaction streams.
            </p>
          </div>

          {/* Obsidian Telemetry Console Window Card */}
          <div
            className="bg-[#0c1017] rounded-3xl p-6 sm:p-10 border border-neutral-800 shadow-2xl relative overflow-hidden text-white"
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)' }}
          >
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-800/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#27C93F]/80 inline-block"></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                FINFLOW ANALYTICS
              </div>
            </div>

            {/* Top 3 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {/* Card 1: Active Ledger Syncs */}
              <div className="bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-neutral-400 block mb-2">Active Ledger Syncs</span>
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">24,103</div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    ✓ Real-time validation
                  </span>
                </div>
              </div>

              {/* Card 2: Total Visitors */}
              <div className="bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-neutral-400 block mb-2">Total Visitors</span>
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                    {stats.visitors.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    Live traffic count
                  </span>
                </div>
              </div>

              {/* Card 3: Total Interactions */}
              <div className="bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-neutral-400 block mb-2">Total Interactions</span>
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                    {stats.clicks.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    Live interaction tracking
                  </span>
                </div>
              </div>
            </div>

            {/* Lower Histogram Bar Chart Container */}
            <div className="bg-neutral-900/50 border border-neutral-800/90 rounded-2xl p-6 sm:p-7">
              {/* Chart Header Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-xs text-neutral-400 font-mono">
                <span className="tracking-wider text-cyan-400 font-semibold">SYNCHRONOUS THROUGHPUT HISTOGRAM (LAST 8 INTERVALS)</span>
                <span className="text-neutral-500">Automated Ingestion · Peak: +34.2% Sync Velocity</span>
              </div>

              {/* 10 Vertical Bars Matching Stitch Design */}
              <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-3 px-2 pt-6 pb-2 border-b border-neutral-800">
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '25%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '45%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '22%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '60%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '44%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '78%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '48%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125 shadow-[0_0_20px_rgba(6,182,212,0.4)]" style={{ height: '96%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '68%' }}></div>
                <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 hover:brightness-125" style={{ height: '88%' }}></div>
              </div>

              {/* Bottom Axis Time Marks */}
              <div className="flex justify-between items-center text-[11px] font-mono text-neutral-500 pt-3 px-1">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span className="text-cyan-400 font-bold">NOW</span>
                <span>+2H EST</span>
              </div>

              {/* Telemetry Status Bar */}
              <div className="mt-6 pt-4 border-t border-neutral-800/70 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Sync Health: <strong className="text-white font-medium">99.98% uptime</strong>
                  </span>
                  <span>Average Latency: <strong className="text-white font-medium">42ms</strong></span>
                  <span className="hidden sm:inline">Packet Loss: <strong className="text-white font-medium">0.00%</strong></span>
                </div>
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  Ledger status: In Sync
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: RealTimeInsightsSection */}

      {/* BEGIN: HowItWorksSection */}
      <section className="py-20 border-y border-neutral-200/60 bg-transparent" data-purpose="how-it-works" id="solutions">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Title */}
          <div className="mb-16">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block mb-3">
              How it works
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900">
              Set up before your chai cools.
            </h2>
          </div>

          {/* 3 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {/* Step 1 */}
            <div className="flex flex-col" data-purpose="step-card">
              <div className="step-num-outline mb-4">1</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Connect your bank</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Secure read-only feeds bring in every transaction.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col" data-purpose="step-card">
              <div className="step-num-outline mb-4">2</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Let Ledgerly sort it</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Categories, matches and reminders happen automatically.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col" data-purpose="step-card">
              <div className="step-num-outline mb-4">3</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Run on real numbers</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Open the dashboard and see exactly where you stand.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: HowItWorksSection */}

      {/* BEGIN: LedgerlyAiBanner */}
      <section className="py-20" data-purpose="ai-feature-section" id="demo">
        <div className="max-w-7xl mx-auto px-6">
          {/* Dark Obsidian Container */}
          <div className="bg-brand-dark rounded-4xl sm:rounded-5xl p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* AI Promo Left */}
              <div className="lg:col-span-5">
                <span className="text-xs font-bold tracking-widest uppercase text-brand-lime block mb-4">Ledgerly AI</span>
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                  Just ask your<br />books.
                </h2>
                <p className="text-base text-neutral-400 font-normal leading-relaxed mb-8 max-w-sm">
                  Type a question in plain English — or Roman Urdu. Get an answer, a chart and the entry behind it.
                </p>
                <a
                  className="inline-flex items-center justify-center bg-brand-lime hover:bg-brand-lime-hover text-black font-semibold px-6 py-3 rounded-full text-sm transition-all shadow-md"
                  href="#demo"
                >
                  Meet the assistant
                </a>
              </div>

              {/* Chat UI Mockup Right */}
              <div className="lg:col-span-7 flex flex-col space-y-3.5" data-purpose="chat-mockup">
                {/* User Prompt Bubble */}
                <div className="self-start bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs sm:text-sm px-5 py-3 rounded-2xl max-w-md border border-neutral-700/50">
                  Kitna profit hua is month?
                </div>
                {/* Assistant Response Bubble (Lime Neon) */}
                <div className="self-end bg-brand-lime text-black font-medium text-xs sm:text-sm px-5 py-3.5 rounded-2xl max-w-md shadow-md leading-relaxed">
                  Net profit is $12,480, up 18% on last month. Your biggest cost was software at $3,100.
                </div>
                {/* Follow-up Suggestion Chip */}
                <div className="self-start bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 text-xs sm:text-sm px-5 py-3 rounded-2xl max-w-md border border-neutral-700/50">
                  Show unpaid invoices over 30 days.
                </div>
                {/* Search / Query Input Bar */}
                <div className="pt-2">
                  <div className="w-full bg-neutral-900/90 border border-neutral-700/70 rounded-full px-5 py-3.5 flex items-center justify-between text-neutral-400 text-xs sm:text-sm">
                    <span>Ask anything about your finances...</span>
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: LedgerlyAiBanner */}

      {/* BEGIN: PricingSection */}
      <section className="py-20" data-purpose="pricing-plans" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block mb-3">Pricing</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900">
              Simple plans. Honest prices.
            </h2>
          </div>

          {/* Pricing Cards 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Starter */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between shadow-xs" data-purpose="pricing-card">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Starter</h3>
                <p className="text-xs text-neutral-500 font-medium mt-1 mb-6">For freelancers</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">$19</span>
                  <span className="text-sm font-semibold text-neutral-500 ml-1">/mo</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-medium text-neutral-600 border-t border-neutral-100 pt-6">
                  <li>Invoices &amp; expenses</li>
                  <li>1 bank connection</li>
                  <li>Basic reports</li>
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to={user ? "/list" : "/register"}
                  className="block text-center w-full border border-neutral-300 hover:border-black text-neutral-800 font-semibold py-3 px-6 rounded-full text-xs sm:text-sm transition-all"
                >
                  Choose Starter
                </Link>
              </div>
            </div>

            {/* Plan 2: Growth (Featured / Lime Neon) */}
            <div
              className="bg-brand-lime text-black rounded-3xl p-8 flex flex-col justify-between shadow-xl relative border-2 border-brand-lime transform lg:-translate-y-2"
              data-purpose="pricing-card-featured"
            >
              <div>
                <div className="inline-block bg-brand-lime px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-black/10">
                  Most Popular
                </div>
                <h3 className="text-2xl font-black text-neutral-900">Growth</h3>
                <p className="text-xs text-neutral-800 font-semibold mt-1 mb-6">For growing teams</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">$49</span>
                  <span className="text-sm font-bold text-neutral-800 ml-1">/mo</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-bold text-neutral-900 border-t border-black/10 pt-6">
                  <li>Everything in Starter</li>
                  <li>Ledgerly AI assistant</li>
                  <li>Payroll &amp; multi-currency</li>
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to={user ? "/list" : "/register"}
                  className="block text-center w-full bg-brand-dark hover:bg-black text-white font-semibold py-3 px-6 rounded-full text-xs sm:text-sm transition-all shadow-md"
                >
                  Choose Growth
                </Link>
              </div>
            </div>

            {/* Plan 3: Scale */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between shadow-xs" data-purpose="pricing-card">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Scale</h3>
                <p className="text-xs text-neutral-500 font-medium mt-1 mb-6">For finance teams</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">$99</span>
                  <span className="text-sm font-semibold text-neutral-500 ml-1">/mo</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-medium text-neutral-600 border-t border-neutral-100 pt-6">
                  <li>Everything in Growth</li>
                  <li>Custom roles &amp; audit trail</li>
                  <li>Priority support</li>
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to={user ? "/list" : "/register"}
                  className="block text-center w-full border border-neutral-300 hover:border-black text-neutral-800 font-semibold py-3 px-6 rounded-full text-xs sm:text-sm transition-all"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: PricingSection */}

      {/* BEGIN: BigBannerCta */}
      <section className="py-16" data-purpose="giant-cta-banner" id="start">
        <div className="max-w-7xl mx-auto px-6">
          {/* Full-Width Lime Banner */}
          <div className="bg-brand-lime rounded-4xl sm:rounded-5xl p-10 sm:p-16 lg:p-24 text-center flex flex-col items-center justify-center shadow-lg">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-950 mb-8 max-w-4xl leading-[1.08]">
              Close the books. Not your weekend.
            </h2>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                className="bg-brand-dark hover:bg-black text-white font-semibold px-8 py-3.5 rounded-full text-sm sm:text-base transition-all shadow-md"
                to={user ? "/list" : "/register"}
              >
                {user ? "Go to Dashboard" : "Start free"}
              </Link>
              <a
                className="bg-transparent hover:bg-black/5 text-neutral-900 border border-black/25 font-semibold px-8 py-3.5 rounded-full text-sm sm:text-base transition-all"
                href="#demo"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* END: BigBannerCta */}

      {/* BEGIN: SiteFooter */}
      <footer className="bg-brand-dark text-white pt-20 pb-12 border-t border-neutral-800" data-purpose="site-footer" id="resources">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-neutral-800/80">
            {/* Footer Left Brand Column */}
            <div className="md:col-span-5">
              <Link className="flex items-center gap-2.5 mb-4 group" to="/">
                <div className="w-7 h-7 bg-brand-lime rounded-md flex items-center justify-center border border-black shadow-sm">
                  <div className="w-3.5 h-3.5 bg-black rounded-[2px] transform rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Ledgerly</span>
              </Link>
              <p className="text-xs sm:text-sm text-neutral-400 font-normal max-w-xs">
                Accounting that feels like a conversation.
              </p>
            </div>

            {/* Footer Right Links Columns */}
            <div className="md:col-span-7 grid grid-cols-3 gap-8">
              {/* Column: Product */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Product</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                  <li><a className="hover:text-white transition-colors" href="#product">Invoicing</a></li>
                  <li><a className="hover:text-white transition-colors" href="#product">Expenses</a></li>
                  <li><a className="hover:text-white transition-colors" href="#product">Reports</a></li>
                  <li><a className="hover:text-white transition-colors" href="#demo">AI assistant</a></li>
                </ul>
              </div>

              {/* Column: Company */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Company</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                  <li><a className="hover:text-white transition-colors" href="#product">About</a></li>
                  <li><a className="hover:text-white transition-colors" href="#solutions">Careers</a></li>
                  <li><a className="hover:text-white transition-colors" href="#pricing">Contact</a></li>
                </ul>
              </div>

              {/* Column: Resources */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Resources</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                  <li><a className="hover:text-white transition-colors" href="#help">Help centre</a></li>
                  <li><a className="hover:text-white transition-colors" href="#guides">Guides</a></li>
                  <li><a className="hover:text-white transition-colors" href="#security">Security</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-medium">
            <div>© 2026 Ledgerly. All rights reserved.</div>
          </div>
        </div>
      </footer>
      {/* END: SiteFooter */}
    </div>
  );
}
