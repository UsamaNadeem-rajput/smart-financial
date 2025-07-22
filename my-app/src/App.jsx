import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import BusinessForm from './components/business/BusinessForm';
import List from './components/business/List';
import CreateNewAccount from './components/accounts/CreateNewAccount';
import EditAccount from './components/accounts/EditAccount';
import ShowBusinessAccount from './components/accounts/ShowBusinessAccount';
import TransactionForm from './components/transactions/TransactionForm';
import ShowTransactions from './components/transactions/ShowTransactions';
import PrivateRoute from './components/contexts/PrivateRoute';
import { BusinessProvider } from './context/BusinessContext';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <BusinessProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />

            {/* Protected Routes */}
            <Route path="/business" element={<PrivateRoute><BusinessForm /></PrivateRoute>} />
            <Route path="/list" element={<PrivateRoute><List /></PrivateRoute>} />
            <Route path="/creatnewaccount" element={<PrivateRoute><CreateNewAccount /></PrivateRoute>} />
            <Route path="/editaccount" element={<PrivateRoute><EditAccount /></PrivateRoute>} />
            <Route path="/showbusinessaccount" element={<PrivateRoute><ShowBusinessAccount /></PrivateRoute>} />
            <Route path="/transectionForm" element={<PrivateRoute><TransactionForm /></PrivateRoute>} />
            <Route path="/showtransections" element={<PrivateRoute><ShowTransactions /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
    </BusinessProvider>
  );
}

export default App;
