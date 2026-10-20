import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/contexts/PrivateRoute';
import { BusinessProvider } from './context/BusinessContext';
import FloatingChatbot from './components/chat/FloatingChatbot';
import PageLoader from './components/common/PageLoader';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// 1. Direct Static Imports: Home, Auth & Public Pages (Zero Lazy Loading, Instant 0ms Load)
import LandingPage from './components/landing/LandingPage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import VerifyPage from './components/auth/VerifyPage';
import ForgotPassword from './components/auth/ForgotPassword';

// 2. Protected Lazy-Loaded Pages (Loaded only when user enters dashboard & workspace)
const Profile = lazy(() => import('./components/profile/Profile'));
const BusinessForm = lazy(() => import('./components/business/BusinessForm'));
const List = lazy(() => import('./components/business/List'));
const CreateNewAccount = lazy(() => import('./components/accounts/CreateNewAccount'));
const EditAccount = lazy(() => import('./components/accounts/EditAccount'));
const ShowBusinessAccount = lazy(() => import('./components/accounts/ShowBusinessAccount'));
const TransactionForm = lazy(() => import('./components/transactions/TransactionForm'));
const ShowTransactions = lazy(() => import('./components/transactions/ShowTransactions'));
const ContactForm = lazy(() => import('./components/conatct_us/ContactForm'));
const LedgerBalancing = lazy(() => import('./components/reports/LedgerBalancing'));
const IncomeReport = lazy(() => import('./components/reports/IncomeReport'));
const TrialBalance = lazy(() => import('./components/reports/TrialBalance'));
const BalanceSheet = lazy(() => import('./components/reports/BalanceSheet'));
const TransactionEdit = lazy(() => import('./components/transactions/TransactionEdit'));

// Background Idle Preload: Silently preloads dashboard & reports in idle time so clicking between pages is instant
export const preloadInternalPages = () => {
  if (typeof window === 'undefined') return;
  const loadChunks = () => {
    import('./components/business/List');
    import('./components/reports/LedgerBalancing');
    import('./components/reports/TrialBalance');
    import('./components/reports/IncomeReport');
    import('./components/reports/BalanceSheet');
    import('./components/transactions/ShowTransactions');
    import('./components/profile/Profile');
    import('./components/accounts/ShowBusinessAccount');
    import('./components/transactions/TransactionForm');
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadChunks, { timeout: 2500 });
  } else {
    setTimeout(loadChunks, 800);
  }
};

function App() {
  useEffect(() => {
    // If user is already logged in, start silent background preload so dashboard navigation has zero loading
    try {
      const isAuth = Boolean(localStorage.getItem('username') || localStorage.getItem('user'));
      if (isAuth) {
        preloadInternalPages();
      }
    } catch {
      // Storage unavailable or blocked
    }
  }, []);

  return (
    <BusinessProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Eagerly Loaded Public & Auth Pages (Zero Loading, Instant) */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<SignupForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes (Preloaded in background for smooth, seamless experience) */}
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/business" element={<PrivateRoute><BusinessForm /></PrivateRoute>} />
              <Route path="/list" element={<PrivateRoute><List /></PrivateRoute>} />
              <Route path="/creatnewaccount" element={<PrivateRoute><CreateNewAccount /></PrivateRoute>} />
              <Route path="/editaccount" element={<PrivateRoute><EditAccount /></PrivateRoute>} />
              <Route path="/showbusinessaccount" element={<PrivateRoute><ShowBusinessAccount /></PrivateRoute>} />
              <Route path="/transectionForm" element={<PrivateRoute><TransactionForm /></PrivateRoute>} />
              <Route path="/showtransections" element={<PrivateRoute><ShowTransactions /></PrivateRoute>} />
              <Route path="/contact" element={<PrivateRoute><ContactForm /></PrivateRoute>} />
              <Route path="/ledger-balancing" element={<PrivateRoute><LedgerBalancing /></PrivateRoute>} />
              <Route path="/income-report" element={<PrivateRoute><IncomeReport /></PrivateRoute>} />
              <Route path="/trial-balance" element={<PrivateRoute><TrialBalance /></PrivateRoute>} />
              <Route path="/balance-sheet" element={<PrivateRoute><BalanceSheet /></PrivateRoute>} />
              <Route path="/transaction-edit/:transactionId" element={<PrivateRoute><TransactionEdit /></PrivateRoute>} />

            </Routes>
          </Suspense>
          <FloatingChatbot />
        </div>
      </Router>
    </BusinessProvider>
  );
}

export default App;
