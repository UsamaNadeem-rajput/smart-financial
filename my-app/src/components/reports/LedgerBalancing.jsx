import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';

const currency = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

const formatClosing = (balance) => {
  if (!balance) return currency(0);
  return `${currency(balance.amount)} ${balance.type}`;
};

const normalizeOppositeAccounts = (entry) => {
  if (!entry?.opposite_accounts) return [];
  if (Array.isArray(entry.opposite_accounts)) return entry.opposite_accounts.filter(Boolean);
  try {
    return JSON.parse(entry.opposite_accounts).filter(Boolean);
  } catch {
    return [];
  }
};

const LedgerBalancing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const selection = location.state?.selectedLedger || 'all';
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allLedgers, setAllLedgers] = useState([]);
  const [totals, setTotals] = useState({ total_debits: 0, total_credits: 0, balanced: true });
  const [ledgerDetails, setLedgerDetails] = useState(null);

  const isAll = selection === 'all';

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusiness?.business_id) return;
      setLoading(true);
      setError('');
      try {
        if (isAll) {
          const { data } = await axios.get(`${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}`, { withCredentials: true });
          setAllLedgers(data.ledgers || []);
          setTotals(data.totals || { total_debits: 0, total_credits: 0, balanced: true });
        } else if (selection?.id) {
          const { data } = await axios.get(`${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}/${selection.id}`, { withCredentials: true });
          setLedgerDetails(data.ledger || null);
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load ledger balancing data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness?.business_id, selection === 'all' ? 'all' : selection?.id]);

  const header = useMemo(() => (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Ledger Balancing</h1>
      <button className="text-sm text-primary-600 hover:text-primary-800" onClick={() => navigate(-1)}>Back</button>
    </div>
  ), [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {header}

          <div className="bg-white shadow sm:rounded-lg p-6">
            {isAll ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-700">
                    <div className="text-sm">Total Debits: <span className="font-semibold">{currency(totals.total_debits)}</span></div>
                    <div className="text-sm">Total Credits: <span className="font-semibold">{currency(totals.total_credits)}</span></div>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-gray-500">Loading...</div>
                ) : error ? (
                  <div className="py-4 text-red-600">{error}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ledger</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debits</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Closing</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allLedgers.map(l => (
                          <tr key={l.account_id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-primary-700 underline cursor-pointer" onClick={() => navigate('/ledger-balancing', { state: { selectedLedger: { id: l.account_id, name: l.account_name } } })}>{l.account_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{l.type_name}</td>
                            <td className="px-4 py-2 text-sm text-right">{currency(l.total_debits)}</td>
                            <td className="px-4 py-2 text-sm text-right">{currency(l.total_credits)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">{formatClosing(l.closing_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-gray-700">Selected Ledger:</div>
                    <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      <span className="font-medium">{selection?.name}</span>
                      <span className="ml-2 text-xs text-gray-500">ID: {selection?.id}</span>
                    </div>
                  </div>
                  {ledgerDetails && (
                    <div className="text-right text-sm text-gray-700">
                      <div>Debits: <span className="font-semibold">{currency(ledgerDetails.total_debits)}</span></div>
                      <div>Credits: <span className="font-semibold">{currency(ledgerDetails.total_credits)}</span></div>
                      <div>Closing: <span className="font-semibold">{formatClosing(ledgerDetails.closing_balance)}</span></div>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="py-10 text-center text-gray-500">Loading...</div>
                ) : error ? (
                  <div className="py-4 text-red-600">{error}</div>
                ) : (
                  <div className="bg-white border-2 border-gray-800">
                    {/* Ledger Header */}
                    <div className="border-b-2 border-gray-800 p-4 text-center">
                      <h2 className="text-xl font-bold text-gray-900">LEDGER</h2>
                      <h3 className="text-lg font-semibold text-gray-700 mt-1">{selection?.name}</h3>
                      <p className="text-sm text-gray-600">Account ID: {selection?.id}</p>
                    </div>

                    {/* T-Account Format */}
                    <div className="flex">
                      {/* Debit Side */}
                      <div className="flex-1 border-r border-gray-300">
                        <div className="bg-gray-100 border-b border-gray-300 p-2 text-center">
                          <h4 className="font-bold text-gray-800">Dr.</h4>
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-left w-16">Date</th>
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-left">Particulars</th>
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-right w-24">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ledgerDetails?.entries || [])
                              .filter(e => e.type === 'debit')
                              .map((e, idx) => (
                                <tr key={`dr-${e.transaction_id}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-2 py-1 text-xs text-gray-700">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                                  <td className="px-2 py-1 text-xs text-gray-700">
                                    {(() => {
                                      const accounts = normalizeOppositeAccounts(e);
                                      if (accounts.length) {
                                        return `To ${accounts.map(acc => acc.account_name).join(', ')}`;
                                      }
                                      return 'To Various';
                                    })()}
                                    {e.description && <div className="text-xs text-gray-500 italic">{e.description}</div>}
                                  </td>
                                  <td className="px-2 py-1 text-xs text-gray-700 text-right">{Number(e.amount).toFixed(2)}</td>
                                </tr>
                              ))}
                            
                            {/* Balancing figure (always labeled c/d) */}
                            {ledgerDetails && ledgerDetails.total_credits > ledgerDetails.total_debits && (
                              <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-2 py-1 text-xs text-gray-700"></td>
                                <td className="px-2 py-1 text-xs text-gray-700 font-medium">c/d</td>
                                <td className="px-2 py-1 text-xs text-gray-700 text-right font-medium">
                                  {(ledgerDetails.total_credits - ledgerDetails.total_debits).toFixed(2)}
                                </td>
                              </tr>
                            )}

                            {/* Total */}
                            <tr className="bg-gray-100 border-t-2 border-gray-300">
                              <td className="px-2 py-1 text-xs font-bold text-gray-800"></td>
                              <td className="px-2 py-1 text-xs font-bold text-gray-800">Total</td>
                              <td className="px-2 py-1 text-xs font-bold text-gray-800 text-right">
                                {ledgerDetails ? Math.max(ledgerDetails.total_debits, ledgerDetails.total_credits).toFixed(2) : '0.00'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Credit Side */}
                      <div className="flex-1">
                        <div className="bg-gray-100 border-b border-gray-300 p-2 text-center">
                          <h4 className="font-bold text-gray-800">Cr.</h4>
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-left w-16">Date</th>
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-left">Particulars</th>
                              <th className="px-2 py-1 text-xs font-medium text-gray-600 text-right w-24">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ledgerDetails?.entries || [])
                              .filter(e => e.type === 'credit')
                              .map((e, idx) => (
                                <tr key={`cr-${e.transaction_id}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-2 py-1 text-xs text-gray-700">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                                  <td className="px-2 py-1 text-xs text-gray-700">
                                    {(() => {
                                      const accounts = normalizeOppositeAccounts(e);
                                      if (accounts.length) {
                                        return `By ${accounts.map(acc => acc.account_name).join(', ')}`;
                                      }
                                      return 'By Various';
                                    })()}
                                    {e.description && <div className="text-xs text-gray-500 italic">{e.description}</div>}
                                  </td>
                                  <td className="px-2 py-1 text-xs text-gray-700 text-right">{Number(e.amount).toFixed(2)}</td>
                                </tr>
                              ))}
                            
                            {/* Balancing figure (always labeled c/d) */}
                            {ledgerDetails && ledgerDetails.total_debits > ledgerDetails.total_credits && (
                              <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-2 py-1 text-xs text-gray-700"></td>
                                <td className="px-2 py-1 text-xs text-gray-700 font-medium">c/d</td>
                                <td className="px-2 py-1 text-xs text-gray-700 text-right font-medium">
                                  {(ledgerDetails.total_debits - ledgerDetails.total_credits).toFixed(2)}
                                </td>
                              </tr>
                            )}

                            {/* Total */}
                            <tr className="bg-gray-100 border-t-2 border-gray-300">
                              <td className="px-2 py-1 text-xs font-bold text-gray-800"></td>
                              <td className="px-2 py-1 text-xs font-bold text-gray-800">Total</td>
                              <td className="px-2 py-1 text-xs font-bold text-gray-800 text-right">
                                {ledgerDetails ? Math.max(ledgerDetails.total_debits, ledgerDetails.total_credits).toFixed(2) : '0.00'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Closing Balance Summary */}
                    <div className="border-t-2 border-gray-800 p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Closing Balance: </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatClosing(ledgerDetails?.closing_balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerBalancing;

