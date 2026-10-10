import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Menu, X } from 'lucide-react';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '../Visister/firebase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ visitors: 0, clicks: 0 });
  const [isPaused, setIsPaused] = useState(false);

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
      style={{
        background: '#F2F5EE',
        fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif",
        color: '#0E1A14',
        fontVariantNumeric: 'tabular-nums',
        WebkitFontSmoothing: 'antialiased',
        minHeight: '100vh'
      }}
    >
      {/* TOP NAVIGATION */}
      <header
        className="sf-wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingTop: '28px',
          paddingBottom: '28px'
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <img src="/final.png" alt="Smart Financial Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        </Link>

        {/* Auth CTA Actions */}
        <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/list')}
                style={{ fontWeight: 600, padding: '0 12px', cursor: 'pointer', background: 'none', border: 'none', color: '#000' }}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{ fontWeight: 600, padding: '0 12px', color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Logout
              </button>
              <Link
                to="/profile"
                className="sf-btn sf-btn-ink"
                style={{ minHeight: '46px', gap: '8px' }}
              >
                <User className="w-4 h-4 text-brand-lime" />
                <span>Welcome, {user}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontWeight: 600, padding: '0 12px', color: '#000' }}>
                Log in
              </Link>
              <Link to="/register" className="sf-btn sf-btn-ink" style={{ minHeight: '46px' }}>
                Create account
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#000' }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden w-full"
            style={{
              background: '#fff',
              border: '2px solid #0E1A14',
              borderRadius: '6px',
              padding: '20px',
              marginTop: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 600, color: '#000' }}>
              {user ? (
                <>
                  <span style={{ fontSize: '14px', color: '#000' }}>Signed in as {user}</span>
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/list'); }}
                    className="sf-btn sf-btn-lime"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    style={{ color: '#dc2626', fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" style={{ padding: '8px 0', color: '#000' }}>
                    Log in
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="sf-btn sf-btn-ink">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className={`sf-wrap lh ${isPaused ? 'lh-paused' : ''}`} style={{ paddingTop: '48px', paddingBottom: '56px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '56px', alignItems: 'center' }}>
          {/* Left Column: Copy */}
          <div style={{ flex: '1 1 440px', maxWidth: '520px' }}>
            <h1
              className="lh-rise"
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontSize: 'clamp(52px, 8vw, 90px)',
                lineHeight: 0.98,
                letterSpacing: '-0.04em',
                fontWeight: 800
              }}
            >
              A ledger that checks its own work.
            </h1>
            <p className="lh-rise" style={{ animationDelay: '.12s', fontSize: '22px', marginTop: '28px', color: '#2C3F34', lineHeight: 1.55 }}>
              Every entry is kept in double-entry form, and the trial balance proves that debits equal credits before you rely on a single number.
            </p>
            <div className="lh-rise" style={{ animationDelay: '.24s', display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap', marginTop: '36px' }}>
              <Link
                to={user ? "/list" : "/register"}
                className="sf-btn sf-btn-lime"
                style={{ minHeight: '56px', fontSize: '18px', padding: '0 32px' }}
              >
                {user ? "Go to your vaults" : "Create your first vault"}
              </Link>
              <Link
                to={user ? "/list" : "/login"}
                style={{ fontWeight: 600, fontSize: '17px', borderBottom: '2px solid #0E1A14' }}
              >
                {user ? "Dashboard" : "Log in"}
              </Link>
            </div>
          </div>

          {/* Right Column: Animated Double-Entry Ledger Sheet */}
          <div className="lh-rise" style={{ animationDelay: '.2s', flex: '1 1 540px' }}>
            <div role="img" aria-label="Animation: a trial balance for business October is written line by line. Debits total 6,190.00 and credits total 6,190.00, then a Balanced stamp lands on the page.">
              <div className="lh-paper">
                <div style={{ padding: '16px 24px', borderBottom: '2px solid #0E1A14', background: '#fff', borderRadius: '4px 4px 0 0' }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '22px', letterSpacing: '-0.03em' }}>
                    Report · business · October
                  </p>
                </div>
                <div className="lh-cols">
                  <div className="lh-stem" style={{ top: 0 }}></div>
                  {/* Debit Side */}
                  <div style={{ background: '#fff' }}>
                    <div className="lh-hd2" style={{ height: '46px', boxSizing: 'border-box', borderBottom: '3px solid #0E1A14' }}>
                      <span>Debit</span>
                    </div>
                    <div className="lh-row" style={{ animationDelay: '.6s' }}><span>Cash</span><span>5,000.00</span></div>
                    <div className="lh-row" style={{ animationDelay: '.9s' }}><span>Rent expense</span><span>800.00</span></div>
                    <div className="lh-row" style={{ animationDelay: '1.2s' }}><span>Utilities expense</span><span>390.00</span></div>
                  </div>
                  {/* Credit Side */}
                  <div style={{ background: '#fff' }}>
                    <div className="lh-hd2" style={{ height: '46px', boxSizing: 'border-box', borderBottom: '3px solid #0E1A14' }}>
                      <span>Credit</span>
                    </div>
                    <div className="lh-row" style={{ animationDelay: '.75s' }}><span>Sales</span><span>5,000.00</span></div>
                    <div className="lh-row" style={{ animationDelay: '1.05s' }}><span>Loan payable</span><span>1,190.00</span></div>
                    <div className="lh-row" style={{ animation: 'none', opacity: 0, height: '44px' }}></div>
                  </div>
                </div>
                {/* Totals Bar */}
                <div className="lh-cols" style={{ position: 'relative', borderTop: '2px solid #0E1A14', background: '#fff', borderRadius: '0 0 4px 4px' }}>
                  <div className="lh-tot"><span>Total</span><span>6,190.00</span></div>
                  <div className="lh-tot"><span>Total</span><span>6,190.00</span></div>
                  <div className="lh-sweep"></div>
                </div>
                {/* Balanced Stamp */}
                <div className="lh-stamp">
                  <b>BALANCED</b>
                  <span>Debits = credits</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              style={{
                display: 'inline-block',
                marginTop: '56px',
                fontSize: '14px',
                fontWeight: 600,
                padding: '8px 14px',
                border: '2px solid #0E1A14',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff',
                userSelect: 'none'
              }}
            >
              {isPaused ? 'Play animation' : 'Pause animation'}
            </button>
          </div>
        </div>
      </section>

      {/* 3-PILLAR PROOF STRIP */}
      <section className="sf-wrap" style={{ paddingBottom: '80px' }}>
        {/* Real-time telemetry bar preserving Firebase live values */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: '#0E1A14',
            color: '#F2F5EE',
            borderRadius: '6px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
            border: '2px solid #0E1A14'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8F135', display: 'inline-block' }}></span>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8F135' }}>
              Real-Time Ledger Telemetry
            </span>
          </div>
          <div style={{ fontSize: '15px', color: '#B9C6BD' }}>
            <span style={{ color: '#F2F5EE', fontWeight: 700 }}>{stats.visitors.toLocaleString()}</span> Live Visitors &nbsp;·&nbsp;
            <span style={{ color: '#F2F5EE', fontWeight: 700 }}>{stats.clicks.toLocaleString()}</span> Interaction Syncs &nbsp;·&nbsp;
            <span style={{ color: '#C8F135', fontWeight: 700 }}>99.98% Verification Uptime</span>
          </div>
        </div>

        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            border: '2px solid #0E1A14',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#fff'
          }}
        >
          <li style={{ padding: '28px 32px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>1</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0 8px' }}>Debits always equal credits</h3>
            <p style={{ fontSize: '16px', color: '#44544B' }}>Unbalanced entries are rejected before they reach the database.</p>
          </li>
          <li style={{ padding: '28px 32px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>2</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0 8px' }}>Four reports, no spreadsheet</h3>
            <p style={{ fontSize: '16px', color: '#44544B' }}>Ledger, trial balance, income statement and balance sheet.</p>
          </li>
          <li style={{ padding: '28px 32px', background: '#C8F135' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>3</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0 8px' }}>An assistant that only reads</h3>
            <p style={{ fontSize: '16px', color: '#0E1A14' }}>Ask in plain words. It looks things up and never edits.</p>
          </li>
        </ol>
      </section>

      {/* VAULTS SECTION */}
      <section id="vaults" style={{ borderTop: '2px solid #0E1A14', background: '#fff', padding: '96px 0 80px' }}>
        <div className="sf-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#44544B' }}>Vaults</p>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontSize: 'clamp(40px, 6vw, 64px)',
                letterSpacing: '-0.04em',
                lineHeight: 0.98,
                fontWeight: 800,
                margin: '16px 0 24px'
              }}
            >
              One login. A separate vault for every business.
            </h2>
            <p style={{ fontSize: '19px', color: '#44544B', maxWidth: '440px', lineHeight: 1.55 }}>
              Create as many businesses as you run. Pick a vault and every account, transaction and report you open belongs to that business only.
            </p>
          </div>
          <div style={{ flex: '1 1 460px' }}>
            <div style={{ border: '2px solid #0E1A14', borderRadius: '6px 6px 0 0', padding: '24px', background: '#C8F135' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0E1A14' }}>Selected vault</p>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', marginTop: '8px', fontWeight: 800 }}>Corner Shop</h3>
              <p style={{ marginTop: '8px', fontSize: '17px' }}>Cash · Accounts Receivable · Utilities Expense</p>
            </div>
            <div style={{ border: '2px solid #0E1A14', borderTop: 0, padding: '24px', background: '#fff' }}>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '30px', fontWeight: 700 }}>Design Studio</h3>
              <p style={{ marginTop: '6px', fontSize: '16px', color: '#44544B' }}>Bank Account 1 · Accounts Receivable · Software Expense</p>
            </div>
            <div style={{ border: '2px solid #0E1A14', borderTop: 0, borderRadius: '0 0 6px 6px', padding: '24px', background: '#fff' }}>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '30px', fontWeight: 700 }}>Household</h3>
              <p style={{ marginTop: '6px', fontSize: '16px', color: '#44544B' }}>Cash · Rent Expense · Savings</p>
            </div>
          </div>
        </div>
      </section>

      {/* REPORTS SECTION */}
      <section id="reports" className="sf-wrap" style={{ padding: '110px 32px 90px', color: '#000' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#000' }}>
          Four statements, generated for you
        </p>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            fontWeight: 800,
            margin: '16px 0 48px',
            maxWidth: '820px',
            color: '#000'
          }}
        >
          The maths is done. You just read the result.
        </h2>
        <div style={{ borderBottom: '1px solid #C9D3C2' }}>
          <Link to={user ? "/ledger-balancing" : "/login"} className="sf-chk" style={{ color: '#000' }}>
            <b style={{ color: '#000' }}>01</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#000' }}>Ledger</h3>
            <p style={{ fontSize: '17px', color: '#000' }}>Every account with its debit total, credit total and the balance left over.</p>
            <p style={{ fontWeight: 600, fontSize: '16px', color: '#000' }}>Cash: 500.00 − 200.00 = 300.00 debit</p>
          </Link>
          <Link to={user ? "/trial-balance" : "/login"} className="sf-chk" style={{ color: '#000' }}>
            <b style={{ color: '#000' }}>02</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#000' }}>Trial balance</h3>
            <p style={{ fontSize: '17px', color: '#000' }}>All account balances in a single list, proving the books agree with themselves.</p>
            <p style={{ fontWeight: 600, fontSize: '16px', color: '#000' }}>Total debits = total credits</p>
          </Link>
          <Link to={user ? "/income-report" : "/login"} className="sf-chk" style={{ color: '#000' }}>
            <b style={{ color: '#000' }}>03</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#000' }}>Income statement</h3>
            <p style={{ fontSize: '17px', color: '#000' }}>Revenue less cost of goods sold gives gross profit. Operating expenses take you to net income.</p>
            <p style={{ fontWeight: 600, fontSize: '16px', color: '#000' }}>Revenue − COGS − OPEX = net income</p>
          </Link>
          <Link to={user ? "/balance-sheet" : "/login"} className="sf-chk" style={{ color: '#000' }}>
            <b style={{ color: '#000' }}>04</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#000' }}>Balance sheet</h3>
            <p style={{ fontSize: '17px', color: '#000' }}>What you own, what you owe and what is left for the owners, at a glance.</p>
            <p style={{ fontWeight: 600, fontSize: '16px', color: '#000' }}>Assets = liabilities + equity</p>
          </Link>
        </div>
        <p style={{ marginTop: '20px', fontSize: '16px', color: '#000' }}>Every report downloads as a PDF.</p>
      </section>

      {/* ASK YOUR BOOKS (DARK SECTION) */}
      <section id="ask" style={{ background: '#0E1A14', color: '#F2F5EE', padding: '100px 0' }}>
        <div className="sf-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px' }}>
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8F135' }}>Ask your books</p>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontSize: 'clamp(40px, 6vw, 64px)',
                letterSpacing: '-0.04em',
                lineHeight: 0.98,
                fontWeight: 800,
                margin: '16px 0 24px'
              }}
            >
              Skip the filters. Just ask.
            </h2>
            <p style={{ color: '#B9C6BD', fontSize: '19px', maxWidth: '440px', lineHeight: 1.55 }}>
              The assistant works out what you mean, including dates like "last week", and looks it up in your vault. It can only read your data. It cannot change it.
            </p>
            <p style={{ color: '#B9C6BD', fontSize: '19px', maxWidth: '440px', marginTop: '16px', lineHeight: 1.55 }}>
              Questions that are not about your money get a help answer instead of a database search.
            </p>
          </div>
          <div style={{ flex: '1 1 460px' }}>
            <div style={{ borderTop: '1px solid #2C3F34', padding: '24px 0' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8FA196' }}>You asked</p>
              <p style={{ fontSize: '26px', marginTop: '8px' }}>Show me total income for this month.</p>
            </div>
            <div style={{ borderTop: '1px solid #2C3F34', padding: '24px 0' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8F135' }}>Smart Financial</p>
              <p style={{ fontSize: '26px', marginTop: '8px', color: '#C8F135', fontWeight: 600 }}>Total income this month is $5,000.</p>
            </div>
            <div style={{ borderTop: '1px solid #2C3F34', padding: '24px 0' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8FA196' }}>You asked</p>
              <p style={{ fontSize: '26px', marginTop: '8px' }}>Did we buy office supplies last week?</p>
            </div>
            <div style={{ borderTop: '1px solid #2C3F34', padding: '24px 0' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8F135' }}>Smart Financial</p>
              <p style={{ fontSize: '26px', marginTop: '8px', color: '#C8F135', fontWeight: 600 }}>Here are the office supplies expenses from last week.</p>
            </div>
            <div style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', borderBottom: '1px solid #2C3F34' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8FA196' }}>Not understood</p>
              <p style={{ fontSize: '19px', marginTop: '8px', color: '#B9C6BD' }}>Gibberish does not crash anything. You get a friendly help message with common questions to try.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY / TRUST SECTION */}
      <section id="trust" style={{ background: '#0E1A14', color: '#F2F5EE', padding: '0 0 100px' }}>
        <div className="sf-wrap">
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8F135', borderTop: '2px solid #C8F135', paddingTop: '56px' }}>
            Built so a mistake cannot go far
          </p>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: 'clamp(40px, 6vw, 64px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
              fontWeight: 800,
              margin: '16px 0 40px',
              maxWidth: '820px'
            }}
          >
            Security you can read, not just trust.
          </h2>
          <dl style={{ margin: 0, borderBottom: '1px solid #2C3F34' }}>
            <div className="sf-sec">
              <dt>Balanced or nothing</dt>
              <dd>Every transaction is checked before it is written. If debits and credits do not match to the last digit, it is rejected.</dd>
            </div>
            <div className="sf-sec">
              <dt>Read-only assistant</dt>
              <dd>Questions turn into strict read-only lookups. The assistant has no way to edit or delete your records.</dd>
            </div>
            <div className="sf-sec">
              <dt>Your data, your account</dt>
              <dd>Every request is tied to your signed-in account, so one user's vaults are never visible to another.</dd>
            </div>
            <div className="sf-sec">
              <dt>Safe sign-in</dt>
              <dd>Passwords are hashed, accounts are verified by email or Google, and sessions use secure, HTTP-only cookies.</dd>
            </div>
            <div className="sf-sec">
              <dt>Safe queries</dt>
              <dd>Database queries use prepared statements, which blocks SQL injection.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* GETTING STARTED STEPS */}
      <section className="sf-wrap" style={{ padding: '110px 32px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#44544B' }}>Getting started</p>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            fontWeight: 800,
            margin: '16px 0 48px'
          }}
        >
          Five steps to your first balanced entry.
        </h2>
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            border: '2px solid #0E1A14',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#fff'
          }}
        >
          <li style={{ padding: '28px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>1</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Register</h3>
            <p style={{ color: '#44544B' }}>Email or Google.</p>
          </li>
          <li style={{ padding: '28px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>2</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Verify</h3>
            <p style={{ color: '#44544B' }}>Confirm your email.</p>
          </li>
          <li style={{ padding: '28px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>3</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Create a vault</h3>
            <p style={{ color: '#44544B' }}>One per business.</p>
          </li>
          <li style={{ padding: '28px', borderRight: '1px solid #C9D3C2' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>4</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Add accounts</h3>
            <p style={{ color: '#44544B' }}>Cash, utilities, receivables.</p>
          </li>
          <li style={{ padding: '28px', background: '#C8F135' }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>5</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Record</h3>
            <p>Post transactions. Read reports.</p>
          </li>
        </ol>
      </section>

      {/* WHO IT IS FOR */}
      <section className="sf-wrap" style={{ padding: '0 32px 100px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#44544B' }}>Who it is for</p>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontSize: 'clamp(36px, 5vw, 48px)',
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            fontWeight: 800,
            margin: '14px 0 36px',
            maxWidth: '720px'
          }}
        >
          Rigorous enough for accountants. Simple enough for everyone else.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Small business owners</h3>
            <p style={{ marginTop: '10px', fontSize: '18px', color: '#44544B', lineHeight: 1.55 }}>
              Keep proper books without learning accounting jargon first.
            </p>
          </div>
          <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Freelance accountants</h3>
            <p style={{ marginTop: '10px', fontSize: '18px', color: '#44544B', lineHeight: 1.55 }}>
              Give each client their own vault and switch between them in a click.
            </p>
          </div>
          <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Individuals</h3>
            <p style={{ marginTop: '10px', fontSize: '18px', color: '#44544B', lineHeight: 1.55 }}>
              Track household money with the same discipline as a company.
            </p>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section style={{ background: '#fff', borderTop: '2px solid #0E1A14', padding: '80px 0' }}>
        <div className="sf-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#44544B' }}>On the roadmap</p>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', fontWeight: 800, marginTop: '14px', letterSpacing: '-0.04em' }}>
              Planned, not shipped yet.
            </h2>
          </div>
          <div style={{ flex: '2 1 520px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>Excel and CSV export</h3>
              <p style={{ marginTop: '8px', color: '#44544B' }}>Alongside the PDF reports.</p>
            </div>
            <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>Bank reconciliation</h3>
              <p style={{ marginTop: '8px', color: '#44544B' }}>Pull transactions from open banking.</p>
            </div>
            <div style={{ borderTop: '2px solid #0E1A14', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>Roles and permissions</h3>
              <p style={{ marginTop: '8px', color: '#44544B' }}>Different access for bookkeepers and managers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION (LIME BANNER) */}
      <section style={{ background: '#C8F135', borderTop: '2px solid #0E1A14', padding: '100px 0' }}>
        <div className="sf-wrap">
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: 'clamp(48px, 8vw, 112px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
              fontWeight: 800,
              maxWidth: '1000px'
            }}
          >
            Open your first vault.
          </h2>
          <p style={{ fontSize: '22px', marginTop: '24px', maxWidth: '560px', color: '#0E1A14' }}>
            Rigorous bookkeeping, without needing an economics degree.
          </p>
          <div style={{ display: 'flex', gap: '14px', marginTop: '40px', flexWrap: 'wrap' }}>
            <Link to={user ? "/list" : "/register"} className="sf-btn sf-btn-ink" style={{ minHeight: '56px' }}>
              {user ? "Go to your vaults" : "Create account"}
            </Link>
            <Link to={user ? "/list" : "/login"} className="sf-btn sf-btn-line" style={{ minHeight: '56px' }}>
              {user ? "View Dashboard" : "Sign in to account"}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#F2F5EE', color: '#000', padding: '72px 0 40px', borderTop: '2px solid #0E1A14' }}>
        <div className="sf-wrap">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 280px' }}>
              <Link to="/" style={{ display: 'inline-block', marginBottom: '14px' }}>
                <img src="/final.png" alt="Smart Financial Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </Link>
              <p style={{ color: '#000', marginTop: '4px', maxWidth: '320px', fontSize: '16px', lineHeight: 1.55 }}>
                Double-entry accounting with an assistant that reads your books.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '13px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#000', display: 'block', marginBottom: '14px', fontWeight: 700 }}>
                Product
              </span>
              <p style={{ marginBottom: '8px' }}><a href="#vaults" style={{ color: '#000', transition: 'color .15s' }}>Vaults</a></p>
              <p style={{ marginBottom: '8px' }}><a href="#reports" style={{ color: '#000', transition: 'color .15s' }}>Reports</a></p>
              <p><a href="#ask" style={{ color: '#000', transition: 'color .15s' }}>Assistant</a></p>
            </div>
            <div>
              <span style={{ fontSize: '13px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#000', display: 'block', marginBottom: '14px', fontWeight: 700 }}>
                Account
              </span>
              <p style={{ marginBottom: '8px' }}><Link to="/login" style={{ color: '#000', transition: 'color .15s' }}>Log in</Link></p>
              <p style={{ marginBottom: '8px' }}><Link to="/register" style={{ color: '#000', transition: 'color .15s' }}>Create account</Link></p>
              <p><Link to="/forgot-password" style={{ color: '#000', transition: 'color .15s' }}>Forgot password</Link></p>
            </div>
            <div>
              <span style={{ fontSize: '13px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#000', display: 'block', marginBottom: '14px', fontWeight: 700 }}>
                Learn
              </span>
              <p style={{ marginBottom: '8px' }}><a href="#trust" style={{ color: '#000', transition: 'color .15s' }}>Security</a></p>
              <p><Link to="/contact" style={{ color: '#000', transition: 'color .15s' }}>Help</Link></p>
            </div>
          </div>
          <div
            style={{
              color: '#000',
              fontSize: '14px',
              marginTop: '56px',
              borderTop: '1px solid #0E1A14',
              paddingTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>© 2026 Sovereign Ledger</div>
            <div>All systems operational · Double-entry verified</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
