import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const currency = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

// HTML escape helper to prevent XSS in document.write templates
const escapeHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Validate that a data URL is a safe image data URL
const safeDataUrl = (url) => {
  if (!url || !url.startsWith('data:image/')) return null;
  return url;
};

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
  const [merchandisingData, setMerchandisingData] = useState({
    openingInventory: 0,
    closingInventory: 0,
    cogsData: [],
    totalPurchases: 0,
    calculatedCOGS: 0,
    grossProfit: 0,
  });
  const [currentDate, setCurrentDate] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const reportRef = useRef(null);

  // Range selection states
  const [rangeType, setRangeType] = useState('date'); // 'date', 'month', or 'year'
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Toggle for showing percentage of income
  const [showPercent, setShowPercent] = useState(true);

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    if (hasGenerated) {
      fetchIncomeReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchIncomeReport = async (computedFromDate, computedToDate) => {
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

      const { data } = await axios.get(
        `${apiUrl}/api/income-report/${selectedBusiness.business_id}?${params.toString()}`,
        { withCredentials: true }
      );

      setIncomeData(data.income || []);
      setExpenseData(data.expense || []);
      setTotals(data.totals || { income: 0, expense: 0, netProfitLoss: 0 });
      setMerchandisingData(
        data.merchandisingData || {
          openingInventory: 0,
          closingInventory: 0,
          cogsData: [],
          totalPurchases: 0,
          calculatedCOGS: 0,
          grossProfit: 0,
        }
      );
      setHasGenerated(true);
    } catch (e) {
      console.error('Income Report Error:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to load income report');
      setIncomeData([]);
      setExpenseData([]);
      setTotals({ income: 0, expense: 0, netProfitLoss: 0 });
      setMerchandisingData({
        openingInventory: 0,
        closingInventory: 0,
        cogsData: [],
        totalPurchases: 0,
        calculatedCOGS: 0,
        grossProfit: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (rangeType === 'month') {
      if (!fromMonth || !toMonth) {
        setError('Please select both From Month and To Month');
        return;
      }
      const [fromYear, fromM] = fromMonth.split('-').map(Number);
      const [toYear, toM] = toMonth.split('-').map(Number);
      const computedFromDate = `${fromYear}-${String(fromM).padStart(2, '0')}-01`;
      const lastDay = new Date(toYear, toM, 0).getDate();
      const computedToDate = `${toYear}-${String(toM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      setFromDate(computedFromDate);
      setToDate(computedToDate);
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-01T12:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const businessName =
    selectedBusiness?.business_name || selectedBusiness?.businessName || 'Business';

  const groupedIncome = incomeData;
  const groupedExpense = expenseData;

  const getFormattedRangeLabel = () => {
    if (rangeType === 'year') return `Year: ${selectedYear}`;
    if (rangeType === 'month') return `Month: ${formatMonth(fromMonth)} to ${formatMonth(toMonth)}`;
    if (rangeType === 'date') {
      return fromDate === toDate
        ? `Date: ${formatDate(fromDate)}`
        : `Date: ${formatDate(fromDate)} to ${formatDate(toDate)}`;
    }
    return fromDate && toDate ? `${formatDate(fromDate)} to ${formatDate(toDate)}` : '';
  };

  // Calculations for percentage and breakdown
  const totalIncome = Math.abs(totals.income || 0);
  const calcPercent = (val) =>
    totalIncome > 0
      ? `${((Math.abs(Number(val) || 0) / totalIncome) * 100).toFixed(1)}%`
      : '0.0%';
  const calcPercentRaw = (val) =>
    totalIncome > 0 ? (Math.abs(Number(val) || 0) / totalIncome) * 100 : 0;

  const netMargin = totalIncome > 0 ? ((totals.netProfitLoss / totalIncome) * 100).toFixed(1) : '0.0';

  // Slices for the stack bar flow chart
  const cogsAmount = Math.max(0, merchandisingData.calculatedCOGS || 0);
  const cogsPct = calcPercentRaw(cogsAmount);

  const expensePalette = ['#44544B', '#607267', '#8FA196', '#B7C6BC', '#DCE6D1', '#9BA89E'];
  const expSlices = (groupedExpense || []).map((exp, i) => {
    const amt = Math.abs(exp.balance || 0);
    return {
      name: exp.ledger_name,
      amount: amt,
      pct: calcPercentRaw(amt),
      color: expensePalette[i % expensePalette.length],
      textColor: i < 3 ? '#fff' : '#0E1A14',
    };
  });

  const netProfitAmount = totals.netProfitLoss;
  const netProfitPct = netProfitAmount > 0 ? calcPercentRaw(netProfitAmount) : 0;

  const stackItems = [];
  if (cogsAmount > 0) {
    stackItems.push({
      name: 'Cost of goods sold',
      amount: cogsAmount,
      pct: cogsPct,
      color: '#0E1A14',
      textColor: '#fff',
    });
  }
  expSlices.forEach((s) => {
    if (s.amount > 0) stackItems.push(s);
  });
  if (netProfitAmount > 0) {
    stackItems.push({
      name: 'Net profit',
      amount: netProfitAmount,
      pct: netProfitPct,
      color: '#C8F135',
      textColor: '#0E1A14',
    });
  }

  // Handle Print window
  const handlePrint = async () => {
    const printWindow = window.open('', '', 'height=800,width=900');

    if (!printWindow) {
      setError('Unable to open print window. Please allow popups for this site and try again.');
      return;
    }

    const logoPath = selectedBusiness?.logo_url;
    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, apiUrl);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Merchandising Income Statement - ${escapeHtml(businessName)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #0E1A14; }
            .print-header { 
              display: flex; 
              align-items: center; 
              margin-bottom: 25px; 
              padding-bottom: 15px;
              border-bottom: 2px solid #0E1A14;
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
            .business-name { font-size: 22px; font-weight: bold; color: #0E1A14; margin-bottom: 5px; }
            .report-title { font-size: 16px; color: #0E1A14; font-weight: 600; }
            .date-range { font-size: 12px; color: #666; margin-top: 3px; }
            .header-right { text-align: right; font-size: 11px; color: #666; min-width: 100px; }
            .section { margin-top: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #0E1A14; margin-bottom: 10px; border-bottom: 2px solid #0E1A14; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #0E1A14; color: #fff; padding: 10px 8px; text-align: left; font-size: 13px; }
            td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
            .total-row { background-color: #F2F5EE; font-weight: 700; border-top: 2px solid #0E1A14; }
            .amount { text-align: right; }
            .gross-box { margin-top: 15px; padding: 12px 16px; background: #E4EBDC; border: 2px solid #0E1A14; display: flex; justify-content: space-between; font-weight: bold; }
            .net-box { margin-top: 15px; padding: 14px 16px; border: 2px solid #0E1A14; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
            .net-box.profit { background: #C8F135; }
            .net-box.loss { background: #F2B66B; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="logo-container">
              ${safeDataUrl(logoDataUrl) ? `<img src="${safeDataUrl(logoDataUrl)}" class="logo" alt="Logo" id="printLogo" />` : '<div style="font-size: 24px; color: #0E1A14; font-weight: bold;">SF</div>'}
            </div>
            <div class="header-center">
              <div class="business-name">${escapeHtml(businessName)}</div>
              <div class="report-title">Merchandising Income Statement</div>
              <div class="date-range">${escapeHtml(getFormattedRangeLabel())}</div>
            </div>
            <div class="header-right">
              <div>Printed on:</div>
              <div>${escapeHtml(currentDate)}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">1. Income</div>
            <table>
              <thead><tr><th>Account</th><th class="amount">Percent</th><th class="amount">Amount (PKR)</th></tr></thead>
              <tbody>
                ${groupedIncome.map((ledger) => `<tr><td>${escapeHtml(ledger.ledger_name)}</td><td class="amount">${calcPercent(ledger.balance)}</td><td class="amount">${currency(Math.abs(ledger.balance))}</td></tr>`).join('')}
                <tr class="total-row"><td><strong>Total Income</strong></td><td class="amount"><strong>100.0%</strong></td><td class="amount"><strong>${currency(Math.abs(totals.income))}</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">2. Cost of Goods Sold</div>
            <table>
              <thead><tr><th>Account</th><th class="amount">Percent</th><th class="amount">Amount (PKR)</th></tr></thead>
              <tbody>
                <tr><td>Opening Inventory</td><td class="amount">${calcPercent(merchandisingData.openingInventory)}</td><td class="amount">${currency(merchandisingData.openingInventory)}</td></tr>
                ${merchandisingData.cogsData.map((ledger) => `<tr><td>${escapeHtml(ledger.ledger_name)}</td><td class="amount">${calcPercent(ledger.balance)}</td><td class="amount">${currency(Math.abs(ledger.balance))}</td></tr>`).join('')}
                <tr style="color: #dc2626;"><td>Less: Closing Inventory</td><td class="amount">(${calcPercent(merchandisingData.closingInventory)})</td><td class="amount">(${currency(merchandisingData.closingInventory)})</td></tr>
                <tr class="total-row"><td><strong>Cost of Goods Sold</strong></td><td class="amount"><strong>${calcPercent(merchandisingData.calculatedCOGS)}</strong></td><td class="amount"><strong>${currency(merchandisingData.calculatedCOGS)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="gross-box">
            <span>Gross Profit</span>
            <span>${currency(merchandisingData.grossProfit)}</span>
          </div>
          
          <div class="section">
            <div class="section-title">3. Operating Expenses</div>
            <table>
              <thead><tr><th>Account</th><th class="amount">Percent</th><th class="amount">Amount (PKR)</th></tr></thead>
              <tbody>
                ${groupedExpense.map((ledger) => `<tr><td>${escapeHtml(ledger.ledger_name)}</td><td class="amount">${calcPercent(ledger.balance)}</td><td class="amount">${currency(Math.abs(ledger.balance))}</td></tr>`).join('')}
                <tr class="total-row"><td><strong>Total Expenses</strong></td><td class="amount"><strong>${calcPercent(totals.expense)}</strong></td><td class="amount"><strong>${currency(Math.abs(totals.expense))}</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="net-box ${totals.netProfitLoss >= 0 ? 'profit' : 'loss'}">
            <span>${totals.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}</span>
            <span>${totals.netProfitLoss >= 0 ? currency(totals.netProfitLoss) : `(${currency(Math.abs(totals.netProfitLoss))})`}</span>
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
          else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    printWindow.focus();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
    printWindow.print();
  };

  // Handle Save as PDF
  const handleSavePDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const genDay = now.getDate();
    const genMon = shortMonths[now.getMonth()];
    const genYr = now.getFullYear();
    const genHrs = String(now.getHours()).padStart(2, '0');
    const genMins = String(now.getMinutes()).padStart(2, '0');
    const genDateTime = `${genDay} ${genMon} ${genYr}, ${genHrs}:${genMins}`;

    const reportTitle = 'Merchandising Income Statement';
    const periodText = getFormattedRangeLabel() || (fromDate && toDate ? `For the period ${fromDate} to ${toDate}` : '');

    // 1. Header (top of page 1)
    const logoPath = selectedBusiness?.logo_url;
    let logoDataUrl = null;
    if (logoPath) {
      try {
        logoDataUrl = await getImageAsDataUrl(logoPath, apiUrl);
      } catch (err) {
        console.error('Failed to load logo:', err);
      }
    }

    let logoDrawn = false;
    if (logoDataUrl) {
      try {
        const format =
          logoDataUrl.startsWith('data:image/jpeg') || logoDataUrl.startsWith('data:image/jpg')
            ? 'JPEG'
            : 'PNG';
        doc.addImage(logoDataUrl, format, 14, 14, 11, 11);
        logoDrawn = true;
      } catch (e) {
        console.error('Failed to draw logo:', e);
      }
    }

    if (!logoDrawn) {
      doc.setFillColor(26, 26, 26);
      doc.rect(14, 14, 11, 11, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('SF', 14 + 5.5, 14 + 7.8, { align: 'center' });
    }

    // Next to it, three lines (x = 28 mm)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 26, 26);
    doc.text(businessName, 28, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text(reportTitle, 28, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    doc.text(periodText, 28, 27.5);

    // Top right, right-aligned (x = 196 mm)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    doc.text('Smart Financial', 196, 18, { align: 'right' });
    doc.text(`Generated ${genDateTime}`, 196, 23, { align: 'right' });

    // 1 pt rule (0.35 mm) across 14 to 196 at y = 33
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.35);
    doc.line(14, 33, 196, 33);

    // 8 pt grey line under rule at y = 37
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(85, 85, 85);
    doc.text('Amounts in PKR. Figures in brackets are deductions.', 14, 37);

    // Build statement rows
    const tableRows = [];

    // --- 1. INCOME ---
    const incomeHeading = ['INCOME', '', ''];
    incomeHeading.rowType = 'section-heading';
    tableRows.push(incomeHeading);

    (groupedIncome || []).forEach((ledger) => {
      const row = [ledger.ledger_name, currency(Math.abs(ledger.balance)), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const totalIncomeRow = ['Total income', '', currency(Math.abs(totals.income))];
    totalIncomeRow.rowType = 'section-total';
    tableRows.push(totalIncomeRow);

    // --- 2. COST OF GOODS SOLD ---
    const cogsHeading = ['COST OF GOODS SOLD', '', ''];
    cogsHeading.rowType = 'section-heading';
    tableRows.push(cogsHeading);

    const openInvRow = ['Opening inventory', currency(merchandisingData.openingInventory), ''];
    openInvRow.rowType = 'line-item';
    tableRows.push(openInvRow);

    (merchandisingData.cogsData || []).forEach((ledger) => {
      const row = [ledger.ledger_name, currency(Math.abs(ledger.balance)), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const closeInvRow = ['Less: Closing inventory', `(${currency(merchandisingData.closingInventory)})`, ''];
    closeInvRow.rowType = 'line-item';
    tableRows.push(closeInvRow);

    const totalCogsRow = ['Cost of goods sold', '', currency(merchandisingData.calculatedCOGS)];
    totalCogsRow.rowType = 'section-total';
    tableRows.push(totalCogsRow);

    // --- GROSS PROFIT ---
    const grossProfitRow = ['Gross profit', '', currency(merchandisingData.grossProfit)];
    grossProfitRow.rowType = 'gross-profit';
    tableRows.push(grossProfitRow);

    // --- 3. OPERATING EXPENSES ---
    const expHeading = ['OPERATING EXPENSES', '', ''];
    expHeading.rowType = 'section-heading';
    tableRows.push(expHeading);

    (groupedExpense || []).forEach((ledger) => {
      const row = [ledger.ledger_name, currency(Math.abs(ledger.balance)), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const totalExpRow = ['Total operating expenses', '', currency(Math.abs(totals.expense))];
    totalExpRow.rowType = 'section-total';
    tableRows.push(totalExpRow);

    // --- NET PROFIT OR LOSS ---
    const isLoss = totals.netProfitLoss < 0;
    const netLabel = isLoss ? 'Net loss' : 'Net profit';
    const netValStr = isLoss
      ? `(${currency(Math.abs(totals.netProfitLoss))})`
      : currency(totals.netProfitLoss);

    const netProfitRow = [netLabel, '', netValStr];
    netProfitRow.rowType = 'net-profit';
    tableRows.push(netProfitRow);

    const drawFooter = (pageNum) => {
      doc.setDrawColor(212, 212, 212);
      doc.setLineWidth(0.18);
      doc.line(14, 281, 196, 281);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(85, 85, 85);
      const footerLeft = `${businessName}  |  Income Statement  |  ${periodText}`;
      doc.text(footerLeft, 14, 285);
      doc.text(`Page ${pageNum} of {total_pages_count_string}`, 196, 285, { align: 'right' });
      doc.text(`Generated by Smart Financial on ${genDateTime}`, 14, 289);
    };

    autoTable(doc, {
      startY: 41,
      margin: { left: 14, right: 14, top: 14, bottom: 22 },
      showHead: 'everyPage',
      theme: 'plain',
      head: [['', 'Amount (PKR)', 'Total (PKR)']],
      body: tableRows,
      columnStyles: {
        0: { cellWidth: 112, halign: 'left' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
      },
      headStyles: {
        fillColor: [237, 237, 237],
        textColor: [26, 26, 26],
        font: 'helvetica',
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: [26, 26, 26],
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowType = data.row.raw?.rowType;
          if (rowType === 'section-heading') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 9;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = { top: 5.0, bottom: 2.0, left: 0, right: 0 };
          } else if (rowType === 'line-item') {
            data.cell.styles.fontSize = 10;
            data.cell.styles.textColor = [26, 26, 26];
            if (data.column.index === 0) {
              data.cell.styles.cellPadding = { top: 1.5, bottom: 1.5, left: 5.0, right: 1.5 };
            }
          } else if (rowType === 'section-total') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = { top: 2.0, bottom: 2.0, left: 0, right: 1.5 };
          } else if (rowType === 'gross-profit') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10.5;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.fillColor = [237, 237, 237];
            data.cell.styles.cellPadding = { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 };
          } else if (rowType === 'net-profit') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 11.5;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = { top: 16.0, bottom: 2.5, left: 0, right: 1.5 };
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'head') {
          doc.setDrawColor(26, 26, 26);
          doc.setLineWidth(0.28); // 0.8 pt
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        } else if (data.section === 'body') {
          const rowType = data.row.raw?.rowType;
          if (rowType === 'section-heading') {
            if (data.column.index === 0) {
              // 0.6 pt rule below
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.21);
              doc.line(14, data.cell.y + data.cell.height, 196, data.cell.y + data.cell.height);
            }
          } else if (rowType === 'section-total') {
            if (data.column.index === 2) {
              // 0.5 pt rule above the amount only
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.18);
              doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
          } else if (rowType === 'gross-profit') {
            // 0.5 pt rule above and below across full width
            doc.setDrawColor(26, 26, 26);
            doc.setLineWidth(0.18);
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          } else if (rowType === 'net-profit') {
            if (data.column.index === 2) {
              // 0.8 pt rule above
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.28);
              doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);

              // double rule below (two 0.6 pt lines, 0.6 mm apart)
              doc.setLineWidth(0.21);
              const line1 = data.cell.y + data.cell.height;
              const line2 = line1 + 0.6;
              doc.line(data.cell.x, line1, data.cell.x + data.cell.width, line1);
              doc.line(data.cell.x, line2, data.cell.x + data.cell.width, line2);
            }
          }
        }
      },
      didDrawPage: (data) => {
        drawFooter(data.pageNumber);
      },
    });

    // 5. End of report
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 41;
    let blockStartY = finalY + 14;
    if (blockStartY + 28 > 281) {
      doc.addPage();
      drawFooter(doc.internal.getNumberOfPages());
      blockStartY = 24;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    const endText = 'End of report';
    const endTextWidth = doc.getTextWidth(endText);
    const centerX = 105;
    doc.text(endText, centerX, blockStartY, { align: 'center' });

    doc.setDrawColor(212, 212, 212);
    doc.setLineWidth(0.14); // hairline 0.4 pt
    const lineOffset = endTextWidth / 2 + 4;
    doc.line(14, blockStartY - 1, centerX - lineOffset, blockStartY - 1);
    doc.line(centerX + lineOffset, blockStartY - 1, 196, blockStartY - 1);

    // 18 mm below: three signature lines side by side
    const sigY = blockStartY + 18;
    doc.setDrawColor(212, 212, 212);
    doc.setLineWidth(0.18); // 0.5 pt
    doc.line(14, sigY, 58, sigY);
    doc.line(83, sigY, 127, sigY);
    doc.line(152, sigY, 196, sigY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    doc.text('Prepared by', 36, sigY + 4.5, { align: 'center' });
    doc.text('Reviewed by', 105, sigY + 4.5, { align: 'center' });
    doc.text('Approved by', 174, sigY + 4.5, { align: 'center' });

    doc.putTotalPages('{total_pages_count_string}');

    const name =
      fromDate === toDate
        ? `Income_Statement_${fromDate}.pdf`
        : `Income_Statement_${fromDate}_to_${toDate}.pdf`;
    doc.save(name);
  };

  return (
    <div className="sf-is-page">
      <Navbar />

      <main className="sf-is-wrap">
        {/* Breadcrumb Navigation */}
        <div className="sf-is-bc">
          <p className="sf-is-muted" style={{ fontSize: '15px', margin: 0 }}>
            <Link to="/trial-balance" style={{ textDecoration: 'none', color: '#44544B', borderBottom: '1px solid #0E1A14' }}>
              Reports
            </Link>{' '}
            / Income statement
          </p>
        </div>

        {/* Title and Subtitle */}
        <h1 className="sf-is-title">Income Statement.</h1>
        <p className="sf-is-desc">
          Did the business earn more than it spent? Pick a period and see where every rupee of income went.
        </p>

        {/* Filter and Controls Card */}
        <form
          className="sf-is-ctl"
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateReport();
          }}
        >
          <div className="sf-is-ctl-top">
            {/* Segmented Period Switcher */}
            <div className="sf-is-seg" role="group" aria-label="Period type">
              <button
                type="button"
                className={rangeType === 'date' ? 'cur' : ''}
                onClick={() => setRangeType('date')}
              >
                Date range
              </button>
              <button
                type="button"
                className={rangeType === 'month' ? 'cur' : ''}
                onClick={() => setRangeType('month')}
              >
                Month range
              </button>
              <button
                type="button"
                className={rangeType === 'year' ? 'cur' : ''}
                onClick={() => setRangeType('year')}
              >
                Year
              </button>
            </div>

            {/* Print and Save PDF Actions */}
            <div className="sf-is-sp">
              <button
                type="button"
                className="sf-is-btn sf-is-btn-out"
                onClick={handlePrint}
                disabled={loading || !hasGenerated}
              >
                Print
              </button>
              <button
                type="button"
                className="sf-is-btn sf-is-btn-ink"
                onClick={handleSavePDF}
                disabled={loading || !hasGenerated}
              >
                Save as PDF
              </button>
            </div>
          </div>

          {/* Date Range Inputs */}
          {rangeType === 'date' && (
            <div className="sf-is-fl">
              <div>
                <label className="sf-is-f-lbl" htmlFor="d1">
                  From date
                </label>
                <input
                  id="d1"
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="sf-is-f-lbl" htmlFor="d2">
                  To date
                </label>
                <input
                  id="d2"
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="sf-is-btn sf-is-btn-lime"
                style={{ minWidth: '170px' }}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate report'}
              </button>
            </div>
          )}

          {/* Month Range Inputs */}
          {rangeType === 'month' && (
            <div className="sf-is-fl">
              <div>
                <label className="sf-is-f-lbl" htmlFor="mm1">
                  From month
                </label>
                <input
                  id="mm1"
                  type="month"
                  value={fromMonth}
                  max={toMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                />
              </div>
              <div>
                <label className="sf-is-f-lbl" htmlFor="mm2">
                  To month
                </label>
                <input
                  id="mm2"
                  type="month"
                  value={toMonth}
                  min={fromMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="sf-is-btn sf-is-btn-lime"
                style={{ minWidth: '170px' }}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate report'}
              </button>
            </div>
          )}

          {/* Year Selection Input */}
          {rangeType === 'year' && (
            <div className="sf-is-fl">
              <div>
                <label className="sf-is-f-lbl" htmlFor="yy">
                  Year
                </label>
                <select
                  id="yy"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
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
              <button
                type="submit"
                className="sf-is-btn sf-is-btn-lime"
                style={{ minWidth: '170px' }}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate report'}
              </button>
            </div>
          )}
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="sf-is-err" role="alert">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="sf-is-loading-card" role="status" aria-live="polite">
            <div className="sf-is-spinner" />
            <p className="sf-is-loading-title">Calculating income statement...</p>
            <p className="sf-is-loading-desc">
              Fetching revenues, inventory valuation, purchases, and operating expenses.
            </p>
          </div>
        )}

        {/* Initial Prompt State */}
        {!loading && !hasGenerated && (
          <div className="sf-is-prompt-card">
            <p className="sf-is-prompt-title">Ready to generate statement</p>
            <p className="sf-is-prompt-desc">
              Pick a period type above and click "Generate report" to inspect revenue, cost of goods sold, and operating profit.
            </p>
          </div>
        )}

        {/* Generated Report Content */}
        {!loading && hasGenerated && (
          <div id="printable-report" ref={reportRef} style={{ marginTop: '28px' }}>
            {/* 1. Primary Outcome Badge */}
            {totals.netProfitLoss >= 0 ? (
              <div className="sf-is-res" role="status">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '17px', margin: 0 }}>Net profit ▲</p>
                  <p className="sf-is-big">{currency(totals.netProfitLoss)}</p>
                </div>
                <p style={{ maxWidth: '420px', fontSize: '17px', margin: 0, lineHeight: 1.4 }}>
                  The business earned more than it spent {getFormattedRangeLabel() ? `in ${getFormattedRangeLabel()}` : ''}, keeping{' '}
                  <strong>{netMargin}%</strong> of its income.
                </p>
              </div>
            ) : (
              <div className="sf-is-res loss" role="status">
                <div>
                  <p style={{ fontWeight: 600, fontSize: '17px', margin: 0 }}>Net loss ▼</p>
                  <p className="sf-is-big">({currency(Math.abs(totals.netProfitLoss))})</p>
                </div>
                <p style={{ maxWidth: '420px', fontSize: '17px', margin: 0, lineHeight: 1.4 }}>
                  Operating expenses of {currency(Math.abs(totals.expense))} were higher than gross profit of{' '}
                  {currency(merchandisingData.grossProfit)} in this period.
                </p>
              </div>
            )}

            {/* 2. Income Allocation Stack Flow Bar */}
            {totalIncome > 0 && stackItems.length > 0 && (
              <div className="sf-is-flow">
                <p className="sf-is-cap">
                  Where each rupee of income went. Total income {currency(totalIncome)} = 100%
                </p>
                <div
                  className="sf-is-stk"
                  role="img"
                  aria-label="Income allocation breakdown"
                >
                  {stackItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: Math.max(item.pct, 0.5),
                        background: item.color,
                        color: item.textColor,
                      }}
                      title={`${item.name} ${currency(item.amount)} (${item.pct.toFixed(1)}%)`}
                    >
                      {item.pct >= 10
                        ? item.name === 'Net profit'
                          ? `Net profit ${item.pct.toFixed(0)}%`
                          : `${item.pct.toFixed(0)}%`
                        : item.pct >= 5
                        ? `${item.pct.toFixed(0)}%`
                        : ''}
                    </div>
                  ))}
                </div>
                <div className="sf-is-lg">
                  {stackItems.map((item, idx) => (
                    <span key={idx}>
                      <i style={{ background: item.color }} />
                      {item.name} {currency(item.amount)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Formal Income Statement Sheet */}
            <div className="sf-is-sheet">
              {/* Report Header */}
              <div className="sf-is-rh">
                <p className="sf-is-rh-biz">{businessName}</p>
                <p className="sf-is-rh-sub">Merchandising Income Statement</p>
                <p className="sf-is-muted" style={{ marginTop: '4px', fontSize: '16px' }}>
                  {getFormattedRangeLabel() || `Generated on ${currentDate}`}
                </p>
              </div>

              {/* Toolbar with Percentage Toggle Switch */}
              <div className="sf-is-tools">
                <label className="sf-is-sw">
                  <input
                    type="checkbox"
                    checked={showPercent}
                    onChange={(e) => setShowPercent(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <i className={showPercent ? 'checked' : ''} />
                  Show percent of income
                </label>
                <p className="sf-is-muted" style={{ fontSize: '14px', maxWidth: '520px', textAlign: 'right', margin: 0 }}>
                  Figures in PKR. Closing inventory is deducted, so it appears in brackets.
                </p>
              </div>

              {/* Section 1: Income */}
              <section className="sf-is-sc">
                <h2>1. Income</h2>
                <table>
                  <caption className="sf-is-sr">Income breakdown</caption>
                  <thead>
                    <tr className="sf-is-sr">
                      <th scope="col">Line</th>
                      {showPercent && <th scope="col">Percent of income</th>}
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedIncome.length > 0 ? (
                      groupedIncome.map((ledger) => (
                        <tr key={`inc-${ledger.ledger_id}`}>
                          <td className="ln">
                            <span>{ledger.ledger_name}</span>
                          </td>
                          {showPercent && (
                            <td className="n pc">{calcPercent(ledger.balance)}</td>
                          )}
                          <td className="n">{currency(Math.abs(ledger.balance))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={showPercent ? 3 : 2} style={{ color: '#666', padding: '14px 10px' }}>
                          No income items recorded for this period.
                        </td>
                      </tr>
                    )}
                    <tr className="tt">
                      <th scope="row">Total income</th>
                      {showPercent && <td className="n pc">100.0%</td>}
                      <td className="n">{currency(Math.abs(totals.income))}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Section 2: Cost of goods sold */}
              <section className="sf-is-sc">
                <h2>2. Cost of goods sold</h2>
                <table>
                  <caption className="sf-is-sr">Cost of goods sold breakdown</caption>
                  <thead>
                    <tr className="sf-is-sr">
                      <th scope="col">Line</th>
                      {showPercent && <th scope="col">Percent of income</th>}
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ln">
                        <span>Opening inventory</span>
                      </td>
                      {showPercent && (
                        <td className="n pc">{calcPercent(merchandisingData.openingInventory)}</td>
                      )}
                      <td className="n">{currency(merchandisingData.openingInventory)}</td>
                    </tr>
                    {merchandisingData.cogsData &&
                      merchandisingData.cogsData.map((ledger) => (
                        <tr key={`cogs-${ledger.ledger_id}`}>
                          <td className="ln">
                            <span>Add: {ledger.ledger_name}</span>
                          </td>
                          {showPercent && (
                            <td className="n pc">{calcPercent(ledger.balance)}</td>
                          )}
                          <td className="n">{currency(Math.abs(ledger.balance))}</td>
                        </tr>
                      ))}
                    <tr>
                      <td className="ln" style={{ color: '#dc2626' }}>
                        <span>Less: Closing inventory</span>
                      </td>
                      {showPercent && (
                        <td className="n pc" style={{ color: '#dc2626' }}>
                          ({calcPercent(merchandisingData.closingInventory)})
                        </td>
                      )}
                      <td className="n" style={{ color: '#dc2626' }}>
                        ({currency(merchandisingData.closingInventory)})
                      </td>
                    </tr>
                    <tr className="tt">
                      <th scope="row">Cost of goods sold</th>
                      {showPercent && (
                        <td className="n pc">{calcPercent(merchandisingData.calculatedCOGS)}</td>
                      )}
                      <td className="n">{currency(merchandisingData.calculatedCOGS)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Gross Profit Bar */}
              <div className="sf-is-bar sf-is-bar-g">
                <span>
                  Gross profit
                  <small>Total income minus cost of goods sold</small>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {showPercent && (
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#44544B' }}>
                      {calcPercent(merchandisingData.grossProfit)}
                    </span>
                  )}
                  {currency(merchandisingData.grossProfit)}
                </span>
              </div>

              {/* Section 3: Operating expenses */}
              <section className="sf-is-sc">
                <h2>3. Operating expenses</h2>
                <table>
                  <caption className="sf-is-sr">Operating expenses breakdown</caption>
                  <thead>
                    <tr className="sf-is-sr">
                      <th scope="col">Line</th>
                      {showPercent && <th scope="col">Percent of income</th>}
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedExpense.length > 0 ? (
                      groupedExpense.map((ledger) => (
                        <tr key={`exp-${ledger.ledger_id}`}>
                          <td className="ln">
                            <span>{ledger.ledger_name}</span>
                          </td>
                          {showPercent && (
                            <td className="n pc">{calcPercent(ledger.balance)}</td>
                          )}
                          <td className="n">{currency(Math.abs(ledger.balance))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={showPercent ? 3 : 2} style={{ color: '#666', padding: '14px 10px' }}>
                          No operating expenses recorded for this period.
                        </td>
                      </tr>
                    )}
                    <tr className="tt">
                      <th scope="row">Total operating expenses</th>
                      {showPercent && (
                        <td className="n pc">{calcPercent(totals.expense)}</td>
                      )}
                      <td className="n">{currency(Math.abs(totals.expense))}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Net Profit / Net Loss Bar */}
              <div className={`sf-is-bar sf-is-bar-p ${totals.netProfitLoss < 0 ? 'loss' : ''}`}>
                <span>
                  {totals.netProfitLoss >= 0 ? 'Net profit' : 'Net loss'}
                  <small>Gross profit minus operating expenses</small>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {showPercent && (
                    <span style={{ fontSize: '20px', fontWeight: 600, color: '#0E1A14' }}>
                      {calcPercent(totals.netProfitLoss)}
                    </span>
                  )}
                  {totals.netProfitLoss >= 0
                    ? currency(totals.netProfitLoss)
                    : `(${currency(Math.abs(totals.netProfitLoss))})`}
                </span>
              </div>
            </div>

            {/* How COGS is Calculated Accordion */}
            <details className="sf-is-how">
              <summary>How cost of goods sold is calculated</summary>
              <div>
                <p>
                  <b>If you use a Cost of Goods Sold account,</b> its balance is used as it is.
                </p>
                <p style={{ marginTop: '8px' }}>
                  <b>Otherwise</b> it is worked out for the period: opening inventory + purchases − closing inventory.
                  Here:{' '}
                  <strong>{currency(merchandisingData.openingInventory)}</strong> +{' '}
                  <strong>{currency(merchandisingData.totalPurchases || 0)}</strong> −{' '}
                  <strong>{currency(merchandisingData.closingInventory)}</strong> ={' '}
                  <strong>{currency(merchandisingData.calculatedCOGS)}</strong>.
                </p>
              </div>
            </details>

            <p style={{ fontSize: '13px', color: '#666', textAlign: 'right', marginTop: '20px' }}>
              Generated on {currentDate}
            </p>
          </div>
        )}
      </main>

      {/* Scoped CSS Styles from Stitch Design System */}
      <style>{`
        .sf-is-page {
          background: #F2F5EE;
          min-height: 100vh;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          color: #0E1A14;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
        }

        .sf-is-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 32px 80px;
          box-sizing: border-box;
        }

        .sf-is-muted {
          color: #44544B;
        }

        .sf-is-sr {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .sf-is-bc {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .sf-is-back-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-weight: 600;
          font-size: 15px;
          color: #0E1A14;
          border-bottom: 2px solid #0E1A14;
          cursor: pointer;
          transition: color 0.15s;
        }
        .sf-is-back-btn:hover {
          color: #2F3E34;
        }

        .sf-is-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: clamp(44px, 6vw, 76px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.98;
          margin-top: 14px;
          margin-bottom: 0;
          color: #0E1A14;
        }

        .sf-is-desc {
          color: #44544B;
          font-size: 20px;
          margin-top: 16px;
          max-width: 760px;
          line-height: 1.5;
        }

        /* Controls Card */
        .sf-is-ctl {
          margin-top: 28px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 22px 24px;
        }

        .sf-is-ctl-top {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
        }

        .sf-is-seg {
          display: inline-flex;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
        }

        .sf-is-seg button {
          padding: 10px 20px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          background: #fff;
          color: #0E1A14;
          border: none;
          font-family: inherit;
          transition: background 0.15s, color 0.15s;
        }
        .sf-is-seg button + button {
          border-left: 2px solid #0E1A14;
        }
        .sf-is-seg button:hover {
          background: #E4EBDC;
        }
        .sf-is-seg button.cur {
          background: #0E1A14;
          color: #F2F5EE;
        }

        .sf-is-sp {
          margin-left: auto;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sf-is-fl {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #E5EBDF;
        }

        .sf-is-f-lbl {
          display: block;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
          color: #0E1A14;
        }

        .sf-is-fl input,
        .sf-is-fl select {
          min-height: 50px;
          padding: 0 14px;
          font-size: 16px;
          font-family: inherit;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          color: #0E1A14;
          outline: none;
        }
        .sf-is-fl input:focus,
        .sf-is-fl select:focus {
          outline: 3px solid #0E1A14;
          outline-offset: 2px;
        }

        .sf-is-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          padding: 0 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          border: 2px solid #0E1A14;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          transition: transform 0.15s ease-out, background 0.15s, box-shadow 0.15s;
        }
        .sf-is-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .sf-is-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .sf-is-btn-lime {
          background: #C8F135;
          color: #0E1A14;
        }
        .sf-is-btn-ink {
          background: #0E1A14;
          color: #F2F5EE;
        }
        .sf-is-btn-out {
          background: #fff;
          color: #0E1A14;
        }
        .sf-is-btn-out:hover:not(:disabled) {
          background: #E4EBDC;
        }

        /* Error Banner */
        .sf-is-err {
          margin-top: 20px;
          padding: 16px 20px;
          background: #FEE2E2;
          border: 2px solid #DC2626;
          border-radius: 6px;
          color: #991B1B;
          font-weight: 600;
          font-size: 15px;
        }

        /* Loading Card */
        .sf-is-loading-card {
          margin-top: 28px;
          padding: 48px 24px;
          text-align: center;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          box-shadow: 3px 3px 0 #0E1A14;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .sf-is-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #E2E8F0;
          border-top-color: #0E1A14;
          border-radius: 50%;
          animation: sf-spin 0.7s linear infinite;
        }
        .sf-is-loading-title {
          margin: 0;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: #0E1A14;
        }
        .sf-is-loading-desc {
          margin: 0;
          font-size: 14px;
          color: #44544B;
        }

        /* Initial Prompt Card */
        .sf-is-prompt-card {
          margin-top: 28px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 48px 24px;
          text-align: center;
        }
        .sf-is-prompt-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0E1A14;
          margin: 0;
        }
        .sf-is-prompt-desc {
          color: #44544B;
          font-size: 16px;
          margin-top: 8px;
          margin-bottom: 0;
        }

        /* Outcome Badge */
        .sf-is-res {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 26px 30px;
          background: #C8F135;
          border: 2px solid #0E1A14;
          border-radius: 6px;
        }
        .sf-is-res.loss {
          background: #F2B66B;
        }
        .sf-is-big {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: clamp(38px, 5vw, 60px);
          letter-spacing: -0.04em;
          line-height: 1;
          margin-top: 6px;
          margin-bottom: 0;
          color: #0E1A14;
        }

        /* Flow Stack Bar */
        .sf-is-flow {
          margin-top: 32px;
        }
        .sf-is-cap {
          font-size: 13px;
          font-weight: 600;
          color: #44544B;
          margin-bottom: 10px;
        }
        .sf-is-stk {
          display: flex;
          height: 64px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
        }
        .sf-is-stk div {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          transition: filter 0.15s;
        }
        .sf-is-stk div:hover {
          filter: brightness(1.12);
        }
        .sf-is-stk div + div {
          border-left: 2px solid #0E1A14;
        }

        .sf-is-lg {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 28px;
          margin-top: 14px;
          font-size: 15px;
        }
        .sf-is-lg span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sf-is-lg i {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #0E1A14;
          border-radius: 3px;
        }

        /* Statement Sheet */
        .sf-is-sheet {
          margin-top: 36px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 40px 44px;
        }
        .sf-is-rh {
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 2px solid #0E1A14;
        }
        .sf-is-rh-biz {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 38px;
          letter-spacing: -0.03em;
          margin: 0;
          color: #0E1A14;
        }
        .sf-is-rh-sub {
          font-size: 22px;
          font-weight: 600;
          margin-top: 6px;
          margin-bottom: 0;
          color: #0E1A14;
        }

        .sf-is-tools {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 18px 0;
        }

        .sf-is-sw {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          user-select: none;
        }
        .sf-is-sw i {
          position: relative;
          width: 46px;
          height: 26px;
          border: 2px solid #0E1A14;
          border-radius: 999px;
          background: #fff;
          transition: background 0.15s;
          display: inline-block;
        }
        .sf-is-sw i::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0E1A14;
          transition: transform 0.15s ease-out;
        }
        .sf-is-sw i.checked {
          background: #C8F135;
        }
        .sf-is-sw i.checked::after {
          transform: translateX(20px);
        }

        /* Sections and Tables */
        .sf-is-sc {
          margin-top: 24px;
        }
        .sf-is-sc h2 {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 24px;
          font-weight: 800;
          padding: 0 4px 8px;
          border-bottom: 2px solid #0E1A14;
          margin: 0;
          color: #0E1A14;
        }
        .sf-is-sc table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-top: 4px;
        }
        .sf-is-sc td,
        .sf-is-sc th {
          padding: 11px 10px;
          font-size: 17px;
          text-align: left;
          font-weight: 400;
          border-bottom: 1px solid #E5EBDF;
        }
        .sf-is-sc td.n {
          text-align: right;
          width: 170px;
          font-weight: 500;
        }
        .sf-is-sc td.pc {
          width: 110px;
          color: #44544B;
          font-size: 15px;
          text-align: right;
        }
        .sf-is-sc td.ln span {
          padding-left: 24px;
        }
        .sf-is-sc tr:not(.tt):hover td {
          background: #C8F135;
        }
        .sf-is-sc tr:hover td.pc {
          color: #0E1A14;
        }
        .sf-is-sc tr.tt th,
        .sf-is-sc tr.tt td {
          border-top: 2px solid #0E1A14;
          border-bottom: 0;
          font-weight: 700;
          padding-top: 13px;
        }

        /* Profit Bars */
        .sf-is-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 22px;
          padding: 18px 22px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 28px;
          letter-spacing: -0.03em;
        }
        .sf-is-bar small {
          display: block;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0;
          margin-top: 2px;
          color: #44544B;
        }
        .sf-is-bar-g {
          background: #E4EBDC;
        }
        .sf-is-bar-p {
          background: #C8F135;
          border-width: 3px;
          font-size: 34px;
        }
        .sf-is-bar-p.loss {
          background: #F2B66B;
        }

        /* Details How-box */
        .sf-is-how {
          margin-top: 28px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          max-width: 900px;
        }
        .sf-is-how summary {
          cursor: pointer;
          padding: 16px 20px;
          font-weight: 600;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          user-select: none;
        }
        .sf-is-how summary::-webkit-details-marker {
          display: none;
        }
        .sf-is-how summary::after {
          content: "+";
          font-size: 22px;
          font-weight: 500;
        }
        .sf-is-how[open] summary::after {
          content: "−";
        }
        .sf-is-how div {
          padding: 0 20px 20px;
          font-size: 16px;
          color: #44544B;
          line-height: 1.5;
        }
        .sf-is-how b,
        .sf-is-how strong {
          color: #0E1A14;
        }

        @keyframes sf-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .sf-is-wrap {
            padding: 24px 16px;
          }
          .sf-is-sheet {
            padding: 24px 16px;
          }
          .sf-is-sc td.n {
            width: 110px;
          }
          .sf-is-sc td.pc {
            width: 70px;
          }
          .sf-is-bar {
            font-size: 22px;
          }
          .sf-is-bar-p {
            font-size: 26px;
          }
          .sf-is-sp {
            margin-left: 0;
          }
        }

        @media print {
          .sf-is-page {
            background: white !important;
          }
          .sf-is-ctl,
          .sf-is-bc,
          .sf-is-sp,
          .sf-is-tools,
          .sf-is-how,
          header {
            display: none !important;
          }
          .sf-is-sheet {
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IncomeReport;
