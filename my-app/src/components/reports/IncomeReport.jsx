import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const currency = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

const IncomeReport = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, netProfitLoss: 0 });
  const [currentDate, setCurrentDate] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setFromDate(todayStr);
    setToDate(todayStr);
  }, []);

  const fetchIncomeReport = async () => {
    if (!selectedBusiness?.business_id) {
      setError('Please select a business');
      return;
    }

    if (!fromDate || !toDate) {
      setError('Please select a date range');
      return;
    }

    if (fromDate > toDate) {
      setError('From date must be before or equal to to date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }

      const { data } = await axios.get(`${apiUrl}/api/income-report/${selectedBusiness.business_id}?${params.toString()}`, { withCredentials: true });

      console.log('Income Report API Response:', data);

      setIncomeData(data.income || []);
      setExpenseData(data.expense || []);
      setTotals(data.totals || { income: 0, expense: 0, netProfitLoss: 0 });
      setHasGenerated(true);
    } catch (e) {
      console.error('Income Report Error:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to load income report');
      setIncomeData([]);
      setExpenseData([]);
      setTotals({ income: 0, expense: 0, netProfitLoss: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    fetchIncomeReport();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const businessName = selectedBusiness?.business_name || selectedBusiness?.businessName || 'Business';

  const groupedIncome = incomeData;
  const groupedExpense = expenseData;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const name = fromDate === toDate ? `Income_Report_${fromDate}.pdf` : `Income_Report_${fromDate}_to_${toDate}.pdf`;
    pdf.save(name);
  };

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
              <linearGradient id="networkGradientIncome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path d="M100,100 L300,200 L600,150 L900,300 L1200,200" stroke="url(#networkGradientIncome)" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M200,400 L500,300 L800,450 L1100,350" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }} />
          </svg>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-white">Income Statement</h1>
              <button
                className="text-sm text-primary-600 hover:text-primary-800"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>

            <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
              {/* Date Range Selector */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>

              <div className="flex justify-right gap-2 px-6">
                <button onClick={handlePrint} className="no-print px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Print
                </button>
                <button onClick={handleSavePDF} className="no-print px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                  Save PDF
                </button>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Report Content */}
            {!loading && hasGenerated ? (
              <div id="printable-report" ref={reportRef} className="bg-white shadow sm:rounded-lg">
                {/* Header */}

                <div className="bg-white shadow sm:rounded-lg p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{businessName}</h2>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Income Statement</h3>
                  <p className="text-sm text-gray-600">
                    {fromDate === toDate
                      ? `Date: ${formatDate(fromDate)}`
                      : `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Generated on {currentDate}</p>
                </div>

                {/* Income Table */}
                <div className="bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Income</h3>
                  {groupedIncome.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th colSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">

                            </th>

                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Rs-(PKR)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {groupedIncome.map((ledger) => (
                            <tr key={`${ledger.ledger_id}`}>
                              <td colSpan="2" className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                                {ledger.ledger_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-gray-700">
                                {currency(Math.abs(ledger.balance))}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                            <td colSpan="2" className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                              Total Income
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {currency(Math.abs(totals.income))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No income data available for the selected date range.</p>
                  )}
                </div>

                {/* Expense Table */}
                <div className="bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense</h3>
                  {groupedExpense.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th colSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">

                            </th>

                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Rs-(PKR)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {groupedExpense.map((ledger) => (
                            <tr key={`${ledger.ledger_id}`}>
                              <td colSpan="2" className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                                {ledger.ledger_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-gray-700">
                                {currency(Math.abs(ledger.balance))}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                            <td colSpan="2" className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                              Total Expense
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {currency(Math.abs(totals.expense))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No expense data available for the selected date range.</p>
                  )}
                </div>

                {/* Net Profit/Loss */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                  <div className="flex justify-between items-center border-t-2 border-gray-400 pt-4">
                    <span className="text-lg font-bold text-gray-900">
                      {totals.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                    </span>
                    <span className={`text-lg font-bold ${totals.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currency(totals.netProfitLoss)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="bg-white shadow sm:rounded-lg p-6 text-center text-gray-500">
                  Select a date range and click "Generate Report".
                </div>
              )
            )}

            {loading && (
              <div className="bg-white shadow sm:rounded-lg p-6 text-center text-gray-500">
                Loading...
              </div>
            )}
            <style>{`
            @media print {
              .no-print, .relative.z-20, .absolute.inset-0, button, input { display: none !important; }
              body { visibility: hidden; background: white; }
              #printable-report { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; }
              #printable-report * { visibility: visible; }
              @page { margin: 10mm; }
            }
          `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeReport;
