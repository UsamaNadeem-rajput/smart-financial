import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const currency = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

// Helper to convert image URL to data URL using proxy endpoint (bypasses CORS for print/PDF)
async function getImageAsDataUrl(logoPath, backendUrl) {
  try {
    const filename = logoPath.split('/').pop();
    const proxyUrl = `${backendUrl}/api/business/logo-proxy/${filename}`;
    const response = await fetch(proxyUrl, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    return null;
  }
}


const IncomeReport = () => {
  const navigate = useNavigate();
  const { selectedBusiness, refreshTrigger } = useBusiness();
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

  // Range selection states
  const [rangeType, setRangeType] = useState(''); // 'date', 'month', or 'year'
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
    // Note: fromDate/toDate initialization removed - user selects range type first
  }, []);

  useEffect(() => {
    if (hasGenerated) {
      fetchIncomeReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchIncomeReport = async (computedFromDate, computedToDate) => {
    // Use passed parameters or fall back to state values
    const effectiveFromDate = computedFromDate || fromDate;
    const effectiveToDate = computedToDate || toDate;

    if (!selectedBusiness?.business_id) {
      setError('Please select a business');
      return;
    }

    if (!effectiveFromDate || !effectiveToDate) {
      setError('Please select a date range');
      return;
    }

    if (effectiveFromDate > effectiveToDate) {
      setError('From date must be before or equal to to date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('fromDate', effectiveFromDate);
      params.append('toDate', effectiveToDate);

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
    // Compute fromDate and toDate based on rangeType before generating
    if (rangeType === 'month') {
      if (!fromMonth || !toMonth) {
        setError('Please select both From Month and To Month');
        return;
      }
      // fromMonth/toMonth are in format YYYY-MM
      const [fromYear, fromM] = fromMonth.split('-').map(Number);
      const [toYear, toM] = toMonth.split('-').map(Number);
      // First day of fromMonth
      const computedFromDate = `${fromYear}-${String(fromM).padStart(2, '0')}-01`;
      // Last day of toMonth
      const lastDay = new Date(toYear, toM, 0).getDate();
      const computedToDate = `${toYear}-${String(toM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      setFromDate(computedFromDate);
      setToDate(computedToDate);
      // Delay fetch to allow state to update
      setTimeout(() => fetchIncomeReport(computedFromDate, computedToDate), 0);
    } else if (rangeType === 'year') {
      if (!selectedYear) {
        setError('Please select a year');
        return;
      }
      const computedFromDate = `${selectedYear}-01-01`;
      const computedToDate = `${selectedYear}-12-31`;
      setFromDate(computedFromDate);
      setToDate(computedToDate);
      setTimeout(() => fetchIncomeReport(computedFromDate, computedToDate), 0);
    } else if (rangeType === 'date') {
      if (!fromDate || !toDate) {
        setError('Please select both From Date and To Date');
        return;
      }
      fetchIncomeReport(fromDate, toDate);
    } else {
      setError('Please select a range type (Date, Month, or Year)');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatMonth = (monthStr) => {
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const businessName = selectedBusiness?.business_name || selectedBusiness?.businessName || 'Business';

  const groupedIncome = incomeData;
  const groupedExpense = expenseData;

  // Helper to get formatted range label based on rangeType
  const getFormattedRangeLabel = () => {
    if (rangeType === 'year') return `Year: ${selectedYear}`;
    if (rangeType === 'month') return `Month: ${formatMonth(fromMonth)} to ${formatMonth(toMonth)}`;
    if (rangeType === 'date') {
      return fromDate === toDate
        ? `Date: ${formatDate(fromDate)}`
        : `Date: ${formatDate(fromDate)} to ${formatDate(toDate)}`;
    }
    return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
  };

  const handlePrint = async () => {
    const printWindow = window.open("", "", "height=800,width=900");

    const logoPath = selectedBusiness?.logo_url;
    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, apiUrl);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Income Statement - ${businessName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
            .print-header { 
              display: flex; 
              align-items: center; 
              margin-bottom: 25px; 
              padding-bottom: 15px;
              border-bottom: 2px solid #4169e1;
            }
            .logo-container { 
              width: 80px; 
              height: 80px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              margin-right: 20px;
            }
            .logo { max-height: 70px; max-width: 70px; object-fit: contain; }
            .header-center { flex-grow: 1; text-align: center; }
            .business-name { font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 5px; }
            .report-title { font-size: 16px; color: #4169e1; font-weight: 600; }
            .date-range { font-size: 12px; color: #666; margin-top: 3px; }
            .header-right { text-align: right; font-size: 11px; color: #666; min-width: 100px; }
            .section { margin-top: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #1a1a2e; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #4169e1; color: #fff; padding: 10px 8px; text-align: left; font-size: 13px; }
            td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
            .total-row { background-color: #e8f0fe; font-weight: 600; }
            .grand-total { background-color: #4169e1; color: white; font-weight: bold; }
            .amount { text-align: right; }
            .net-profit { color: #16a34a; }
            .net-loss { color: #dc2626; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="logo-container">
              ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo" alt="Logo" id="printLogo" />` : '<div style="font-size: 24px; color: #4169e1; font-weight: bold;">SF</div>'}
            </div>
            <div class="header-center">
              <div class="business-name">${businessName}</div>
              <div class="report-title">Income Statement</div>
              <div class="date-range">${getFormattedRangeLabel()}</div>
            </div>
            <div class="header-right">
              <div>Printed on:</div>
              <div>${currentDate}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Income</div>
            <table>
              <thead><tr><th>Account</th><th class="amount">Amount (PKR)</th></tr></thead>
              <tbody>
                ${groupedIncome.map(ledger => `<tr><td>${ledger.ledger_name}</td><td class="amount">${currency(Math.abs(ledger.balance))}</td></tr>`).join('')}
                <tr class="total-row"><td><strong>Total Income</strong></td><td class="amount"><strong>${currency(Math.abs(totals.income))}</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Expenses</div>
            <table>
              <thead><tr><th>Account</th><th class="amount">Amount (PKR)</th></tr></thead>
              <tbody>
                ${groupedExpense.map(ledger => `<tr><td>${ledger.ledger_name}</td><td class="amount">${currency(Math.abs(ledger.balance))}</td></tr>`).join('')}
                <tr class="total-row"><td><strong>Total Expenses</strong></td><td class="amount"><strong>${currency(Math.abs(totals.expense))}</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <table>
              <tr class="grand-total ${totals.netProfitLoss >= 0 ? 'net-profit' : 'net-loss'}">
                <td style="background-color: ${totals.netProfitLoss >= 0 ? '#16a34a' : '#dc2626'}; color: white;"><strong>${totals.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}</strong></td>
                <td class="amount" style="background-color: ${totals.netProfitLoss >= 0 ? '#16a34a' : '#dc2626'}; color: white;"><strong>${currency(Math.abs(totals.netProfitLoss))}</strong></td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    if (logoDataUrl) {
      const img = printWindow.document.getElementById('printLogo');
      if (img) {
        await new Promise((resolve) => {
          if (img.complete) resolve();
          else { img.onload = resolve; img.onerror = resolve; }
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleSavePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    const logoPath = selectedBusiness?.logo_url;
    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, apiUrl);
    }

    // === HEADER SECTION ===
    const headerY = y;
    const logoWidth = 25;
    let logoHeight = 25;

    if (logoDataUrl) {
      try {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        logoHeight = (img.height * logoWidth) / img.width;
        doc.addImage(logoDataUrl, 'PNG', 10, headerY - 5, logoWidth, logoHeight);
      } catch (e) {
        doc.setFillColor(65, 105, 225);
        doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
      }
    } else {
      doc.setFillColor(65, 105, 225);
      doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(businessName, pageWidth / 2, headerY, { align: "center" });

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.setTextColor(65, 105, 225);
    doc.text("Income Statement", pageWidth / 2, headerY + 7, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(getFormattedRangeLabel(), pageWidth / 2, headerY + 13, { align: "center" });

    doc.setFontSize(8);
    doc.text(`Generated: ${currentDate}`, pageWidth - 10, headerY, { align: "right" });

    const lineY = Math.max(headerY + logoHeight, headerY + 18);
    doc.setDrawColor(65, 105, 225);
    doc.setLineWidth(0.5);
    doc.line(10, lineY, pageWidth - 10, lineY);
    y = lineY + 8;

    // === INCOME TABLE ===
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text("Income", 10, y);
    y += 3;

    const incomeRows = groupedIncome.map(l => [l.ledger_name, currency(Math.abs(l.balance))]);
    incomeRows.push([{ content: 'Total Income', styles: { fontStyle: 'bold', fillColor: [232, 240, 254] } }, { content: currency(Math.abs(totals.income)), styles: { fontStyle: 'bold', fillColor: [232, 240, 254], halign: 'right' } }]);

    autoTable(doc, {
      startY: y,
      head: [[
        { content: '', styles: { halign: 'left' } },
        { content: 'Amount (PKR)', styles: { halign: 'right' } }
      ]],
      body: incomeRows,
      headStyles: { fillColor: [65, 105, 225], textColor: 255 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 10, right: 10 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // === EXPENSE TABLE ===
    doc.setFont(undefined, "bold");
    doc.text("Expenses", 10, y);
    y += 3;

    const expenseRows = groupedExpense.map(l => [l.ledger_name, currency(Math.abs(l.balance))]);
    expenseRows.push([{ content: 'Total Expenses', styles: { fontStyle: 'bold', fillColor: [232, 240, 254] } }, { content: currency(Math.abs(totals.expense)), styles: { fontStyle: 'bold', fillColor: [232, 240, 254], halign: 'right' } }]);

    autoTable(doc, {
      startY: y,
      head: [[
        { content: '', styles: { halign: 'left' } },
        { content: 'Amount (PKR)', styles: { halign: 'right' } }
      ]],
      body: expenseRows,
      headStyles: { fillColor: [65, 105, 225], textColor: 255 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 10, right: 10 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // === NET PROFIT/LOSS ===
    const netColor = totals.netProfitLoss >= 0 ? [22, 163, 74] : [220, 38, 38];
    autoTable(doc, {
      startY: y,
      body: [[
        { content: totals.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss', styles: { fontStyle: 'bold', fillColor: netColor, textColor: 255 } },
        { content: currency(Math.abs(totals.netProfitLoss)), styles: { fontStyle: 'bold', fillColor: netColor, textColor: 255, halign: 'right' } }
      ]],
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 10, right: 10 },
    });

    const name = fromDate === toDate ? `Income_Statement_${fromDate}.pdf` : `Income_Statement_${fromDate}_to_${toDate}.pdf`;
    doc.save(name);
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
              {/* Range Type Radio Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Range Type
                </label>
                <div className="flex flex-wrap gap-6">
                  <label className="inline-flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="rangeType"
                      value="date"
                      checked={rangeType === 'date'}
                      onChange={(e) => setRangeType(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      📅 Date
                    </span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="rangeType"
                      value="month"
                      checked={rangeType === 'month'}
                      onChange={(e) => setRangeType(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      📆 Month
                    </span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="rangeType"
                      value="year"
                      checked={rangeType === 'year'}
                      onChange={(e) => setRangeType(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      📊 Year
                    </span>
                  </label>
                </div>
              </div>

              {/* Conditional Date/Month/Year Inputs */}
              {rangeType && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                  {/* Date Range Inputs */}
                  {rangeType === 'date' && (
                    <>
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
                    </>
                  )}

                  {/* Month Range Inputs */}
                  {rangeType === 'month' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Month
                        </label>
                        <input
                          type="month"
                          value={fromMonth}
                          onChange={(e) => setFromMonth(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          To Month
                        </label>
                        <input
                          type="month"
                          value={toMonth}
                          onChange={(e) => setToMonth(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Year Input */}
                  {rangeType === 'year' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">-- Select Year --</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              )}

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

                <div className="bg-white shadow sm:rounded-lg p-6 text-center relative">
                  {selectedBusiness?.logo_url && (
                    <div className="absolute top-6 left-6 hidden print:block">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${selectedBusiness.logo_url}`}
                        alt="Company Logo"
                        className="h-16 w-auto object-contain"
                        crossOrigin="anonymous" // Helpful for html2canvas
                      />
                    </div>
                  )}
                  {/* Also show for screen view if desired, but request says pdf/print. We can keep it simple or show always. 
                      Let's show it always in the header if it exists, styling it nicely. 
                  */}


                  <h2 className="text-xl font-bold text-gray-900 mb-2">{businessName}</h2>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Income Statement</h3>
                  <p className="text-sm text-gray-600">
                    {rangeType === 'year' && `Year: ${selectedYear}`}
                    {rangeType === 'month' && `Month: ${formatMonth(fromMonth)} to ${formatMonth(toMonth)}`}
                    {rangeType === 'date' && (fromDate === toDate
                      ? `Date: ${formatDate(fromDate)}`
                      : `Date: ${formatDate(fromDate)} to ${formatDate(toDate)}`)}
                    {!rangeType && `${formatMonth(fromMonth)} to ${formatMonth(toMonth)}`}
                  </p>

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
                <p className="text-sm text-gray-500 m-2 flex justify-end">Generated on {currentDate}</p>
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
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out forwards;
            }
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
