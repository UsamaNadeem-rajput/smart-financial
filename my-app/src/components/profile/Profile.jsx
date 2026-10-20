import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import { History, Lock, Info, X, Building2, Wallet, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('businesses');
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/profile`, { withCredentials: true });
      setProfile(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await axios.get(`${apiUrl}/api/history`, { withCredentials: true });
      setHistory(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      setError('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showHistoryModal) {
        setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistoryModal]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="sf-profile-page">
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="sf-loader-box">
            <span className="sf-sp"></span>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="sf-profile-page">
        <Navbar />
        <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 20px' }}>
          <div className="sf-al err" role="alert">
            {error}
          </div>
          <button
            type="button"
            className="sf-btn lime"
            style={{ width: 'auto', marginTop: '12px' }}
            onClick={fetchProfile}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile?.full_name);
  const accountId = profile?.id ? `SF-${String(profile.id).padStart(6, '0')}-US` : 'SF-883920-US';

  const deletedBusinessesCount = history?.businesses?.length || 0;
  const deletedAccountsCount = history?.accounts?.length || 0;
  const deletedTransactionsCount = history?.transactions?.length || 0;

  return (
    <div className="sf-profile-page">
      <Navbar />

      {/* Main Profile Container */}
      <main className="sf-main-container">
        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: '38px' }}>
          <h1 className="sf-headline-hero">
            My profile<span style={{ color: '#C8F135' }}>.</span>
          </h1>
          <p className="sf-body-lg">
            Your personal details, and a record of everything you have deleted.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="sf-card">
          {/* Card Header with Big Avatar */}
          <div className="sf-card-header">
            <div className="sf-avatar" aria-hidden="true">
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 className="sf-user-name">{profile?.full_name || 'User'}</h2>
                <span className="sf-badge-owner">Owner</span>
              </div>
              <p className="sf-user-email">{profile?.email || '—'}</p>
              <p className="sf-account-id">
                Account ID: <span>{accountId}</span>
              </p>
            </div>
          </div>

          {/* Key-Value Detail Rows with Dotted Leaders */}
          <div className="sf-details-list">
            {/* Name */}
            <div className="sf-detail-row">
              <span className="sf-detail-label">Name</span>
              <div className="sf-leader-line"></div>
              <span className="sf-detail-val font-bold">{profile?.full_name || '—'}</span>
            </div>

            {/* Username */}
            <div className="sf-detail-row">
              <span className="sf-detail-label">Username</span>
              <div className="sf-leader-line"></div>
              <span className="sf-detail-val font-mono">@{profile?.username || '—'}</span>
            </div>

            {/* Email account */}
            <div className="sf-detail-row">
              <span className="sf-detail-label">Email account</span>
              <div className="sf-leader-line"></div>
              <span className="sf-detail-val font-bold">{profile?.email || '—'}</span>
            </div>

            {/* Login method */}
            <div className="sf-detail-row">
              <span className="sf-detail-label">Login method</span>
              <div className="sf-leader-line"></div>
              <span className="sf-detail-val font-bold">
                {profile?.provider === 'google' ? 'Google authentication' : 'Email and password'}
              </span>
            </div>
          </div>

          {/* Action Rows Partition Line */}
          <div className="sf-actions-partition">
            {/* Action Row 1: Activity history */}
            <div className="sf-action-box highlight">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={19} color="#0E1A14" />
                  <h3 className="sf-action-title">Activity history</h3>
                </div>
                <p className="sf-action-desc">
                  Everything you have deleted: businesses, ledgers and transactions.
                </p>
              </div>
              <button
                type="button"
                className="sf-btn lime sf-btn-sm"
                onClick={fetchHistory}
                disabled={historyLoading}
              >
                {historyLoading ? (
                  <>
                    <span className="sf-sp"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    View history <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Action Row 2: Account security */}
            <div className="sf-action-box">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={19} color="#0E1A14" />
                  <h3 className="sf-action-title">Account security</h3>
                </div>
                <p className="sf-action-desc">
                  Forgot your password, or want a new one?
                </p>
              </div>
              <button
                type="button"
                className="sf-btn sf-out sf-btn-sm"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        {/* Notice Banner Below Card */}
        <div className="sf-notice-banner">
          <Info size={24} style={{ flexShrink: 0, marginTop: '2px' }} color="#0E1A14" />
          <p>
            Nothing you delete is erased. It is hidden from your lists and kept here, so no
            financial record is ever lost by mistake.
          </p>
        </div>
      </main>

      {/* Interactive Modal Dialog: Deleted records history */}
      {showHistoryModal && (
        <div
          className="sf-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHistoryModal(false);
          }}
        >
          <div className="sf-modal-box">
            {/* Modal Header */}
            <div className="sf-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="sf-modal-icon-badge">
                  <History size={16} color="#C8F135" />
                </div>
                <h2 id="history-modal-title" className="sf-modal-title">
                  Deleted records history
                </h2>
              </div>
              <button
                type="button"
                className="sf-modal-close"
                onClick={() => setShowHistoryModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Left Tabs + Right Tab Content */}
            <div className="sf-modal-body">
              {/* Left Tabs Navigation */}
              <div className="sf-modal-tabs">
                {/* Tab 1: Businesses */}
                <button
                  type="button"
                  className={`sf-tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('businesses')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} />
                    Businesses
                  </span>
                  <span className={`sf-tab-badge ${activeTab === 'businesses' ? 'active' : ''}`}>
                    {deletedBusinessesCount}
                  </span>
                </button>

                {/* Tab 2: Accounts / Ledgers */}
                <button
                  type="button"
                  className={`sf-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('accounts')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={16} />
                    Accounts
                  </span>
                  <span className={`sf-tab-badge ${activeTab === 'accounts' ? 'active' : ''}`}>
                    {deletedAccountsCount}
                  </span>
                </button>

                {/* Tab 3: Transactions */}
                <button
                  type="button"
                  className={`sf-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transactions')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} />
                    Transactions
                  </span>
                  <span className={`sf-tab-badge ${activeTab === 'transactions' ? 'active' : ''}`}>
                    {deletedTransactionsCount}
                  </span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="sf-modal-content">
                {/* Pane 1: Businesses Table */}
                {activeTab === 'businesses' && (
                  <div>
                    <div className="sf-pane-header">
                      <h3>Deleted Businesses</h3>
                      <span className="sf-record-count">
                        {deletedBusinessesCount} record{deletedBusinessesCount === 1 ? '' : 's'} found
                      </span>
                    </div>

                    {history?.businesses && history.businesses.length > 0 ? (
                      <div className="sf-table-wrapper">
                        <table className="sf-table">
                          <thead>
                            <tr>
                              <th>Business Name</th>
                              <th>Category / Industry</th>
                              <th>Type</th>
                              <th style={{ textAlign: 'right' }}>Deleted Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.businesses.map((b) => (
                              <tr key={b.business_id || b.id}>
                                <td style={{ fontWeight: 700, color: '#0E1A14' }}>
                                  {b.business_name}
                                </td>
                                <td>{b.industry || 'General Business'}</td>
                                <td>
                                  <span className="sf-table-chip">{b.business_type || 'Standard'}</span>
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                  {b.deleted_at
                                    ? new Date(b.deleted_at).toLocaleDateString()
                                    : 'Archived'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="sf-empty-state">
                        <Building2 size={36} color="#8FA196" />
                        <p>No deleted businesses found.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pane 2: Accounts / Ledgers Table */}
                {activeTab === 'accounts' && (
                  <div>
                    <div className="sf-pane-header">
                      <h3>Deleted Accounts & Ledgers</h3>
                      <span className="sf-record-count">
                        {deletedAccountsCount} record{deletedAccountsCount === 1 ? '' : 's'} found
                      </span>
                    </div>

                    {history?.accounts && history.accounts.length > 0 ? (
                      <div className="sf-table-wrapper">
                        <table className="sf-table">
                          <thead>
                            <tr>
                              <th>Ledger Account</th>
                              <th>Type</th>
                              <th>Associated Business</th>
                              <th style={{ textAlign: 'right' }}>Archived Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.accounts.map((a) => (
                              <tr key={a.account_id || a.id}>
                                <td style={{ fontWeight: 700, color: '#0E1A14' }}>
                                  {a.account_name}
                                </td>
                                <td>
                                  <span className="sf-table-chip">{a.account_type || 'Asset'}</span>
                                </td>
                                <td>{a.business_name || '—'}</td>
                                <td
                                  style={{
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    color: '#0E1A14',
                                  }}
                                >
                                  ${parseFloat(a.balance || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="sf-empty-state">
                        <Wallet size={36} color="#8FA196" />
                        <p>No deleted accounts found.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pane 3: Transactions Table */}
                {activeTab === 'transactions' && (
                  <div>
                    <div className="sf-pane-header">
                      <h3>Deleted Transactions</h3>
                      <span className="sf-record-count">
                        {deletedTransactionsCount} record{deletedTransactionsCount === 1 ? '' : 's'} found
                      </span>
                    </div>

                    {history?.transactions && history.transactions.length > 0 ? (
                      <div className="sf-table-wrapper">
                        <table className="sf-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Business</th>
                              <th style={{ textAlign: 'right' }}>Debit</th>
                              <th style={{ textAlign: 'right' }}>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.transactions.map((t) => (
                              <tr key={t.transaction_id || t.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#44544B' }}>
                                  {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ fontWeight: 700, color: '#0E1A14', maxWidth: '220px' }}>
                                  {t.description || '—'}
                                </td>
                                <td>{t.business_name || '—'}</td>
                                <td
                                  style={{
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: parseFloat(t.debit) > 0 ? '#0E1A14' : '#8FA196',
                                  }}
                                >
                                  {parseFloat(t.debit) > 0
                                    ? `PKR ${parseFloat(t.debit).toFixed(2)}`
                                    : '—'}
                                </td>
                                <td
                                  style={{
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: parseFloat(t.credit) > 0 ? '#0E1A14' : '#8FA196',
                                  }}
                                >
                                  {parseFloat(t.credit) > 0
                                    ? `PKR ${parseFloat(t.credit).toFixed(2)}`
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="sf-empty-state">
                        <FileText size={36} color="#8FA196" />
                        <p>No deleted transactions found.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Note */}
            <div className="sf-modal-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#44544B' }}>
                <ShieldCheck size={16} color="#0E1A14" />
                <span>Read-only. Deleted items are hidden, not erased, and kept here for your records.</span>
              </div>
              <button
                type="button"
                className="sf-btn sf-out sf-btn-sm"
                onClick={() => setShowHistoryModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Styles for Profile Matching Stitch Exact Specifications */}
      <style>{`
        .sf-profile-page {
          background: #F2F5EE;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          color: #0E1A14;
          min-height: 100vh;
          width: 100%;
          -webkit-font-smoothing: antialiased;
          display: flex;
          flex-direction: column;
        }

        .sf-profile-page .sf-main-container {
          flex: 1;
          width: 100%;
          max-width: 896px;
          margin: 0 auto;
          padding: 40px 24px 60px;
          box-sizing: border-box;
        }

        .sf-profile-page .sf-headline-hero {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 64px;
          line-height: 0.98;
          letter-spacing: -0.04em;
          font-weight: 800;
          margin: 0 0 16px;
          color: #0E1A14;
        }

        .sf-profile-page .sf-body-lg {
          font-size: 19px;
          line-height: 29px;
          color: #434844;
          margin: 0;
          max-width: 680px;
        }

        .sf-profile-page .sf-card {
          background: #FFFFFF;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 36px 40px;
          margin-bottom: 24px;
          box-sizing: border-box;
        }

        .sf-profile-page .sf-card-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 30px;
          border-bottom: 2px solid #0E1A14;
        }

        .sf-profile-page .sf-avatar {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #0E1A14;
          color: #C8F135;
          border: 2px solid #0E1A14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 32px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.02em;
        }

        .sf-profile-page .sf-user-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0;
          color: #0E1A14;
        }

        .sf-profile-page .sf-badge-owner {
          background: #FBFFE6;
          color: #0E1A14;
          border: 1.5px solid #0E1A14;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sf-profile-page .sf-user-email {
          font-size: 17px;
          color: #434844;
          margin: 4px 0 2px;
          font-weight: 500;
        }

        .sf-profile-page .sf-account-id {
          font-size: 12px;
          color: #737874;
          margin: 0;
        }

        .sf-profile-page .sf-account-id span {
          font-family: monospace;
          color: #0E1A14;
          font-weight: 600;
        }

        .sf-profile-page .sf-details-list {
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sf-profile-page .sf-detail-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          font-size: 16px;
        }

        .sf-profile-page .sf-detail-label {
          color: #434844;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sf-profile-page .sf-leader-line {
          flex: 1;
          border-bottom: 2px dotted #B8C4B1;
          margin: 0 12px;
          transform: translateY(-4px);
        }

        .sf-profile-page .sf-detail-val {
          color: #0E1A14;
          flex-shrink: 0;
        }

        .sf-profile-page .sf-actions-partition {
          border-top: 2px solid #0E1A14;
          padding-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sf-profile-page .sf-action-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          background: #FFFFFF;
          border: 2px solid #0E1A14;
          border-radius: 4px;
          box-sizing: border-box;
          flex-wrap: wrap;
        }

        .sf-profile-page .sf-action-box.highlight {
          background: #F7FAF3;
        }

        .sf-profile-page .sf-action-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          color: #0E1A14;
        }

        .sf-profile-page .sf-action-desc {
          font-size: 14px;
          color: #434844;
          margin: 4px 0 0;
        }

        .sf-profile-page .sf-notice-banner {
          background: #C8F135;
          color: #0E1A14;
          border: 2px solid #0E1A14;
          padding: 16px 20px;
          border-radius: 4px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-sizing: border-box;
        }

        .sf-profile-page .sf-notice-banner p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
        }

        /* Profile Buttons (Scoped strictly to profile page) */
        .sf-profile-page .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 15px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          box-sizing: border-box;
          transition: transform .15s ease-out, background .15s;
          user-select: none;
        }

        .sf-profile-page .sf-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .sf-profile-page .sf-btn.lime {
          background: #C8F135;
          color: #0E1A14;
        }

        .sf-profile-page .sf-btn.sf-out {
          background: #FFFFFF;
          color: #0E1A14;
        }

        .sf-profile-page .sf-btn.sf-out:hover:not(:disabled) {
          background: #E4EBDC;
        }

        .sf-profile-page .sf-btn-sm {
          min-height: 42px;
          padding: 0 16px;
          font-size: 14px;
        }

        /* Loader & alerts */
        .sf-profile-page .sf-loader-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          padding: 18px 24px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
        }

        .sf-profile-page .sf-sp {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid #0E1A14;
          border-top-color: transparent;
          border-radius: 50%;
          animation: sf-spin .8s linear infinite;
        }

        @keyframes sf-spin {
          to { transform: rotate(360deg); }
        }

        .sf-profile-page .sf-al {
          padding: 14px 16px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 16px;
          color: #0E1A14;
        }

        .sf-profile-page .sf-al.err {
          background: #F2B66B;
        }

        /* Modal Styles */
        .sf-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(14, 26, 20, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .sf-modal-box {
          background: #FFFFFF;
          border: 2px solid #0E1A14;
          width: 100%;
          max-width: 860px;
          border-radius: 4px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          overflow: hidden;
          animation: sf-modal-in 0.15s ease-out;
        }

        .sf-modal-box .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 16px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          box-sizing: border-box;
          transition: transform .15s ease-out, background .15s;
          user-select: none;
        }

        .sf-modal-box .sf-btn:hover {
          transform: translateY(-2px);
        }

        .sf-modal-box .sf-btn.sf-out {
          background: #FFFFFF;
          color: #0E1A14;
        }

        .sf-modal-box .sf-btn.sf-out:hover {
          background: #E4EBDC;
        }

        @keyframes sf-modal-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .sf-modal-header {
          background: #F7FAF3;
          border-bottom: 2px solid #0E1A14;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sf-modal-icon-badge {
          width: 28px;
          height: 28px;
          border-radius: 3px;
          background: #0E1A14;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sf-modal-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: #0E1A14;
          letter-spacing: -0.03em;
        }

        .sf-modal-close {
          width: 34px;
          height: 34px;
          background: #FFFFFF;
          border: 2px solid #0E1A14;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #0E1A14;
          transition: background .15s, transform .15s;
        }

        .sf-modal-close:hover {
          background: #C8F135;
          transform: translateY(-2px);
        }

        .sf-modal-body {
          flex: 1;
          display: flex;
          flex-direction: row;
          min-height: 400px;
          overflow: hidden;
        }

        .sf-modal-tabs {
          width: 220px;
          border-right: 2px solid #0E1A14;
          background: #F2F5EE;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .sf-tab-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border: 2px solid transparent;
          background: #FFFFFF;
          color: #0E1A14;
          font-weight: 600;
          font-size: 15px;
          border-radius: 3px;
          cursor: pointer;
          transition: all .15s;
          text-align: left;
        }

        .sf-tab-btn:hover {
          border-color: #0E1A14;
          background: #FBFFE6;
        }

        .sf-tab-btn.active {
          background: #C8F135;
          border-color: #0E1A14;
          font-weight: 700;
        }

        .sf-tab-badge {
          background: #E4EBDC;
          border: 1px solid #0E1A14;
          color: #0E1A14;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-family: monospace;
        }

        .sf-tab-badge.active {
          background: #0E1A14;
          color: #C8F135;
          border-color: #0E1A14;
        }

        .sf-modal-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #FFFFFF;
          box-sizing: border-box;
        }

        .sf-pane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sf-pane-header h3 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #0E1A14;
        }

        .sf-record-count {
          font-size: 13px;
          color: #737874;
          font-family: monospace;
        }

        .sf-table-wrapper {
          border: 2px solid #0E1A14;
          border-radius: 4px;
          overflow-x: auto;
        }

        .sf-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        .sf-table thead tr {
          background: #F2F5EE;
          border-bottom: 2px solid #0E1A14;
        }

        .sf-table th {
          padding: 10px 14px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0E1A14;
          font-weight: 700;
        }

        .sf-table td {
          padding: 12px 14px;
          border-bottom: 1.5px solid #F2F5EE;
          color: #434844;
        }

        .sf-table tbody tr:last-child td {
          border-bottom: none;
        }

        .sf-table tbody tr:hover {
          background: #FBFFE6;
        }

        .sf-table-chip {
          display: inline-block;
          background: #E4EBDC;
          border: 1px solid #0E1A14;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          color: #0E1A14;
        }

        .sf-empty-state {
          padding: 48px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #737874;
        }

        .sf-empty-state p {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }

        .sf-modal-footer {
          background: #F7FAF3;
          border-top: 2px solid #0E1A14;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .sf-profile-page .sf-main-container {
            padding: 24px 16px 40px;
          }
          .sf-profile-page .sf-headline-hero {
            font-size: 44px;
          }
          .sf-profile-page .sf-card {
            padding: 24px 20px;
          }
          .sf-profile-page .sf-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .sf-modal-body {
            flex-direction: column;
          }
          .sf-modal-tabs {
            width: 100%;
            border-right: none;
            border-bottom: 2px solid #0E1A14;
            flex-direction: row;
            overflow-x: auto;
          }
          .sf-tab-btn {
            flex: 1;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}
