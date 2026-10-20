import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Menu, X } from 'lucide-react';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '../Visister/firebase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return localStorage.getItem('username') || localStorage.getItem('user') || null;
    } catch {
      return null;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ visitors: 0, clicks: 0 });

  // Auth check & Visitor Tracking (Preserved logic)
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, {
          withCredentials: true
        });
        if (isMounted) {
          if (res.data?.username) {
            setUser(res.data.username);
            localStorage.setItem('username', res.data.username);
          } else {
            setUser(null);
            localStorage.removeItem('username');
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('username');
        }
      }
    };
    fetchUser();

    // Visitor tracking
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

    const handleClickOutside = (e) => {
      if (!e.target.closest('.stitch-user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);

    return () => {
      unsub();
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);


  // Progressive Enhancement & Scroll Reveal Observer (~30 lines)
  useEffect(() => {
    document.documentElement.classList.add('js');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('is-in');
            el.style.willChange = 'opacity, transform';
            el.addEventListener(
              'transitionend',
              () => {
                el.style.willChange = 'auto';
              },
              { once: true }
            );
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
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
    <div className="stitch-landing-root">
      {/* Fixed Scroll Progress Bar */}
      <div className="stitch-scroll-progress" aria-hidden="true" />
      <style>{`
        .stitch-landing-root {
          background: #F2F5EE;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          color: #0E1A14;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          min-height: 100vh;
        }
        .stitch-landing-root h1, 
        .stitch-landing-root h2, 
        .stitch-landing-root h3, 
        .stitch-landing-root h4 {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          letter-spacing: -0.04em;
          line-height: 0.98;
          font-weight: 800;
        }
        .stitch-landing-root p { line-height: 1.55; }
        .stitch-landing-root a { color: inherit; text-decoration: none; }
        .stitch-landing-root a:focus-visible, 
        .stitch-landing-root button:focus-visible, 
        .stitch-landing-root summary:focus-visible {
          outline: 3px solid #0E1A14;
          outline-offset: 3px;
        }
        .stitch-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 32px;
          box-sizing: border-box;
        }
        .stitch-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 28px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 17px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
          text-decoration: none;
        }
        .stitch-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14,26,20,0.08);
        }
        .stitch-lime { background: #C8F135; color: #0E1A14; }
        .stitch-lime:hover { background: #b8e422; }
        .stitch-ink { background: #0E1A14; color: #F2F5EE; }
        .stitch-ink:hover { background: #1c2e25; }
        .stitch-line { background: transparent; color: #0E1A14; }
        .stitch-line:hover { background: rgba(14,26,20,0.06); }
        .stitch-eyebrow {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .stitch-muted { color: #44544B; }
        .stitch-rule { border-top: 2px solid #0E1A14; }

        /* Interactive Statement Rows */
        .stitch-chk {
          display: grid;
          grid-template-columns: 80px 1.2fr 1.6fr 1.2fr;
          gap: 24px;
          padding: 20px 16px;
          border-top: 1px solid #C9D3C2;
          align-items: baseline;
          transition: background-color 0.15s ease, padding 0.15s ease;
          border-radius: 6px;
          text-decoration: none;
          color: inherit;
        }
        .stitch-chk:hover { background: #C8F135; }
        .stitch-chk b {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 40px;
          letter-spacing: -0.04em;
        }

        /* Animated Hero Ledger */
        .lh-container {
          width: 100%;
          position: relative;
        }
        .lh-paper {
          position: relative;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background-image: repeating-linear-gradient(transparent 0 43px, #E5EBDF 43px 44px);
          box-shadow: 8px 8px 0px rgba(14,26,20,0.08);
          max-width: 100%;
          animation: lh-th 11s ease-out infinite both;
        }
        .lh-cols {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .lh-hd2 {
          font-size: 14px;
          font-weight: 600;
          color: #44544B;
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          background: #fff;
        }
        .lh-stem {
          position: absolute;
          left: calc(50% - 1.5px);
          top: 0;
          bottom: 0;
          width: 3px;
          background: #0E1A14;
          transform-origin: top;
          animation: lh-ts 11s ease-in-out infinite both;
        }
        .lh-row {
          display: flex;
          justify-content: space-between;
          padding: 0 24px;
          height: 44px;
          align-items: center;
          font-size: 19px;
          animation: lh-rw 11s ease-out infinite both;
        }
        .lh-tot {
          display: flex;
          justify-content: space-between;
          padding: 0 24px;
          height: 48px;
          align-items: center;
          font-size: 19px;
          font-weight: 700;
          animation: lh-tt 11s ease-out infinite both;
        }
        .lh-sweep {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 8px;
          background: #C8F135;
          transform-origin: left;
          animation: lh-sw 11s ease-in-out infinite both;
        }
        .lh-stamp {
          position: absolute;
          right: 24px;
          bottom: -34px;
          background: #C8F135;
          border: 3px solid #0E1A14;
          border-radius: 6px;
          padding: 8px 20px;
          text-align: center;
          transform: rotate(-8deg);
          box-shadow: 4px 4px 0px #0E1A14;
          animation: lh-st 11s cubic-bezier(.3,1.3,.5,1) infinite both;
          z-index: 10;
        }
        .lh-stamp b {
          display: block;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          letter-spacing: .06em;
          font-weight: 800;
          line-height: 1.1;
        }
        .lh-stamp span { font-size: 14px; font-weight: 600; }

        @keyframes lh-ts { 0% { transform: scaleY(0); } 6%, 88% { transform: scaleY(1); } 96%, 100% { transform: scaleY(0); } }
        @keyframes lh-rw { 0% { opacity: 0; transform: translateY(10px); } 6%, 84% { opacity: 1; transform: none; } 92%, 100% { opacity: 0; transform: none; } }
        @keyframes lh-tt { 0%, 22% { opacity: 0; } 28%, 84% { opacity: 1; } 92%, 100% { opacity: 0; } }
        @keyframes lh-sw { 0%, 30% { transform: scaleX(0); } 38%, 84% { transform: scaleX(1); } 92%, 100% { transform: scaleX(0); transform-origin: right; } }
        @keyframes lh-st {
          0%, 40% { opacity: 0; transform: rotate(-8deg) scale(1.8); }
          45% { opacity: 1; transform: rotate(-8deg) scale(.95); }
          48%, 84% { opacity: 1; transform: rotate(-8deg) scale(1); }
          92%, 100% { opacity: 0; transform: rotate(-8deg) scale(1); }
        }
        @keyframes lh-th { 0%, 44% { transform: none; } 45.5% { transform: translateY(4px); } 48%, 100% { transform: none; } }

        .lh-paused * { animation-play-state: paused !important; }

        .lh-pz {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 56px;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 16px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          cursor: pointer;
          background: #fff;
          transition: background 0.15s;
          user-select: none;
        }
        .lh-pz:hover { background: #f0f0f0; }

        /* Records illustration */
        .rc-facts { margin: 34px 0 0; border-bottom: 1px solid #B8C4B1; }
        .rc-facts div {
          display: grid;
          grid-template-columns: 190px 1fr;
          gap: 20px;
          padding: 18px 0;
          border-top: 1px solid #B8C4B1;
        }
        .rc-facts dt {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 22px;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .rc-facts dd { margin: 0; font-size: 17px; color: #44544B; }
        .rc-p {
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 6px 6px 0px rgba(14,26,20,0.06);
        }
        .rc-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .rc-ph {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 14px 20px;
          border-bottom: 2px solid #0E1A14;
          background: #F2F5EE;
          font-size: 15px;
          color: #44544B;
        }
        .rc-ph b {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          letter-spacing: -0.03em;
          font-weight: 800;
          color: #0E1A14;
        }
        .rc-t { width: 100%; min-width: 480px; border-collapse: collapse; font-size: 16px; font-variant-numeric: tabular-nums; }
        .rc-t td, .rc-t th { padding: 11px 20px; text-align: left; border-bottom: 1px solid #E5EBDF; }
        .rc-t .n { text-align: right; white-space: nowrap; }
        .rc-t th {
          font-size: 12px;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #44544B;
          font-weight: 600;
          border-bottom: 2px solid #0E1A14;
        }
        .rc-cf {
          background: #F2B66B;
          border-top: 2px solid #0E1A14;
          padding: 18px 20px;
        }
        .rc-btn {
          display: inline-block;
          padding: 10px 18px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          background: #0E1A14;
          color: #F2F5EE;
          cursor: pointer;
          text-align: center;
        }
        .rc-link {
          font-weight: 600;
          border-bottom: 2px solid #0E1A14;
          margin-left: 18px;
          font-size: 15px;
          cursor: pointer;
        }
        .rc-mv {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 0;
          font-size: 14px;
          font-weight: 600;
          color: #44544B;
        }
        .rc-mv::before, .rc-mv::after {
          content: "";
          width: 0;
          height: 18px;
          border-left: 2px dashed #0E1A14;
        }
        .rc-mv::before { margin-bottom: 6px; }
        .rc-mv::after { margin-top: 6px; }
        .rc-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 14px 20px;
          border-bottom: 2px solid #0E1A14;
        }
        .rc-tabs span {
          padding: 8px 14px;
          border: 2px solid #0E1A14;
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .rc-tabs span.on { background: #C8F135; }
        .rc-tabs i {
          font-style: normal;
          margin-left: 8px;
          padding: 0 7px;
          border: 2px solid #0E1A14;
          border-radius: 999px;
          background: #fff;
          font-size: 12px;
        }

        /* Proof strip & Steps cards */
        .grid-strip-proof {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
          box-shadow: 6px 6px 0px rgba(14,26,20,0.06);
        }
        .grid-strip-proof > li {
          padding: 28px 28px;
          border-right: 1px solid #C9D3C2;
        }
        .grid-strip-proof > li:last-child {
          border-right: none;
        }

        .grid-strip-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
          box-shadow: 6px 6px 0px rgba(14,26,20,0.06);
        }
        .grid-strip-steps > li {
          padding: 28px;
          border-right: 1px solid #C9D3C2;
        }
        .grid-strip-steps > li:last-child {
          border-right: none;
        }

        /* FAQ */
        .stitch-fq { border-top: 1px solid #B8C4B1; }
        .stitch-fq:last-child { border-bottom: 1px solid #B8C4B1; }
        .stitch-fq summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 24px 0;
          cursor: pointer;
          list-style: none;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 26px;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .stitch-fq summary::-webkit-details-marker { display: none; }
        .stitch-fq summary::after {
          content: "+";
          flex: none;
          width: 36px;
          height: 36px;
          border: 2px solid #0E1A14;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 500;
          transition: background 0.15s ease;
        }
        .stitch-fq summary:hover::after { background: #C8F135; }
        .stitch-fq[open] summary::after { content: "−"; background: #C8F135; }
        .stitch-fq p {
          padding: 0 56px 26px 0;
          font-size: 18px;
          max-width: 700px;
          color: #44544B;
        }

        .stitch-ftl {
          font-size: 13px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #C8F135;
          display: block;
          margin-bottom: 14px;
          font-weight: 600;
        }

        /* Nav Dropdown for Authenticated User (Profile Menu) */
        .stitch-user-menu {
          position: relative;
          display: inline-block;
        }
        /* Invisible hover bridge */
        .stitch-user-menu::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          height: 14px;
        }
        .stitch-user-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          font-weight: 700;
          cursor: pointer;
          font-size: 15px;
          color: #0E1A14;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          user-select: none;
        }
        .stitch-user-btn:hover {
          background: #F4F6F0;
        }
        .stitch-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0E1A14;
        }
        .stitch-user-avatar {
          width: 26px;
          height: 26px;
          background: #C8F135;
          border: 1.5px solid #0E1A14;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: #0E1A14;
        }
        .stitch-chevron {
          transition: transform 0.2s ease-out;
          display: inline-block;
        }
        .stitch-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 8px;
          box-shadow: 5px 5px 0px #0E1A14;
          z-index: 1000;
          padding: 6px 0;
        }
        .stitch-dropdown-header {
          padding: 10px 16px 12px;
          border-bottom: 1px solid #E5EBDF;
        }
        .stitch-dropdown-sub {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #5B6660;
          margin: 0;
        }
        .stitch-dropdown-user {
          font-weight: 800;
          font-size: 16px;
          color: #0E1A14;
          margin-top: 2px;
          margin-bottom: 0;
          font-family: 'Bricolage Grotesque', sans-serif;
        }
        .stitch-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #0E1A14;
          text-decoration: none;
          transition: background 0.15s;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          box-sizing: border-box;
          text-align: left;
        }
        .stitch-dropdown-item:hover {
          background: #C8F135;
        }
        .stitch-dropdown-item.logout {
          border-top: 1px solid #E5EBDF;
          color: #BA1A1A;
          margin-top: 4px;
          padding-top: 12px;
        }
        .stitch-dropdown-item.logout:hover {
          background: #FEE4E2;
        }

        /* Desktop: Hover opens profile menu */
        @media (min-width: 769px) {
          .stitch-dropdown-panel {
            display: none;
            opacity: 0;
            visibility: hidden;
            transform: translateY(6px);
            transition: opacity 0.18s ease-out, transform 0.18s ease-out, visibility 0.18s ease-out;
          }
          .stitch-user-menu:hover .stitch-dropdown-panel,
          .stitch-user-menu:focus-within .stitch-dropdown-panel,
          .stitch-dropdown-panel.desktop-open {
            display: block;
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            pointer-events: auto;
          }
          .stitch-user-menu:hover .stitch-chevron,
          .stitch-user-menu:focus-within .stitch-chevron {
            transform: rotate(180deg);
          }
        }

        /* Mobile: Click opens profile menu */
        @media (max-width: 768px) {
          .stitch-dropdown-panel {
            display: none;
          }
          .stitch-dropdown-panel.mobile-open {
            display: block;
            opacity: 1;
            visibility: visible;
            transform: none;
          }
        }

        /* Responsive Breakpoints */
        @media(max-width: 1024px) {
          .grid-strip-steps {
            grid-template-columns: repeat(2, 1fr);
          }
          .grid-strip-steps > li {
            border-right: 1px solid #C9D3C2;
            border-bottom: 1px solid #C9D3C2;
          }
          .grid-strip-steps > li:nth-child(2n) {
            border-right: none;
          }
          .grid-strip-steps > li:last-child {
            grid-column: 1 / -1;
            border-bottom: none;
            border-right: none;
          }
        }

        @media(max-width: 860px) {
          .stitch-wrap { padding: 0 20px; }
          .stitch-h1 { font-size: clamp(40px, 8vw, 64px) !important; line-height: 1.02 !important; }
          .stitch-h2 { font-size: clamp(32px, 6vw, 44px) !important; line-height: 1.05 !important; }
          .stitch-chk { grid-template-columns: 1fr; gap: 8px; padding: 24px 12px; }
          .stitch-chk b { font-size: 32px; }
          .rc-facts div { grid-template-columns: 1fr; gap: 4px; }
          .stitch-fq summary { font-size: 21px; }

          .grid-strip-proof {
            grid-template-columns: 1fr;
          }
          .grid-strip-proof > li {
            border-right: none;
            border-bottom: 1px solid #C9D3C2;
          }
          .grid-strip-proof > li:last-child {
            border-bottom: none;
          }

          .grid-strip-steps {
            grid-template-columns: 1fr;
          }
          .grid-strip-steps > li {
            border-right: none;
            border-bottom: 1px solid #C9D3C2;
          }
          .grid-strip-steps > li:last-child {
            border-bottom: none;
          }

          .stitch-main-nav {
            display: none !important;
          }
          .stitch-hamburger {
            display: flex;
          }
          .stitch-mobile-drawer.open {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 20px 0 10px;
            gap: 16px;
            border-top: 2px solid #0E1A14;
            margin-top: 16px;
          }
          .stitch-mobile-drawer a {
            font-size: 17px;
            font-weight: 600;
            padding: 6px 0;
          }
        }

        @media(max-width: 768px) {
          .hero-flex-wrap {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .hero-copy-col {
            max-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .hero-anim-col {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .lh-hd2 {
            padding: 10px 14px;
            font-size: 13px;
          }
          .lh-row {
            padding: 0 14px;
            font-size: 15px;
            height: 38px;
          }
          .lh-tot {
            padding: 0 14px;
            font-size: 15px;
            height: 42px;
          }
          .lh-stamp {
            right: 12px;
            bottom: -24px;
            padding: 6px 14px;
            transform: rotate(-6deg) scale(0.85);
            transform-origin: bottom right;
          }
          .lh-stamp b {
            font-size: 20px;
          }
          .lh-stamp span {
            font-size: 11px;
          }
          .lh-pz {
            margin-top: 36px;
          }
        }

        @media(max-width: 640px) {
          .stitch-h1 { font-size: clamp(38px, 10vw, 52px) !important; }
          .hero-btn-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .hero-btn-row .stitch-btn, .hero-btn-row a {
            text-align: center;
            justify-content: center;
          }
          .rc-ph {
            padding: 12px 14px;
            font-size: 13px;
          }
          .rc-ph b {
            font-size: 18px;
          }
          .rc-t td, .rc-t th {
            padding: 9px 12px;
            font-size: 14px;
          }
          .rc-cf {
            padding: 14px;
          }
          .rc-tabs {
            padding: 10px 12px;
            gap: 6px;
          }
          .rc-tabs span {
            padding: 6px 10px;
            font-size: 13px;
          }
          .stitch-btn {
            width: 100%;
          }
          header.stitch-wrap {
            gap: 16px !important;
            padding-top: 18px !important;
            padding-bottom: 18px !important;
          }
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .header-actions .stitch-btn {
            width: auto;
            flex: 1;
          }
        }

        /* === PROGRESSIVE ENHANCEMENT MOTION SYSTEM === */
        @supports (animation-timeline: scroll()) {
          .stitch-scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: #C8F135;
            z-index: 9999;
            width: 100%;
            transform-origin: left;
            animation: stitch-scroll-line linear;
            animation-timeline: scroll();
          }
          @keyframes stitch-scroll-line {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
        }

        /* Without .js everything is immediately visible */
        html.js [data-reveal]:not(.is-in) {
          opacity: 0;
          transform: translateY(20px);
        }
        html.js [data-reveal="left"]:not(.is-in) {
          opacity: 0;
          transform: translateX(-16px);
        }
        html.js [data-reveal="fade"]:not(.is-in) {
          opacity: 0;
          transform: none;
        }
        html.js [data-reveal="scale"]:not(.is-in) {
          opacity: 0;
          transform: scale(0.98);
        }

        /* Revealed State */
        .is-in {
          opacity: 1 !important;
          transform: none !important;
          transition: opacity 0.5s cubic-bezier(.2,.7,.2,1), transform 0.5s cubic-bezier(.2,.7,.2,1);
          transition-delay: calc(var(--i, 0) * 70ms);
        }

        /* Vaults Active Card Left-to-Right Highlight Sweep */
        .vault-sweep-card {
          position: relative;
          overflow: hidden;
        }
        .vault-sweep-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #C8F135;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(.2,.7,.2,1) 0.24s;
          z-index: 0;
          pointer-events: none;
        }
        .is-in.vault-sweep-card::before {
          transform: scaleX(1);
        }
        .vault-sweep-card > * {
          position: relative;
          z-index: 1;
        }

        /* Ask Section Conversational Delays & Underline Sweep */
        #ask [data-reveal] {
          transition-delay: calc(var(--i, 0) * 120ms);
        }
        .ask-underline {
          display: inline-block;
          position: relative;
        }
        .ask-underline::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 2px;
          background: #C8F135;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(.2,.7,.2,1) 0.6s;
        }
        .is-in .ask-underline::after,
        .is-in.ask-underline::after {
          transform: scaleX(1);
        }

        /* Records Section Sequence (~1.6s total) */
        html.js #records [data-reveal]:not(.is-in) .rc-p-journal {
          opacity: 0;
          transform: translateY(16px);
        }
        #records .is-in .rc-p-journal,
        #records [data-reveal].is-in .rc-p-journal,
        #records .is-in.rc-p-journal {
          opacity: 1 !important;
          transform: none !important;
          transition: opacity 0.4s cubic-bezier(.2,.7,.2,1), transform 0.4s cubic-bezier(.2,.7,.2,1);
        }
        html.js #records [data-reveal]:not(.is-in) .rc-cf {
          opacity: 0;
          transform: translateY(-10px);
        }
        #records .is-in .rc-cf,
        #records [data-reveal].is-in .rc-cf {
          opacity: 1 !important;
          transform: none !important;
          transition: opacity 0.35s cubic-bezier(.2,.7,.2,1) 0.4s, transform 0.35s cubic-bezier(.2,.7,.2,1) 0.4s;
        }
        html.js #records [data-reveal]:not(.is-in) .rc-mv {
          opacity: 0;
          transform: scaleY(0);
          transform-origin: top;
        }
        #records .is-in .rc-mv,
        #records [data-reveal].is-in .rc-mv {
          opacity: 1 !important;
          transform: scaleY(1) !important;
          transition: opacity 0.3s cubic-bezier(.2,.7,.2,1) 0.75s, transform 0.3s cubic-bezier(.2,.7,.2,1) 0.75s;
        }
        html.js #records [data-reveal]:not(.is-in) .rc-p-history {
          opacity: 0;
          transform: translateY(16px);
        }
        #records .is-in .rc-p-history,
        #records [data-reveal].is-in .rc-p-history,
        #records .is-in.rc-p-history {
          opacity: 1 !important;
          transform: none !important;
          transition: opacity 0.4s cubic-bezier(.2,.7,.2,1) 1.05s, transform 0.4s cubic-bezier(.2,.7,.2,1) 1.05s;
        }
        html.js #records [data-reveal]:not(.is-in) .rc-row-lime {
          opacity: 0;
          transform: translateX(-16px);
        }
        #records .is-in .rc-row-lime,
        #records [data-reveal].is-in .rc-row-lime {
          opacity: 1 !important;
          transform: none !important;
          transition: opacity 0.35s cubic-bezier(.2,.7,.2,1) 1.35s, transform 0.35s cubic-bezier(.2,.7,.2,1) 1.35s;
        }

        /* Getting Started Lime Step Pulse */
        .grid-strip-steps > li.step-pulse.is-in {
          animation: stitch-pulse 0.4s cubic-bezier(.2,.7,.2,1) 0.4s 1;
        }
        @keyframes stitch-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* FAQ Smooth Open Support */
        @supports (interpolate-size: allow-keywords) {
          :root { interpolate-size: allow-keywords; }
        }
        .stitch-fq::details-content {
          transition: height 0.25s ease, opacity 0.25s ease;
          height: 0;
          opacity: 0;
          overflow: clip;
        }
        .stitch-fq[open]::details-content {
          height: auto;
          opacity: 1;
        }
        .stitch-fq summary::after {
          transition: transform 0.2s ease, background-color 0.15s ease;
        }
        .stitch-fq[open] summary::after {
          transform: rotate(45deg);
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          html.js [data-reveal] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          .stitch-scroll-progress {
            display: none !important;
          }
          * {
            transition-duration: 0.001ms !important;
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
        }

      `}</style>

      {/* TOP NAVIGATION (CLEAN SPEC: LOGO + AUTH/PROFILE ONLY) */}
      <header className="stitch-wrap" style={{ paddingTop: '24px', paddingBottom: '8px' }}>
        <div className="stitch-header-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/final.png"
              alt="Smart Financial"
              className="sf-nav-logo-img"
            />
          </Link>

          {/* Right Action Buttons */}
          <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user ? (
              <>
                <Link to="/list" className="stitch-btn stitch-lime" style={{ minHeight: '44px', padding: '0 20px', fontSize: '15px' }}>
                  Dashboard
                </Link>
                <div
                  className={`stitch-user-menu ${isUserMenuOpen ? 'open' : ''}`}
                  onMouseEnter={() => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      setIsUserMenuOpen(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      setIsUserMenuOpen(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="stitch-user-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserMenuOpen((prev) => !prev);
                    }}
                    aria-expanded={isUserMenuOpen}
                    aria-label="Profile and account menu"
                    title="Profile"
                  >
                    <span className="stitch-user-avatar">{user.charAt(0).toUpperCase()}</span>
                    <span className="stitch-user-name">Profile</span>
                    <svg
                      className="stitch-chevron"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : undefined }}
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
                  <div className={`stitch-dropdown-panel ${isUserMenuOpen ? 'mobile-open desktop-open' : ''}`}>
                    <div className="stitch-dropdown-header">
                      <p className="stitch-dropdown-sub">Signed in as</p>
                      <p className="stitch-dropdown-user">{user}</p>
                    </div>
                    <Link to="/profile" className="stitch-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <span><b>Profile settings</b></span>
                      <span>→</span>
                    </Link>
                    <Link to="/list" className="stitch-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <span>Your Vaults</span>
                      <span>→</span>
                    </Link>
                    <Link to="/contact" className="stitch-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <span>Contact support</span>
                      <span>→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="stitch-dropdown-item logout"
                    >
                      <span>Log out</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={{ fontWeight: 600, padding: '0 12px', whiteSpace: 'nowrap' }}>
                  Log in
                </Link>
                <Link to="/register" className="stitch-btn stitch-lime" style={{ minHeight: '44px', padding: '0 20px', fontSize: '15px', whiteSpace: 'nowrap' }}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className={`stitch-wrap lh ${isPaused ? 'lh-paused' : ''}`} style={{ paddingTop: '48px', paddingBottom: '56px' }}>
        <div className="hero-flex-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '56px', alignItems: 'center' }}>
          {/* Left Column: Copy */}
          <div className="hero-copy-col" style={{ flex: '1 1 440px', maxWidth: '540px' }}>
            <h1 className="stitch-h1" data-reveal style={{ fontSize: '90px', '--i': 0 }}>A ledger that checks its own work.</h1>
            <p className="stitch-muted" data-reveal style={{ fontSize: '22px', marginTop: '28px', '--i': 1.3 }}>
              Every entry is kept in double-entry form, and the trial balance proves that debits equal credits before you rely on a single number.
            </p>
            <div className="hero-btn-row" data-reveal style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap', marginTop: '36px', '--i': 2.6 }}>
              <Link
                to={user ? "/list" : "/register"}
                className="stitch-btn stitch-lime"
                style={{ minHeight: '56px', fontSize: '18px', padding: '0 32px' }}
              >
                {user ? "Go to your vaults" : "Create your first vault"}
              </Link>
              <Link
                to={user ? "/list" : "/login"}
                style={{ fontWeight: 600, fontSize: '17px', borderBottom: '2px solid #0E1A14', display: 'inline-block', paddingBottom: '2px' }}
              >
                {user ? "Dashboard" : "Log in"}
              </Link>
            </div>
          </div>

          {/* Right Column: Animated Double-Entry Ledger Sheet */}
          <div className="hero-anim-col" style={{ flex: '1 1 540px', minWidth: 0, maxWidth: '100%' }}>
            <div
              className="lh-container"
              role="img"
              aria-label="Animation: a trial balance for nav shop is written line by line. Debits total 6,190.00 and credits total 6,190.00, then a Balanced stamp lands on the page."
            >
              <div className="lh-paper">
                <div style={{ padding: '16px 24px', borderBottom: '2px solid #0E1A14', background: '#fff', borderRadius: '4px 4px 0 0' }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '22px', letterSpacing: '-0.03em' }}>
                    Report · business · October
                  </p>
                </div>
                <div className="lh-cols">
                  <div className="lh-stem"></div>
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
                <div className="lh-cols" style={{ position: 'relative', borderTop: '2px solid #0E1A14', background: '#fff' }}>
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

            {/* Pause/Play Animation Controller */}
            <button
              type="button"
              className="lh-pz"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play animation" : "Pause animation"}
            >
              {isPaused ? "▶ Play animation" : "⏸ Pause animation"}
            </button>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="stitch-wrap" style={{ paddingBottom: '80px' }}>
        <ol className="grid-strip-proof" data-reveal>
          <li data-reveal style={{ '--i': 0 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>1</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 6px' }}>Debits always equal credits</h3>
            <p className="stitch-muted" style={{ fontSize: '16px' }}>Unbalanced entries are rejected before they reach the database.</p>
          </li>
          <li data-reveal style={{ '--i': 1 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>2</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 6px' }}>Four reports, no spreadsheet</h3>
            <p className="stitch-muted" style={{ fontSize: '16px' }}>Ledger, trial balance, income statement and balance sheet automatically prepared.</p>
          </li>
          <li data-reveal style={{ background: '#C8F135', '--i': 2 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', letterSpacing: '-0.04em' }}>3</b>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 6px' }}>An assistant that only reads</h3>
            <p style={{ fontSize: '16px' }}>Ask in plain words. It queries the audit log and never modifies or deletes data.</p>
          </li>
        </ol>
      </section>

      {/* VAULTS SECTION */}
      <section className="stitch-rule" id="vaults" style={{ background: '#fff', padding: '96px 0 80px' }}>
        <div className="stitch-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px' }}>
          <div data-reveal style={{ flex: '1 1 380px' }}>
            <p className="stitch-eyebrow stitch-muted">Vaults</p>
            <h2 className="stitch-h2" style={{ fontSize: '60px', margin: '16px 0 24px' }}>One login. A separate vault for <span style={{ background: "#C8F135", padding: "2px 14px 6px", borderRadius: "6px", display: "inline-block", verticalAlign: "middle", lineHeight: 1.05, color: "#0E1A14" }}>every business.</span></h2>
            <p className="stitch-muted" style={{ fontSize: '19px', maxWidth: '440px' }}>
              Create as many businesses as you run. Pick a vault and every account, transaction and report you open belongs to that business only.
            </p>
          </div>
          <div style={{ flex: '1 1 460px', alignSelf: 'center', width: '100%', minWidth: 0 }}>
            <div data-reveal="left" className="vault-sweep-card" style={{ border: '2px solid #0E1A14', borderRadius: '6px', padding: '24px', background: '#C8F135', boxShadow: '4px 4px 0px #0E1A14', '--i': 0 }}>
              <p className="stitch-eyebrow">Selected vault</p>
              <h3 style={{ fontSize: '36px', marginTop: '8px' }}>Corner Shop</h3>
              <p style={{ marginTop: '8px', fontWeight: 500 }}>Cash · Accounts Receivable · Utilities Expense</p>
            </div>
            <div data-reveal="left" style={{ border: '2px solid #0E1A14', borderTop: 0, padding: '24px', background: '#FAFCF8', '--i': 1 }}>
              <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Design Studio</h3>
              <p className="stitch-muted" style={{ marginTop: '6px' }}>Bank Account 1 · Accounts Receivable · Software Expense</p>
            </div>
            <div data-reveal="left" style={{ border: '2px solid #0E1A14', borderTop: 0, borderRadius: '0 0 6px 6px', padding: '24px', background: '#FAFCF8', '--i': 2 }}>
              <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Household</h3>
              <p className="stitch-muted" style={{ marginTop: '6px' }}>Cash · Rent Expense · Savings</p>
            </div>
          </div>
        </div>
      </section>

      {/* REPORTS SECTION */}
      <section className="stitch-wrap" id="reports" style={{ padding: '110px 32px 90px' }}>
        <div data-reveal><p className="stitch-eyebrow stitch-muted">Four statements, generated for you</p>
          <h2 className="stitch-h2" style={{ fontSize: '64px', margin: '16px 0 48px', maxWidth: '820px' }}>
            The maths is done. You just read the result.
          </h2></div>
        <div style={{ borderBottom: '1px solid #C9D3C2' }}>
          <Link to={user ? "/ledger-balancing" : "/login"} className="stitch-chk" data-reveal style={{ '--i': 0 }}>
            <b>01</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Ledger</h3>
            <p className="stitch-muted">Every account with its debit total, credit total and the balance left over.</p>
            <p style={{ fontWeight: 600 }}>Cash: 500.00 − 200.00 = 300.00 debit</p>
          </Link>
          <Link to={user ? "/trial-balance" : "/login"} className="stitch-chk" data-reveal style={{ '--i': 1 }}>
            <b>02</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Trial balance</h3>
            <p className="stitch-muted">All account balances in a single list, proving the books agree with themselves.</p>
            <p style={{ fontWeight: 600 }}>Total debits = total credits</p>
          </Link>
          <Link to={user ? "/income-report" : "/login"} className="stitch-chk" data-reveal style={{ '--i': 2 }}>
            <b>03</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Income statement</h3>
            <p className="stitch-muted">Revenue less cost of goods sold gives gross profit. Operating expenses take you to net income.</p>
            <p style={{ fontWeight: 600 }}>Revenue − COGS − OPEX = net income</p>
          </Link>
          <Link to={user ? "/balance-sheet" : "/login"} className="stitch-chk" data-reveal style={{ '--i': 3 }}>
            <b>04</b>
            <h3 style={{ fontSize: '30px', fontWeight: 700 }}>Balance sheet</h3>
            <p className="stitch-muted">What you own, what you owe and what is left for the owners, at a glance.</p>
            <p style={{ fontWeight: 600 }}>Assets = liabilities + equity</p>
          </Link>
        </div>
        <p className="stitch-muted" data-reveal style={{ marginTop: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', '--i': 4 }}>
          <svg fill="none" height="18" stroke="#0E1A14" strokeLinecap="round" strokeWidth="2" style={{ flexShrink: 0 }} viewBox="0 0 24 24" width="18">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" x2="8" y1="13" y2="13"></line>
            <line x1="16" x2="8" y1="17" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Every report exports as a formatted PDF ready for tax filing and audits.</span>
        </p>
      </section>

      {/* ASK SECTION */}
      <section id="ask" style={{ background: '#0E1A14', color: '#F2F5EE', padding: '100px 0' }}>
        <div className="stitch-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px' }}>
          <div data-reveal style={{ flex: '1 1 380px' }}>
            <p className="stitch-eyebrow" style={{ color: '#C8F135' }}>Ask your books</p>
            <h2 className="stitch-h2" style={{ fontSize: '60px', margin: '16px 0 24px', color: '#F2F5EE' }}><span className="ask-underline">Skip the filters. Just ask.</span></h2>
            <p style={{ color: '#B9C6BD', fontSize: '19px', maxWidth: '440px' }}>
              The assistant works out what you mean, including relative dates like "last week", and queries your ledger securely. It can only read your data—it cannot alter accounts or post entries.
            </p>
            <p style={{ color: '#B9C6BD', fontSize: '19px', maxWidth: '440px', marginTop: '16px' }}>
              Questions that are not about your financial records receive helpful guides instead of database queries.
            </p>
          </div>
          <div style={{ flex: '1 1 460px' }}>
            <div data-reveal style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', '--i': 0 }}>
              <p className="stitch-eyebrow" style={{ color: '#8FA196' }}>You asked</p>
              <p style={{ fontSize: '26px', marginTop: '8px' }}>"Show me total income for this month."</p>
            </div>
            <div data-reveal style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', '--i': 1 }}>
              <p className="stitch-eyebrow" style={{ color: '#C8F135' }}>Smart Financial</p>
              <p style={{ fontSize: '26px', marginTop: '8px', fontWeight: 600 }}>Total income this month is $5,000.00.</p>
            </div>
            <div data-reveal style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', '--i': 2 }}>
              <p className="stitch-eyebrow" style={{ color: '#8FA196' }}>You asked</p>
              <p style={{ fontSize: '26px', marginTop: '8px' }}>"Did we buy office supplies last week?"</p>
            </div>
            <div data-reveal style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', '--i': 3 }}>
              <p className="stitch-eyebrow" style={{ color: '#C8F135' }}>Smart Financial</p>
              <p style={{ fontSize: '26px', marginTop: '8px', fontWeight: 600 }}>Found 2 entries: $120.00 on Thursday and $45.00 on Saturday.</p>
            </div>
            <div data-reveal style={{ borderTop: '1px solid #2C3F34', padding: '24px 0', borderBottom: '1px solid #2C3F34', '--i': 4 }}>
              <p className="stitch-eyebrow" style={{ color: '#8FA196' }}>Unmatched prompt</p>
              <p style={{ fontSize: '20px', marginTop: '8px', color: '#B9C6BD' }}>
                Unclear prompts will never guess or create phantom records. You get clear suggestions of valid queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECORDS SECTION */}
      <section className="stitch-rule" id="records" style={{ background: '#fff', padding: '100px 0' }}>
        <div className="stitch-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          <div data-reveal style={{ flex: '1 1 400px', maxWidth: '500px' }}>
            <p className="stitch-eyebrow stitch-muted">Your records</p>
            <h2 className="stitch-h2" style={{ fontSize: '60px', margin: '16px 0 24px' }}>Delete a mistake. Keep the record.</h2>
            <p className="stitch-muted" style={{ fontSize: '20px' }}>
              Deleting in Smart Financial hides an item from active view while archiving it permanently for audit compliance. Your ledger totals update instantly while the trail remains intact.
            </p>
            <dl className="rc-facts">
              <div>
                <dt>Hidden, not erased</dt>
                <dd>Deleted records leave active views but stay preserved in your immutable history log.</dd>
              </div>
              <div>
                <dt>Balances follow</dt>
                <dd>Delete a transaction and every ledger it touched recalculates immediately.</dd>
              </div>
              <div>
                <dt>One vault at a time</dt>
                <dd>Each record is strictly isolated to its own company vault without data leakage.</dd>
              </div>
            </dl>
          </div>
          <figure data-reveal="records-seq" aria-label="Illustration: deleting transaction 41 in the General Journal asks for confirmation, then the transaction appears in the Deleted records history." role="img" style={{ flex: '1 1 520px', margin: 0, minWidth: 0, width: '100%' }}>
            <div className="rc-p rc-p-journal">
              <div className="rc-ph">
                <b>General Journal</b>
                <span>Transaction #41 · 6 Oct 2026</span>
              </div>
              <div className="rc-table-wrapper">
                <table className="rc-t">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="n">Debit</th>
                      <th className="n">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Office Rent Expense</td>
                      <td className="n">800.00</td>
                      <td className="n"></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '44px' }}>Cash in Hand</td>
                      <td className="n"></td>
                      <td className="n">800.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="rc-cf">
                <p style={{ fontWeight: 700, fontSize: '18px' }}>Delete transaction #41?</p>
                <p style={{ marginTop: '4px', fontSize: '15px' }}>It is hidden, not erased. Cash in Hand and Office Rent Expense are recalculated straight away.</p>
                <p style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <span className="rc-btn">Yes, delete it</span>
                  <span className="rc-link" style={{ marginLeft: '6px' }}>Cancel</span>
                </p>
              </div>
            </div>
            <div className="rc-mv">Kept in your history</div>
            <div className="rc-p rc-p-history">
              <div className="rc-ph">
                <b>Deleted records history</b>
                <span>Read-only</span>
              </div>
              <div className="rc-tabs">
                <span>Businesses<i>2</i></span>
                <span>Accounts<i>4</i></span>
                <span className="on">Transactions<i>8</i></span>
              </div>
              <div className="rc-table-wrapper">
                <table className="rc-t">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Business</th>
                      <th className="n">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rc-row-lime" style={{ background: '#C8F135' }}>
                      <td>2026-10-06</td>
                      <td>Shop rent</td>
                      <td>nav shop</td>
                      <td className="n">800.00</td>
                    </tr>
                    <tr>
                      <td>2026-10-02</td>
                      <td>Chai expense</td>
                      <td>nav shop</td>
                      <td className="n">20.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </figure>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className="stitch-wrap" style={{ padding: '110px 32px' }}>
        <div data-reveal><p className="stitch-eyebrow stitch-muted">Getting started</p>
          <h2 className="stitch-h2" style={{ fontSize: '64px', margin: '16px 0 48px' }}>Five steps to your first balanced entry.</h2></div>
        <ol className="grid-strip-steps" data-reveal>
          <li data-reveal style={{ '--i': 0 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>1</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Register</h3>
            <p className="stitch-muted">Sign up using Email or your Google account.</p>
          </li>
          <li data-reveal style={{ '--i': 1 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>2</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Verify</h3>
            <p className="stitch-muted">Confirm your email address with a 6-digit code.</p>
          </li>
          <li data-reveal style={{ '--i': 2 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>3</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Create vault</h3>
            <p className="stitch-muted">One vault per business or personal budget.</p>
          </li>
          <li data-reveal style={{ '--i': 3 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>4</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Add accounts</h3>
            <p className="stitch-muted">Set up Cash, sales, utilities and receivables.</p>
          </li>
          <li data-reveal className="step-pulse" style={{ background: '#C8F135', '--i': 4 }}>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '44px', letterSpacing: '-0.04em' }}>5</b>
            <h3 style={{ fontSize: '24px', margin: '12px 0 6px', fontWeight: 700 }}>Record</h3>
            <p>Post transactions and let reports balance themselves.</p>
          </li>
        </ol>
      </section>

      {/* BUILT FOR / WHO IT IS FOR */}
      <section className="stitch-wrap" style={{ padding: '0 32px 100px' }}>
        <div data-reveal><p className="stitch-eyebrow stitch-muted">Who it is for</p>
          <h2 style={{ fontSize: '48px', margin: '14px 0 36px', maxWidth: '720px' }}>Rigorous enough for accountants. Simple enough for everyone else.</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          <div data-reveal style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px', '--i': 0 }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Small business owners</h3>
            <p className="stitch-muted" style={{ marginTop: '10px', fontSize: '18px' }}>Keep proper books and audit-ready records without learning accounting jargon first.</p>
          </div>
          <div data-reveal style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px', '--i': 1 }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Freelance accountants</h3>
            <p className="stitch-muted" style={{ marginTop: '10px', fontSize: '18px' }}>Give each client their own clean vault and switch between them seamlessly in one click.</p>
          </div>
          <div data-reveal style={{ borderTop: '2px solid #0E1A14', paddingTop: '18px', '--i': 2 }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700 }}>Individuals</h3>
            <p className="stitch-muted" style={{ marginTop: '10px', fontSize: '18px' }}>Track personal finances, household budgets, and savings with professional precision.</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="stitch-rule" id="faq" style={{ padding: '100px 0', background: '#FAFCF8' }}>
        <div className="stitch-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'flex-start' }}>
          <div data-reveal style={{ flex: '1 1 300px', maxWidth: '380px' }}>
            <p className="stitch-eyebrow stitch-muted">Questions</p>
            <h2 className="stitch-h2" style={{ fontSize: '56px', margin: '16px 0 20px' }}>Before you start.</h2>
            <p className="stitch-muted" style={{ fontSize: '19px' }}>Straight answers to what people ask first.</p>
          </div>
          <div style={{ flex: '2 1 560px' }}>
            <details className="stitch-fq" data-reveal style={{ '--i': 0 }} open>
              <summary>Can I run more than one business?</summary>
              <p>Yes. You log in once and create a vault for each business. Each vault has its own accounts, transactions and reports, so nothing from one business shows up in another.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 0.7 }}>
              <summary>Do I need to know accounting?</summary>
              <p>It helps, but you can start without it. Smart Financial suggests standard ledger names for each ledger type, warns you when an opening balance looks unusual, and will not save an entry whose debits and credits differ.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 1.4 }}>
              <summary>What happens to an opening balance?</summary>
              <p>If a ledger starts with a balance, the other side is posted automatically to a ledger called Opening Balance Equity. Your books stay balanced from the first entry.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 2.0999999999999996 }}>
              <summary>Can I get my reports out?</summary>
              <p>The General Journal, Income Statement and Balance Sheet export as PDF files, with your business name and the period printed on them.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 2.8 }}>
              <summary>What if I delete something by mistake?</summary>
              <p>Nothing is lost. Deleted businesses, ledgers and transactions are hidden from your lists and kept in the deleted records history on your profile.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 3.5 }}>
              <summary>How do I sign in?</summary>
              <p>With your email and password, or with your Google account. New email accounts are confirmed with a 6-digit code sent to your inbox.</p>
            </details>
            <details className="stitch-fq" data-reveal style={{ '--i': 4.199999999999999 }}>
              <summary>What is the difference between Free and Premium?</summary>
              <p>Free needs a business name and a type. Premium also lets you add industry, NTN, address, city, country and phone to the business profile.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION (LIME BANNER) */}
      <section style={{ background: '#C8F135', borderTop: '2px solid #0E1A14', padding: '100px 0' }}>
        <div className="stitch-wrap">
          <h2 className="stitch-h1" data-reveal style={{ fontSize: '96px', maxWidth: '1000px', '--i': 0 }}>Open your first vault.</h2>
          <p data-reveal style={{ fontSize: '24px', marginTop: '24px', maxWidth: '580px', fontWeight: 500, '--i': 1 }}>
            Rigorous bookkeeping, without needing an economics degree.
          </p>
          <div data-reveal style={{ display: 'flex', gap: '14px', marginTop: '40px', flexWrap: 'wrap', '--i': 2 }}>
            <Link
              to={user ? "/list" : "/register"}
              className="stitch-btn stitch-ink text-white"
              style={{ minHeight: '56px', padding: '0 32px' }}
            >
              {user ? "Go to your vaults" : "Create account"}
            </Link>
            <Link
              to={user ? "/list" : "/login"}
              className="stitch-btn stitch-line"
              style={{ minHeight: '56px', padding: '0 32px' }}
            >
              {user ? "View Dashboard" : "Sign in / Continue"}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0E1A14', color: '#F2F5EE', padding: '72px 0 40px' }}>
        <div className="stitch-wrap">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/final.png"
                  alt="Smart Financial"
                  className="sf-footer-logo-img"
                />
              </div>
              <p style={{ color: '#B9C6BD', marginTop: '12px', maxWidth: '320px', fontSize: '16px' }}>
                Double-entry accounting with an assistant that reads your books.
              </p>
            </div>
            <div>
              <span className="stitch-ftl">Product</span>
              <p><a href="#vaults" style={{ display: 'block', marginBottom: '8px' }}>Vaults</a></p>
              <p><a href="#reports" style={{ display: 'block', marginBottom: '8px' }}>Reports</a></p>
              <p><a href="#ask" style={{ display: 'block' }}>Assistant</a></p>
            </div>
            <div>
              <span className="stitch-ftl">Account</span>
              <p><Link to={user ? "/list" : "/login"} style={{ display: 'block', marginBottom: '8px' }}>{user ? "Dashboard" : "Log in"}</Link></p>
              <p><Link to={user ? "/list" : "/register"} style={{ display: 'block', marginBottom: '8px' }}>{user ? "Your Vaults" : "Create account"}</Link></p>
              <p><Link to="/forgot-password" style={{ display: 'block' }}>Forgot password</Link></p>
            </div>
            <div>
              <span className="stitch-ftl">Learn</span>
              <p><a href="#records" style={{ display: 'block', marginBottom: '8px' }}>Your records</a></p>
              <p><a href="#faq" style={{ display: 'block', marginBottom: '8px' }}>Questions</a></p>
              <p><Link to="/contact" style={{ display: 'block' }}>Help Center</Link></p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '56px', borderTop: '1px solid #2C3F34', paddingTop: '24px' }}>
            <p style={{ color: '#8FA196', fontSize: '14px' }}>© 2026 Smart Financial · developed by Usama Nadeem</p>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#8FA196' }}>
              <Link to="/contact">Privacy Policy</Link>
              <Link to="/contact">Terms of Service</Link>
              <Link to="/contact">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
