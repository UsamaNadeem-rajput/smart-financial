import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import { Building2 } from 'lucide-react';
import axios from 'axios';

const List = () => {
  const navigate = useNavigate();
  const { businesses, setBusinesses, selectBusiness, selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [inspectedBusinessId, setInspectedBusinessId] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true });
      setUser(res.data);
      fetchBusinesses(); // ✅ Only fetch if session is valid
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login', { replace: true }); // 🔐 Redirect to login if session expired
    }
  };

  const fetchBusinesses = async () => {
    try {
      // Fetch businesses from backend API
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/showbusinesses`, {
        withCredentials: true
      });

      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = async (business) => {
    selectBusiness(business);
    navigate('/showbusinessaccount');
  };

  const handleDeleteBusiness = async (businessId) => {
    if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/business/${businessId}`, {
          withCredentials: true
        });
        setBusinesses(prev => prev.filter(b => b.business_id !== businessId));
        if (selectedBusiness?.business_id === businessId) {
          selectBusiness(null);
        }
        alert('Business deleted successfully.');
      } catch (error) {
        console.error('Failed to delete business:', error);
        alert('Failed to delete business. Please try again.');
      }
    }
  };

  const formatBusinessType = (type) => {
    const types = {
      'sole': 'Sole Proprietorship',
      'partnership': 'Partnership',
      'company': 'Company'
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Currently inspected business in split-panel
  const currentBiz =
    businesses.find(b => b.business_id === inspectedBusinessId) ||
    businesses.find(b => b.business_id === selectedBusiness?.business_id) ||
    businesses[0] ||
    null;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F5EE' }}>
        <Navbar />
        <div className="sf-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ink"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F5EE',
        color: '#0E1A14',
        fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif",
        fontVariantNumeric: 'tabular-nums',
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      <Navbar />

      <main className="sf-wrap" style={{ paddingTop: '56px', paddingBottom: '80px' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1
              style={{
                fontSize: 'clamp(46px, 6vw, 84px)',
                fontWeight: 800,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-0.04em',
                lineHeight: 0.98
              }}
            >
              Your businesses.
            </h1>
            <p style={{ color: '#44544B', fontSize: '21px', marginTop: '18px', maxWidth: '640px', lineHeight: 1.55 }}>
              One login, separate books for each. Pick a business and everything you open next is limited to it.
            </p>
          </div>
          <div>
            <Link to="/business" className="sf-btn sf-btn-lime">
              + New business
            </Link>
          </div>
        </div>

        {businesses.length === 0 ? (
          /* Empty State */
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#fff',
              border: '2px solid #0E1A14',
              borderRadius: '6px',
              maxWidth: '600px',
              margin: '48px auto',
              boxShadow: '4px 4px 0 #0E1A14'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#0E1A14',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <Building2 className="w-8 h-8 text-brand-lime" />
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              No businesses yet
            </h3>
            <p style={{ color: '#44544B', fontSize: '18px', marginBottom: '24px' }}>
              Create your first business to get started with accounting
            </p>
            <Link to="/business" className="sf-btn sf-btn-lime">
              + Create Business
            </Link>
          </div>
        ) : (
          /* Business List + Detail Panel Split */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start', marginTop: '48px' }}>
            {/* Left Column: Business Selection List */}
            <div className="sf-biz-list">
              <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px' }}>
                {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} in this account
              </p>

              <div role="listbox" aria-label="Businesses List">
                {businesses.map((b) => {
                  const isCurrent = currentBiz?.business_id === b.business_id;
                  const isActiveBiz = selectedBusiness?.business_id === b.business_id;

                  return (
                    <div
                      key={b.business_id}
                      role="option"
                      aria-selected={isCurrent}
                      tabIndex={0}
                      onClick={() => setInspectedBusinessId(b.business_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setInspectedBusinessId(b.business_id);
                        }
                      }}
                      className={`sf-biz-rw ${isCurrent ? 'active' : ''}`}
                    >
                      <div>
                        <b>{b.business_name}</b>
                        <i>
                          {formatBusinessType(b.business_type)} · {b.plan === 'premium' ? 'Premium' : 'Free'}
                          {isActiveBiz ? ' · Active' : ''}
                        </i>
                      </div>
                      <em>{formatDate(b.created_at)}</em>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Business Inspection Panel */}
            {currentBiz && (
              <div className="sf-biz-panel" aria-live="polite">
                <span className={`sf-bd ${selectedBusiness?.business_id === currentBiz.business_id ? 'sf-bd-on' : ''}`}>
                  {selectedBusiness?.business_id === currentBiz.business_id ? 'Currently active' : 'Not active'}
                </span>

                <h2 className="sf-nm">{currentBiz.business_name}</h2>

                <dl className="sf-meta">
                  <div>
                    <dt>Type</dt>
                    <i />
                    <dd>{formatBusinessType(currentBiz.business_type)}</dd>
                  </div>
                  <div>
                    <dt>Plan</dt>
                    <i />
                    <dd style={{ textTransform: 'capitalize' }}>{currentBiz.plan || 'Free'}</dd>
                  </div>
                  {currentBiz.industry && (
                    <div>
                      <dt>Industry</dt>
                      <i />
                      <dd>{currentBiz.industry}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Created</dt>
                    <i />
                    <dd>{formatDate(currentBiz.created_at)}</dd>
                  </div>
                </dl>

                <p className="sf-sc">
                  Continue, and these pages will show only <b>{currentBiz.business_name}</b>'s records:
                </p>

                <ul className="sf-scope">
                  <li>Chart of accounts</li>
                  <li>Daily transactions</li>
                  <li>Ledger</li>
                  <li>Trial balance</li>
                  <li>Balance sheet</li>
                </ul>

                <div className="sf-acts">
                  <button
                    type="button"
                    onClick={() => handleSelectBusiness(currentBiz)}
                    className="sf-btn sf-btn-lime"
                  >
                    {selectedBusiness?.business_id === currentBiz.business_id
                      ? `Continue in ${currentBiz.business_name} →`
                      : `Select & Continue →`}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/business', { state: { business: currentBiz } })}
                    className="sf-lk"
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBusiness(currentBiz.business_id)}
                    className="sf-lk"
                    style={{ color: '#dc2626', borderColor: '#dc2626' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default List;