import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';

const currency = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

// Map account types to categories for ordering
const getCategoryOrder = (type_id, type_name) => {
  // Assets: type_id 3, 4, 5, 11
  if ([3, 4, 5, 11].includes(Number(type_id)) ||
    ['Assets', 'Fixed Assets', 'Current Assets', 'Other Assets'].includes(type_name)) {
    return 1; // Assets
  }
  // Liabilities: type_id 6, 7, 8
  if ([6, 7, 8].includes(Number(type_id)) ||
    ['Liability', 'Current Liability', 'Non-Current Liabilities'].includes(type_name)) {
    return 2; // Liabilities
  }
  // Equity: type_id 9
  if (Number(type_id) === 9 || type_name === 'Equity') {
    return 3; // Equity
  }
  // Income: type_id 1, 12
  if ([1, 12].includes(Number(type_id)) ||
    ['Income', 'Other Incomes'].includes(type_name)) {
    return 4; // Income
  }
  // Expenses: type_id 2, 13, 14
  if ([2, 13, 14].includes(Number(type_id)) ||
    ['Expense', 'Other Expenses', 'Cost Of Goods Sold'].includes(type_name)) {
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
    5: 'Expenses'
  };
  return categories[order] || 'Others';
};


const TrialBalance = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trialBalanceData, setTrialBalanceData] = useState([]);
  const [grandTotal, setGrandTotal] = useState({ debit: 0, credit: 0 });
  const [currentDate, setCurrentDate] = useState('');

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
      if (!selectedBusiness?.business_id) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}`,
          { withCredentials: true }
        );

        // Process ledgers for trial balance - use total_debits and total_credits directly
        const processed = (data.ledgers || []).map(ledger => {
          const categoryOrder = getCategoryOrder(ledger.type_id, ledger.type_name);

          return {
            ...ledger,
            categoryOrder,
            categoryName: getCategoryName(categoryOrder),
            trialDebit: Number(ledger.total_debits) || 0,
            trialCredit: Number(ledger.total_credits) || 0
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
            credit: acc.credit + ledger.trialCredit
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
  }, [selectedBusiness?.business_id, apiUrl]);

  const businessName = selectedBusiness?.business_name || selectedBusiness?.businessName || 'Business';

  // Group by category for display
  const groupedData = trialBalanceData.reduce((acc, ledger) => {
    const category = ledger.categoryName;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ledger);
    return acc;
  }, {});

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-20">
        <Navbar />
      </div>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 via-transparent to-cyan-800/20"></div>
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 text-4xl text-blue-400/20 animate-pulse">🏢</div>
          <div className="absolute top-40 right-20 text-3xl text-cyan-400/20 animate-bounce">📊</div>
          <div className="absolute bottom-40 left-32 text-5xl text-purple-400/20 animate-pulse">💼</div>
          <div className="absolute bottom-20 right-40 text-3xl text-indigo-400/20 animate-bounce">📈</div>
          <div className="absolute top-1/2 left-1/4 text-2xl text-teal-400/20 animate-pulse">🏪</div>
          <div className="absolute top-1/3 right-1/3 text-4xl text-violet-400/20 animate-bounce">🏭</div>
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>
          <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
            <defs>
              <linearGradient id="networkGradientTrial" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path d="M100,100 L300,200 L600,150 L900,300 L1200,200" stroke="url(#networkGradientTrial)" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M200,400 L500,300 L800,450 L1100,350" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }} />
          </svg>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">Trial Balance</h1>
            <button
              className="text-sm text-primary-600 hover:text-primary-800"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{businessName}</h2>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Trial Balance</h3>
              <p className="text-sm text-gray-600">As of {currentDate}</p>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="py-4 text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                        Ledger Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(groupedData).map((category) => (
                      <React.Fragment key={category}>
                        {groupedData[category].map((ledger, idx) => (
                          <tr key={ledger.account_id}>
                            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                              {ledger.account_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-700">
                              {ledger.trialDebit > 0 ? currency(ledger.trialDebit) : '0.00'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-700">
                              {ledger.trialCredit > 0 ? currency(ledger.trialCredit) : '0.00'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {/* Grand Total Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {currency(grandTotal.debit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {currency(grandTotal.credit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;

