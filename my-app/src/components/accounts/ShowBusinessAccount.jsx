import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import {
  Wallet,
  PiggyBank,
  CreditCard,
  Landmark,
  TrendingUp,
  Coins
} from 'lucide-react';

const ShowBusinessAccount = () => {
  const navigate = useNavigate();
  const { selectedBusiness, refreshTrigger, triggerRefresh } = useBusiness();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchAccounts();
  }, [selectedBusiness, refreshTrigger]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedFilter]);

  const fetchAccounts = async () => {
    if (!selectedBusiness?.business_id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch accounts from backend API
      const response = await axios.get(`${apiUrl}/api/accounts-list/${selectedBusiness.business_id}`, {
        withCredentials: true
      });

      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter by search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.account_name.toLowerCase().includes(q) ||
        (account.type_name && account.type_name.toLowerCase().includes(q)) ||
        (account.description && account.description.toLowerCase().includes(q))
      );
    }

    // Filter by account type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(account => {
        const typeLower = (account.type_name || '').toLowerCase();
        if (selectedFilter === 'assets') return typeLower.includes('asset');
        if (selectedFilter === 'liabilities') return typeLower.includes('liabilit');
        if (selectedFilter === 'equity') return typeLower.includes('equity');
        if (selectedFilter === 'income') return typeLower.includes('income');
        if (selectedFilter === 'expenses') return typeLower.includes('expens');
        return typeLower.includes(selectedFilter.toLowerCase());
      });
    }

    setFilteredAccounts(filtered);
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await axios.delete(`${apiUrl}/api/accounts/${accountId}`, {
          withCredentials: true
        });
        setAccounts(prev => prev.filter(a => a.account_id !== accountId));
        triggerRefresh();
        alert('Account deleted successfully.');
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccountTypeIcon = (typeName = '') => {
    const t = typeName.toLowerCase();
    if (t.includes('asset')) return <Wallet className="w-5 h-5" />;
    if (t.includes('liabilit')) return <CreditCard className="w-5 h-5" />;
    if (t.includes('equity')) return <Coins className="w-5 h-5" />;
    if (t.includes('income')) return <TrendingUp className="w-5 h-5" />;
    if (t.includes('expens')) return <PiggyBank className="w-5 h-5" />;
    return <Landmark className="w-5 h-5" />;
  };

  const accountTypeFilters = [
    { value: 'all', label: 'All ledgers' },
    { value: 'assets', label: 'Assets' },
    { value: 'liabilities', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expenses', label: 'Expenses' }
  ];

  // Group definitions matching double-entry accounting standard
  const groupDefs = [
    { name: 'Assets', match: (t) => t.includes('asset'), rule: 'Balance = debits − credits', normalSide: 'Dr' },
    { name: 'Liabilities', match: (t) => t.includes('liabilit'), rule: 'Balance = credits − debits', normalSide: 'Cr' },
    { name: 'Equity', match: (t) => t.includes('equity'), rule: 'Balance = credits − debits', normalSide: 'Cr' },
    { name: 'Income', match: (t) => t.includes('income'), rule: 'Balance = credits − debits', normalSide: 'Cr' },
    { name: 'Expenses', match: (t) => t.includes('expens'), rule: 'Balance = debits − credits', normalSide: 'Dr' }
  ];

  // Active inspected account in right panel
  const activeAccount =
    filteredAccounts.find(a => a.account_id === selectedAccountId) ||
    filteredAccounts[0] ||
    null;

  const activeGroup = activeAccount
    ? groupDefs.find(g => g.match((activeAccount.type_name || '').toLowerCase())) || { normalSide: 'Dr', rule: 'Balance = debits − credits' }
    : { normalSide: 'Dr', rule: 'Balance = debits − credits' };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', height: '100%', background: '#F2F5EE', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div className="sf-wrap" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ink"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100%',
        background: '#F2F5EE',
        color: '#0E1A14',
        fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif",
        fontVariantNumeric: 'tabular-nums',
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Navbar />

      <main
        className="sf-wrap sf-coa-wrap"
        style={{
          flex: '1 0 auto',
          width: '100%',
          paddingTop: '40px',
          paddingBottom: '90px',
          boxSizing: 'border-box'
        }}
      >
        {/* Title & Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1
              style={{
                fontSize: 'clamp(44px, 5.5vw, 76px)',
                fontWeight: 800,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-0.04em',
                lineHeight: 0.98
              }}
            >
              Chart of Accounts.
            </h1>
            <p style={{ color: '#44544B', fontSize: '20px', marginTop: '16px', maxWidth: '660px', lineHeight: 1.55 }}>
              The index of your books. Each row is a ledger, and opening one shows its whole page: every debit, every credit and the balance after each.
            </p>
          </div>
          <div>
            <Link to="/creatnewaccount" className="sf-btn sf-btn-lime">
              + New ledger
            </Link>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '40px' }}>
          <div style={{ flex: '1 1 280px', maxWidth: '380px' }}>
            <label htmlFor="sq" className="sr">Search ledgers</label>
            <input
              id="sq"
              type="search"
              placeholder="Search ledgers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                minHeight: '46px',
                padding: '0 14px',
                fontSize: '16px',
                border: '2px solid #0E1A14',
                borderRadius: '6px',
                background: '#fff'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} role="group" aria-label="Filter by type">
            {accountTypeFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setSelectedFilter(f.value)}
                className={`sf-cp ${selectedFilter === f.value ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts Content: Master-Detail or Empty */}
        {filteredAccounts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#fff',
              border: '2px solid #0E1A14',
              borderRadius: '6px',
              maxWidth: '600px',
              margin: '48px auto 0',
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
              <Landmark className="w-8 h-8 text-brand-lime" />
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              {searchTerm || selectedFilter !== 'all' ? 'No ledgers found' : 'No ledgers yet'}
            </h3>
            <p style={{ color: '#44544B', fontSize: '18px', marginBottom: '24px' }}>
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first ledger to start tracking finances'}
            </p>
            <Link to="/creatnewaccount" className="sf-btn sf-btn-lime">
              + New ledger
            </Link>
          </div>
        ) : (
          /* Master-Detail Split View */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '44px', alignItems: 'flex-start', marginTop: '32px' }}>
            {/* Master: The Index */}
            <div className="sf-coa-idx">
              <p className="sf-cap">The index · {filteredAccounts.length} {filteredAccounts.length === 1 ? 'ledger' : 'ledgers'}</p>

              {groupDefs.map((group) => {
                const groupAccounts = filteredAccounts.filter(a => group.match((a.type_name || '').toLowerCase()));
                if (groupAccounts.length === 0) return null;

                const groupTotal = groupAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

                return (
                  <div key={group.name} className="sf-coa-g">
                    <div className="sf-coa-gh">
                      <div>
                        <b>{group.name}</b>
                        <small>{group.rule}</small>
                      </div>
                      <span>{formatCurrency(groupTotal)}</span>
                    </div>

                    <div role="listbox" aria-label={`${group.name} Ledgers`}>
                      {groupAccounts.map((account) => {
                        const isCurrent = activeAccount?.account_id === account.account_id;

                        return (
                          <div
                            key={account.account_id}
                            role="option"
                            aria-selected={isCurrent}
                            tabIndex={0}
                            onClick={() => setSelectedAccountId(account.account_id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedAccountId(account.account_id);
                              }
                            }}
                            className={`sf-coa-rw ${isCurrent ? 'active' : ''}`}
                          >
                            <span style={{ color: isCurrent ? '#0E1A14' : '#44544B' }}>
                              {getAccountTypeIcon(account.type_name)}
                            </span>
                            <span className="sf-coa-nmx">
                              <b>{account.account_name}</b>
                              <i>{account.description || account.type_name}</i>
                            </span>
                            <span className="sf-coa-bl">
                              {formatCurrency(account.balance)}
                              <small>{group.normalSide}</small>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail: The Ledger Page */}
            {activeAccount && (
              <div className="sf-coa-pn">
                <p className="sf-cap">The page</p>
                <div className="sf-coa-panel" aria-live="polite">
                  <div className="sf-coa-tp">
                    {getAccountTypeIcon(activeAccount.type_name)}
                    <span>{activeAccount.type_name}</span>
                  </div>

                  <h2 className="sf-coa-nm">{activeAccount.account_name}</h2>
                  <p style={{ color: '#44544B', marginTop: '8px', fontSize: '17px' }}>
                    {activeAccount.description ? `${activeAccount.description} · ` : ''}Created {formatDate(activeAccount.created_at)}
                  </p>

                  {/* Balance Box */}
                  <div className="sf-coa-bal">
                    <div>
                      <span className="sf-coa-lb">Closing balance</span>
                      <span className="sf-coa-bg">
                        {formatCurrency(activeAccount.balance)} <small style={{ fontSize: '18px', fontWeight: 700 }}>{activeGroup.normalSide}</small>
                      </span>
                    </div>
                    <p className="sf-coa-rl">{activeGroup.rule}</p>
                  </div>

                  {/* Account Summary Specs */}
                  <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                    <table className="sf-coa-table">
                      <thead>
                        <tr>
                          <th>Attribute</th>
                          <th>Specification</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Account Code / ID</td>
                          <td><b>#{activeAccount.account_id}</b></td>
                        </tr>
                        <tr>
                          <td>Account Classification</td>
                          <td><b>{activeAccount.type_name}</b></td>
                        </tr>
                        <tr>
                          <td>Description</td>
                          <td>{activeAccount.description || 'Standard business ledger account'}</td>
                        </tr>
                        <tr>
                          <td>Normal Balance Side</td>
                          <td><b>{activeGroup.normalSide === 'Dr' ? 'Debit (Dr)' : 'Credit (Cr)'}</b></td>
                        </tr>
                        <tr>
                          <td>Creation Date</td>
                          <td>{formatDate(activeAccount.created_at)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="sf-acts">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/ledger-balancing', {
                          state: {
                            selectedLedger: {
                              id: activeAccount.account_id,
                              name: activeAccount.account_name,
                            },
                          },
                        })
                      }
                      className="sf-btn sf-btn-lime"
                    >
                      View Ledger Entries →
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/editaccount', { state: { account: activeAccount } })}
                      className="sf-lk"
                    >
                      Edit ledger
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(activeAccount.account_id)}
                      className="sf-lk"
                      style={{ color: '#dc2626', borderColor: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShowBusinessAccount;