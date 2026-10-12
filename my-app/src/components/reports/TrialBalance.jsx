import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';

const currency = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

// Map account types to categories for ordering
const getCategoryOrder = (type_id, type_name) => {
  // Assets: type_id 3, 4, 5, 11
  if (
    [3, 4, 5, 11].includes(Number(type_id)) ||
    ['Assets', 'Fixed Assets', 'Current Assets', 'Other Assets'].includes(type_name)
  ) {
    return 1; // Assets
  }
  // Liabilities: type_id 6, 7, 8
  if (
    [6, 7, 8].includes(Number(type_id)) ||
    ['Liability', 'Current Liability', 'Non-Current Liabilities'].includes(type_name)
  ) {
    return 2; // Liabilities
  }
  // Equity: type_id 9
  if (Number(type_id) === 9 || type_name === 'Equity') {
    return 3; // Equity
  }
  // Income: type_id 1, 12
  if (
    [1, 12].includes(Number(type_id)) ||
    ['Income', 'Other Incomes'].includes(type_name)
  ) {
    return 4; // Income
  }
  // Expenses: type_id 2, 13, 14
  if (
    [2, 13, 14].includes(Number(type_id)) ||
    ['Expense', 'Other Expenses', 'Cost Of Goods Sold'].includes(type_name)
  ) {
    return 5; // Expenses
  }
  return 6; // Others (fallback)
};

const getCategoryName = (order) => {
  const categories = {
    1: 'Assets',
    2: 'Liabilities',
    3: 'Equity',
    4: 'Income',
    5: 'Expenses',
  };
  return categories[order] || 'Others';
};

export default function TrialBalance() {
  const navigate = useNavigate();
  const { selectedBusiness, refreshTrigger } = useBusiness();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trialBalanceData, setTrialBalanceData] = useState([]);
  const [grandTotal, setGrandTotal] = useState({ debit: 0, credit: 0 });
  const [currentDate, setCurrentDate] = useState('');
  const [hideZeroActivity, setHideZeroActivity] = useState(false);

  useEffect(() => {
    // Set current date/time when component loads
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusiness?.business_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}`,
          { withCredentials: true }
        );

        // Process ledgers for trial balance - use total_debits and total_credits directly
        const processed = (data.ledgers || []).map((ledger) => {
          const categoryOrder = getCategoryOrder(ledger.type_id, ledger.type_name);

          return {
            ...ledger,
            categoryOrder,
            categoryName: getCategoryName(categoryOrder),
            trialDebit: Number(ledger.total_debits) || 0,
            trialCredit: Number(ledger.total_credits) || 0,
          };
        });

        // Sort by category order, then by account name
        processed.sort((a, b) => {
          if (a.categoryOrder !== b.categoryOrder) {
            return a.categoryOrder - b.categoryOrder;
          }
          return a.account_name.localeCompare(b.account_name);
        });

        setTrialBalanceData(processed);

        // Calculate grand totals - sum of all total_debits and total_credits
        const totals = processed.reduce(
          (acc, ledger) => ({
            debit: acc.debit + ledger.trialDebit,
            credit: acc.credit + ledger.trialCredit,
          }),
          { debit: 0, credit: 0 }
        );
        setGrandTotal(totals);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load trial balance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBusiness?.business_id, apiUrl, refreshTrigger]);

  const businessName =
    selectedBusiness?.business_name || selectedBusiness?.businessName || 'Business';

  // Group by category order
  const categoriesList = [
    { order: 1, name: 'Assets' },
    { order: 2, name: 'Liabilities' },
    { order: 3, name: 'Equity' },
    { order: 4, name: 'Income' },
    { order: 5, name: 'Expenses' },
    { order: 6, name: 'Others' },
  ];

  const categoryGroups = categoriesList
    .map((cat) => {
      const allLedgers = trialBalanceData.filter((l) => l.categoryOrder === cat.order);
      const totalDebits = allLedgers.reduce((sum, l) => sum + l.trialDebit, 0);
      const totalCredits = allLedgers.reduce((sum, l) => sum + l.trialCredit, 0);
      const visibleLedgers = hideZeroActivity
        ? allLedgers.filter((l) => l.trialDebit > 0 || l.trialCredit > 0)
        : allLedgers;

      return {
        order: cat.order,
        name: cat.name,
        allLedgers,
        visibleLedgers,
        totalDebits,
        totalCredits,
      };
    })
    .filter((group) => group.allLedgers.length > 0);

  const diff = Math.abs(grandTotal.debit - grandTotal.credit);
  const isBalanced = diff < 0.01 && grandTotal.debit > 0;
  const maxTotal = Math.max(grandTotal.debit, grandTotal.credit, 1);
  const debitPct = grandTotal.debit > 0 ? Math.min(100, (grandTotal.debit / maxTotal) * 100) : 0;
  const creditPct = grandTotal.credit > 0 ? Math.min(100, (grandTotal.credit / maxTotal) * 100) : 0;

  return (
    <div
      style={{
        backgroundColor: '#F2F5EE',
        minHeight: '100vh',
        color: '#0E1A14',
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <Navbar />

      <main className="sf-tb-wrap" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Breadcrumb & Navigation Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ color: '#44544B', fontSize: '15px', margin: 0 }}>
            <Link
              to="/showbusinessaccount"
              style={{ borderBottom: '1px solid #0E1A14', color: '#0E1A14', textDecoration: 'none' }}
            >
              Reports
            </Link>{' '}
            / Trial balance
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '2px solid #0E1A14',
                color: '#0E1A14',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                padding: '0 0 2px 0',
              }}
            >
              Print statement
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '2px solid #0E1A14',
                color: '#0E1A14',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                padding: '0 0 2px 0',
              }}
            >
              ← Back to Reports
            </button>
          </div>
        </div>

        {/* Page Title & Mission */}
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            marginTop: '14px',
            marginBottom: 0,
            color: '#0E1A14',
          }}
        >
          Trial Balance.
        </h1>
        <p
          style={{
            color: '#44544B',
            fontSize: '20px',
            marginTop: '16px',
            maxWidth: '720px',
            lineHeight: 1.5,
          }}
        >
          The proof that every debit has a credit. Add up every ledger, and both sides must come out the
          same.
        </p>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              marginTop: '40px',
              padding: '60px 24px',
              textAlign: 'center',
              background: '#fff',
              border: '2px solid #0E1A14',
              borderRadius: '6px',
              boxShadow: '4px 4px 0 #0E1A14',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
            role="status"
            aria-live="polite"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#0E1A14',
                borderRadius: '50%',
                animation: 'sf-spin 0.7s linear infinite',
              }}
            />
            <p
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: '22px',
                color: '#0E1A14',
              }}
            >
              Calculating trial balance...
            </p>
            <p style={{ margin: 0, fontSize: '15px', color: '#44544B' }}>
              Aggregating debits and credits across all active business ledgers.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              marginTop: '32px',
              padding: '24px',
              background: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: '6px',
              boxShadow: '4px 4px 0 #0E1A14',
            }}
            role="alert"
          >
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#991B1B', margin: 0 }}>
              Could not load trial balance
            </p>
            <p style={{ marginTop: '8px', marginBottom: 0, color: '#7F1D1D', fontSize: '15px' }}>
              {error}
            </p>
          </div>
        )}

        {/* Main Trial Balance Sheet */}
        {!loading && !error && (
          <div className="sf-tb-sheet">
            {/* Report Header */}
            <div className="sf-tb-rh">
              <h2>{businessName}</h2>
              <h3>Trial Balance</h3>
              <p>As of {currentDate}</p>
            </div>

            {/* Controls */}
            <div className="sf-tb-tools">
              <label className="sf-tb-sw">
                <input
                  type="checkbox"
                  checked={hideZeroActivity}
                  onChange={(e) => setHideZeroActivity(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                />
                <span className="sf-tb-sw-slider"></span>
                Hide ledgers with no activity
              </label>
              <p style={{ color: '#44544B', fontSize: '14px', maxWidth: '520px', margin: 0, textAlign: 'right' }}>
                Each figure is the total of all debits or credits posted to that ledger. Ledgers follow the
                standard order: Assets, Liabilities, Equity, Income, Expenses.
              </p>
            </div>

            {/* Table Header */}
            <div className="sf-tb-hd" aria-hidden="true">
              <span>Ledger name</span>
              <span>Debit ($)</span>
              <span>Credit ($)</span>
            </div>

            {/* Empty group alert */}
            {categoryGroups.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#44544B' }}>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>No chart of accounts found.</p>
                <p style={{ fontSize: '14px', marginTop: '6px' }}>
                  Create ledgers in Chart of Accounts or post transactions to see figures here.
                </p>
                <Link
                  to="/showbusinessaccount"
                  className="sf-btn sf-btn-lime"
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                  Go to Ledgers
                </Link>
              </div>
            )}

            {/* Category Groups */}
            {categoryGroups.map((group) => {
              const count = group.visibleLedgers.length;
              const hasHidden = group.allLedgers.length > group.visibleLedgers.length;

              return (
                <details key={group.order} className="sf-tb-gp" open>
                  <summary>
                    <span className="sf-tb-gn">
                      <svg
                        className="sf-tb-cv"
                        width="14"
                        height="14"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 4l4 4 4-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {group.name}
                      <small>
                        {count} {count === 1 ? 'ledger' : 'ledgers'}
                        {hasHidden ? ` (${group.allLedgers.length - count} zero hidden)` : ''}
                      </small>
                    </span>
                    <span className="sf-tb-sn">{currency(group.totalDebits)}</span>
                    <span className="sf-tb-sn">{currency(group.totalCredits)}</span>
                  </summary>

                  <table className="sf-tb-table">
                    <caption className="sr-only">{group.name} ledgers</caption>
                    <thead className="sr-only">
                      <tr>
                        <th scope="col">Ledger name</th>
                        <th scope="col">Debit</th>
                        <th scope="col">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.visibleLedgers.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#8A978F', padding: '16px' }}>
                            No active ledgers in this category
                          </td>
                        </tr>
                      ) : (
                        group.visibleLedgers.map((ledger) => {
                          const isZeroDebit = ledger.trialDebit === 0;
                          const isZeroCredit = ledger.trialCredit === 0;

                          return (
                            <tr key={ledger.account_id}>
                              <td className="ln">
                                <Link
                                  to="/ledger-balancing"
                                  state={{ selectedLedger: ledger.account_id }}
                                  className="sf-tb-ln-lk"
                                >
                                  {ledger.account_name}
                                  <span className="sf-tb-ar" aria-hidden="true">
                                    →
                                  </span>
                                </Link>
                              </td>
                              <td className={`n ${isZeroDebit ? 'z' : ''}`}>
                                {isZeroDebit ? '0.00' : currency(ledger.trialDebit)}
                              </td>
                              <td className={`n ${isZeroCredit ? 'z' : ''}`}>
                                {isZeroCredit ? '0.00' : currency(ledger.trialCredit)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" className="ln">
                          Total {group.name}
                        </th>
                        <td className="n">{currency(group.totalDebits)}</td>
                        <td className="n">{currency(group.totalCredits)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </details>
              );
            })}

            {/* Grand Total Block */}
            <div className="sf-tb-tot">
              <div className="sf-tb-tr1">
                <b>
                  Total{' '}
                  <span className={isBalanced ? 'sf-tb-ok' : 'sf-tb-unbal'}>
                    {isBalanced ? 'Balanced' : 'Out of balance'}
                  </span>
                </b>
                <span className="n">{currency(grandTotal.debit)}</span>
                <span className="n">{currency(grandTotal.credit)}</span>
              </div>
              <div className="sf-tb-bars">
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0E1A14' }}>
                  {isBalanced
                    ? 'Difference 0.00. Debits equal credits.'
                    : grandTotal.debit > grandTotal.credit
                    ? `Difference ${currency(diff)}. Debits exceed credits.`
                    : `Difference ${currency(diff)}. Credits exceed debits.`}
                </span>
                <div className="sf-tb-trk" title={`Debit: ${currency(grandTotal.debit)}`}>
                  <i style={{ width: `${debitPct}%` }}></i>
                </div>
                <div className="sf-tb-trk" title={`Credit: ${currency(grandTotal.credit)}`}>
                  <i className="c" style={{ width: `${creditPct}%` }}></i>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Next Links Section (Books Balance) */}
        {!loading && !error && isBalanced && (
          <div style={{ marginTop: '28px' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#44544B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              Books balance. Read the final reports next.
            </p>
            <div className="sf-tb-nx">
              <Link to="/income-report">
                <span>Income Statement</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/balance-sheet">
                <span>Balance Sheet</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Out-of-balance Warning State (Illustrated Diagnostic) */}
        {!loading && !error && !isBalanced && trialBalanceData.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#44544B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              State · totals do not match
            </p>
            <div className="sf-tb-bad" role="alert">
              <div className="h">
                <h2>Out of balance by {currency(diff)}.</h2>
                <p>
                  Debits are {currency(grandTotal.debit)} and credits are {currency(grandTotal.credit)}.
                  Something was posted incorrectly or left incomplete.
                </p>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ fontWeight: 700, fontSize: '17px', color: '#0E1A14', margin: 0 }}>
                  Where to look
                </p>
                <p style={{ color: '#44544B', marginTop: '6px', marginBottom: 0, fontSize: '15px' }}>
                  Open the General Journal and check the most recent transactions, then fix or delete the
                  one that is wrong.
                </p>
                <Link
                  to="/showtransections"
                  className="sf-btn sf-btn-lime"
                  style={{ marginTop: '16px', display: 'inline-flex', textDecoration: 'none' }}
                >
                  Open General Journal →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
