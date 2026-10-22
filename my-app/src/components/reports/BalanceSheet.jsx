import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';

// Helper to convert image URL to data URL using proxy endpoint
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

// Number formatter matching Stitch brutalist tabular standards (e.g., 27,400.00)
const formatNumber = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

const BalanceSheet = () => {
  const { selectedBusiness, refreshTrigger } = useBusiness();
  const navigate = useNavigate();

  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [layoutMode, setLayoutMode] = useState('side-by-side'); // 'side-by-side' or 'stacked'
  const [data, setData] = useState({ assets: [], liabilities: [], equity: [], totals: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!selectedBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet/${selectedBusiness.business_id}`,
        {
          params: { targetDate },
          withCredentials: true,
        }
      );
      setData(res.data || { assets: [], liabilities: [], equity: [], totals: {} });
    } catch (err) {
      console.error('Error fetching balance sheet:', err);
      setError('Failed to load balance sheet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBusiness, targetDate, refreshTrigger]);

  // Format Currency for PDF (retaining existing exact implementation)
  const currency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Original PDF Download Function (preserved without logic alteration)
  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const genDay = now.getDate();
    const genMon = shortMonths[now.getMonth()];
    const genYr = now.getFullYear();
    const genHrs = String(now.getHours()).padStart(2, '0');
    const genMins = String(now.getMinutes()).padStart(2, '0');
    const genDateTime = `${genDay} ${genMon} ${genYr}, ${genHrs}:${genMins}`;

    const businessName = selectedBusiness?.business_name || 'Business Name';
    const dateText = formattedDate ? `As of ${formattedDate}` : `As of ${targetDate}`;

    const formatPdfAmount = (val) =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(val || 0));

    // 1. Header (top of page 1)
    const logoPath = selectedBusiness?.logo_url;
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
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
    doc.text('Balance Sheet', 28, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    doc.text(dateText, 28, 27.5);

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
    doc.text('Amounts in PKR.', 14, 37);

    // Build statement rows
    const tableRows = [];

    // --- 1. ASSETS ---
    const assetsHeading = ['ASSETS', '', ''];
    assetsHeading.rowType = 'section-heading';
    tableRows.push(assetsHeading);

    (data.assets || []).forEach((item) => {
      const row = [item.name, formatPdfAmount(item.balance), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const totalAssetsRow = ['Total assets', '', formatPdfAmount(totalAssets)];
    totalAssetsRow.rowType = 'total-assets';
    tableRows.push(totalAssetsRow);

    // --- 2. LIABILITIES ---
    const liabHeading = ['LIABILITIES', '', ''];
    liabHeading.rowType = 'section-heading';
    tableRows.push(liabHeading);

    (data.liabilities || []).forEach((item) => {
      const row = [item.name, formatPdfAmount(item.balance), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const totalLiabRow = ['Total liabilities', '', formatPdfAmount(totalLiabilities)];
    totalLiabRow.rowType = 'section-total';
    tableRows.push(totalLiabRow);

    // --- 3. CAPITAL ---
    const capHeading = ['CAPITAL', '', ''];
    capHeading.rowType = 'section-heading';
    tableRows.push(capHeading);

    // In the PDF only, do not print a Net Profit or Net Loss line.
    // Keep the Total capital figure exactly as the code computes it.
    const capitalPdfAccounts = (data.equity || []).filter(
      (e) => !e.name.includes('Net Profit') && !e.name.includes('Net Loss')
    );

    capitalPdfAccounts.forEach((item) => {
      const row = [item.name, formatPdfAmount(item.balance), ''];
      row.rowType = 'line-item';
      tableRows.push(row);
    });

    const totalCapRow = ['Total capital', '', formatPdfAmount(totalEquity)];
    totalCapRow.rowType = 'section-total';
    tableRows.push(totalCapRow);

    // --- 4. TOTAL LIABILITIES AND CAPITAL ---
    const totalLiabCapRow = ['Total liabilities and capital', '', formatPdfAmount(totalLiabilitiesEquity)];
    totalLiabCapRow.rowType = 'total-liab-capital';
    tableRows.push(totalLiabCapRow);

    const drawFooter = (pageNum) => {
      doc.setDrawColor(212, 212, 212);
      doc.setLineWidth(0.18); // 0.5 pt rule
      doc.line(14, 281, 196, 281);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(85, 85, 85);
      const footerLeft = `${businessName}  |  Balance Sheet  |  ${dateText}`;
      doc.text(footerLeft, 14, 285);
      doc.text(`Page ${pageNum} of {total_pages_count_string}`, 196, 285, { align: 'right' });
      doc.text(`Generated by Smart Financial on ${genDateTime}`, 14, 289);
    };

    autoTable(doc, {
      startY: 41,
      margin: { left: 14, right: 14, top: 14, bottom: 22 },
      showHead: 'everyPage',
      theme: 'plain',
      head: [
        [
          '',
          { content: 'Amount (PKR)', styles: { halign: 'right' } },
          { content: 'Total (PKR)', styles: { halign: 'right' } },
        ],
      ],
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
        if (data.section === 'head' && (data.column.index === 1 || data.column.index === 2)) {
          data.cell.styles.halign = 'right';
        }
        if (data.section === 'body') {
          const rowType = data.row.raw?.rowType;
          if (rowType === 'section-heading') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 9;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = { top: 4.9, bottom: 2.0, left: 0, right: 0 };
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
          } else if (rowType === 'total-assets') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = { top: 2.0, bottom: 2.5, left: 0, right: 1.5 };
          } else if (rowType === 'total-liab-capital') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10.5;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.fillColor = [237, 237, 237];
            data.cell.styles.cellPadding = { top: 2.5, bottom: 5.5, left: 1.5, right: 1.5 };
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
          } else if (rowType === 'total-assets') {
            if (data.column.index === 2) {
              // 0.5 pt rule above the amount
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.18);
              doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);

              // double rule below (two 0.6 pt lines, 0.6 mm apart)
              doc.setLineWidth(0.21);
              const line1 = data.cell.y + data.cell.height;
              const line2 = line1 + 0.6;
              doc.line(data.cell.x, line1, data.cell.x + data.cell.width, line1);
              doc.line(data.cell.x, line2, data.cell.x + data.cell.width, line2);
            }
          } else if (rowType === 'total-liab-capital') {
            // 0.5 pt rule above across full width
            doc.setDrawColor(26, 26, 26);
            doc.setLineWidth(0.18);
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);

            if (data.column.index === 2) {
              // double rule below (two 0.6 pt lines, 0.6 mm apart)
              doc.setLineWidth(0.21);
              const line1 = data.cell.y + data.cell.height;
              const line2 = line1 + 0.6;
              doc.line(data.cell.x, line1, data.cell.x + data.cell.width, line1);
              doc.line(data.cell.x, line2, data.cell.x + data.cell.width, line2);
            }

            if (data.column.index === 0) {
              // Confirmation text in 8.5 pt grey italic under the label
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8.5);
              doc.setTextColor(85, 85, 85);
              doc.text('Matched against assets', data.cell.x + 1.5, data.cell.y + data.cell.height - 1.8);
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
    let blockStartY = finalY + 16;
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

    doc.save(`Balance_Sheet_${targetDate}.pdf`);
  };

  // Calculations & Percentages
  const totalAssets = Number(data.totals?.total_assets || 0);
  const totalLiabilities = (data.liabilities || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0
  );
  const totalEquity = (data.equity || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0
  );
  const totalLiabilitiesEquity = Number(
    data.totals?.total_liabilities_equity != null
      ? data.totals.total_liabilities_equity
      : totalLiabilities + totalEquity
  );

  const diff = Math.abs(totalAssets - totalLiabilitiesEquity);
  const isBalanced = diff < 0.01;

  // Percentage logic for funding
  const liabilitiesPct =
    totalLiabilitiesEquity > 0
      ? ((totalLiabilities / totalLiabilitiesEquity) * 100).toFixed(1)
      : '0.0';
  const equityPct =
    totalLiabilitiesEquity > 0
      ? ((totalEquity / totalLiabilitiesEquity) * 100).toFixed(1)
      : '0.0';

  // Proportional bar sizing
  const maxBarTotal = Math.max(totalAssets, totalLiabilitiesEquity, 1);
  const assetsBarWidth =
    totalAssets > 0 ? Math.min(100, (totalAssets / maxBarTotal) * 100) : 0;
  const fundingBarWidth =
    totalLiabilitiesEquity > 0 ? Math.min(100, (totalLiabilitiesEquity / maxBarTotal) * 100) : 0;

  // Capital Accounts (preserving filter for zero-balance Net Profit/Loss if present)
  const capitalAccounts = (data.equity || []).filter((item) => {
    if (
      (item.name.includes('Net Profit') || item.name.includes('Net Loss')) &&
      Number(item.balance) === 0
    ) {
      return false;
    }
    return true;
  });

  // Date formatted for formal header
  const formattedDate = targetDate
    ? new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (!selectedBusiness) {
    return (
      <div className="sf-bs-page">
        <Navbar />
        <main className="sf-bs-wrap" style={{ paddingTop: '80px', textAlign: 'center' }}>
          <div
            style={{
              background: '#fff',
              border: '2px solid #0E1A14',
              borderRadius: '6px',
              padding: '48px 24px',
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: '4px 4px 0 #0E1A14',
            }}
          >
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: '32px',
                color: '#0E1A14',
                margin: 0,
              }}
            >
              No business selected
            </h2>
            <p style={{ color: '#44544B', marginTop: '12px', fontSize: '17px' }}>
              Please select a business from the businesses directory to view its Balance Sheet.
            </p>
            <Link
              to="/list"
              className="sf-bs-btn sf-bs-lime"
              style={{ marginTop: '24px', display: 'inline-flex' }}
            >
              Select a Business →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sf-bs-page">
      <Navbar />

      <main className="sf-bs-wrap" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Breadcrumb & Back to Reports */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p className="sf-bs-muted" style={{ fontSize: '15px', margin: 0 }}>
            <Link
              to="/trial-balance"
              style={{
                textDecoration: 'none',
                color: '#44544B',
                borderBottom: '1px solid #0E1A14',
              }}
            >
              Reports
            </Link>{' '}
            / Balance sheet
          </p>
        </div>

        {/* Title and Subtitle */}
        <h1 className="sf-bs-title">Balance Sheet.</h1>
        <p className="sf-bs-muted" style={{ fontSize: '20px', marginTop: '16px', maxWidth: '780px', lineHeight: 1.5 }}>
          A photo of the business on one day: what it owns, what it owes, and what is left for the owner.
        </p>

        {/* Controls Form */}
        <form className="sf-bs-ctl" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="sf-bs-lbl" htmlFor="asOfDate">
              As of date
            </label>
            <input
              id="asOfDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="sf-bs-date-input"
            />
          </div>
          <p className="sf-bs-muted" style={{ fontSize: '14px', maxWidth: '300px', paddingBottom: '6px' }}>
            Everything recorded up to and including this date.
          </p>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Segmented Layout Controls */}
            <div className="sf-bs-seg" role="group" aria-label="Layout">
              <label
                className={layoutMode === 'side-by-side' ? 'active' : ''}
                onClick={() => setLayoutMode('side-by-side')}
              >
                Side by side
              </label>
              <label
                className={layoutMode === 'stacked' ? 'active' : ''}
                onClick={() => setLayoutMode('stacked')}
              >
                Stacked
              </label>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="sf-bs-btn"
              style={{ background: '#fff' }}
            >
              Print
            </button>
            <button
              type="button"
              onClick={downloadPDF}
              className="sf-bs-btn sf-bs-ink"
            >
              Export PDF
            </button>
          </div>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div
            style={{
              marginTop: '36px',
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
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#0E1A14',
                borderRadius: '50%',
                animation: 'sf-bs-spin 0.7s linear infinite',
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
              Calculating balance sheet...
            </p>
            <p style={{ margin: 0, fontSize: '15px', color: '#44544B' }}>
              Aggregating balances across Assets, Liabilities, and Capital accounts as of {targetDate}.
            </p>
          </div>
        )}

        {/* Error Alert */}
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
          >
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#991B1B', margin: 0 }}>
              Could not load balance sheet
            </p>
            <p style={{ marginTop: '8px', marginBottom: 0, color: '#7F1D1D', fontSize: '15px' }}>
              {error}
            </p>
          </div>
        )}

        {/* Content Display */}
        {!loading && !error && (
          <>
            {/* Accounting Equation Summary Cards */}
            <div
              className="sf-bs-eq"
              role="group"
              aria-label={`Accounting equation: assets ${formatNumber(totalAssets)} equal liabilities ${formatNumber(totalLiabilities)} plus capital ${formatNumber(totalEquity)}`}
            >
              <div className="b" style={{ background: '#0E1A14', color: '#F2F5EE' }}>
                <span>Total assets</span>
                <b style={{ color: '#C8F135' }}>{formatNumber(totalAssets)}</b>
                <small style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#8A978F' }}>
                  100% of business assets
                </small>
              </div>
              <span className="op" aria-hidden="true">
                =
              </span>
              <div className="b" style={{ background: '#fff' }}>
                <span>Total liabilities</span>
                <b>{formatNumber(totalLiabilities)}</b>
                <small style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#44544B' }}>
                  {liabilitiesPct}% funded by debt
                </small>
              </div>
              <span className="op" aria-hidden="true">
                +
              </span>
              <div className="b" style={{ background: '#C8F135' }}>
                <span>Total capital</span>
                <b>{formatNumber(totalEquity)}</b>
                <small style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#0E1A14', fontWeight: 600 }}>
                  {equityPct}% funded by equity
                </small>
              </div>
            </div>

            {/* Comparative Ratio Balance Bar */}
            <div className="sf-bs-pbar" aria-hidden="true">
              {/* Row 1: Assets */}
              <div className="r">
                <i
                  style={{
                    width: `${assetsBarWidth}%`,
                    background: '#0E1A14',
                  }}
                  title={`Total assets: ${formatNumber(totalAssets)}`}
                />
              </div>

              {/* Row 2: Liabilities + Capital */}
              <div className="r">
                <div
                  style={{
                    display: 'flex',
                    width: `${fundingBarWidth}%`,
                    height: '100%',
                  }}
                >
                  <i
                    style={{
                      flex: totalLiabilities || (totalEquity ? 0.0001 : 1),
                      background: '#44544B',
                    }}
                    title={`Liabilities: ${formatNumber(totalLiabilities)} (${liabilitiesPct}%)`}
                  />
                  <i
                    style={{
                      flex: totalEquity || (totalLiabilities ? 0.0001 : 1),
                      background: '#C8F135',
                      borderLeft: totalLiabilities > 0 ? '2px solid #0E1A14' : 'none',
                    }}
                    title={`Capital: ${formatNumber(totalEquity)} (${equityPct}%)`}
                  />
                </div>
              </div>
            </div>
            <p className="sf-bs-muted" style={{ fontSize: '14px', marginTop: '10px' }}>
              {isBalanced ? (
                <>
                  Both bars are the same length because the books balance. Liabilities represent {liabilitiesPct}% and Capital represents {equityPct}% of total funding.
                </>
              ) : (
                <span style={{ color: '#991B1B', fontWeight: 600 }}>
                  The bars differ by {formatNumber(diff)} because the books are out of balance.
                </span>
              )}
            </p>

            {/* Formal Balance Sheet */}
            <div className="sf-bs-sheet">
              {/* Report Header */}
              <div className="sf-bs-rh">
                <p
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 800,
                    fontSize: '38px',
                    letterSpacing: '-0.03em',
                    color: '#0E1A14',
                    margin: 0,
                  }}
                >
                  {selectedBusiness.business_name}
                </p>
                <p style={{ fontSize: '22px', fontWeight: 600, marginTop: '6px', color: '#0E1A14' }}>
                  Balance Sheet
                </p>
                <p className="sf-bs-muted" style={{ marginTop: '4px', fontSize: '15px' }}>
                  As of {formattedDate}
                </p>
              </div>

              {/* Dynamic Column Grid */}
              <div className={`sf-bs-cols ${layoutMode === 'stacked' ? 'stacked' : ''}`}>
                {/* Assets Section */}
                <section className="sf-bs-bx">
                  <h2>
                    <span>Assets</span>
                    <small style={{ fontSize: '14px', fontWeight: 600, color: '#44544B' }}>
                      {(data.assets || []).length} accounts
                    </small>
                  </h2>
                  <table>
                    <caption className="sr-only">Assets accounts</caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: 'auto' }}>Account</th>
                        <th scope="col" style={{ width: '90px', textAlign: 'right', fontSize: '14px', color: '#44544B' }}>Share</th>
                        <th scope="col" className="n" style={{ width: '140px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.assets || []).length > 0 ? (
                        data.assets.map((item, idx) => {
                          const sharePct =
                            totalAssets > 0
                              ? ((Number(item.balance) / totalAssets) * 100).toFixed(1)
                              : '0.0';
                          return (
                            <tr key={idx}>
                              <td className="ln">{item.name}</td>
                              <td style={{ textAlign: 'right', fontSize: '14px', color: '#44544B', fontVariantNumeric: 'tabular-nums' }}>
                                {sharePct}%
                              </td>
                              <td className="n">{formatNumber(item.balance)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#8A978F', padding: '24px' }}>
                            No assets recorded as of this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan="2">Total assets</th>
                        <td className="n">{formatNumber(totalAssets)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </section>

                {/* Liabilities & Capital Section */}
                <div>
                  {/* Liabilities Table */}
                  <section className="sf-bs-bx">
                    <h2>
                      <span>Liabilities</span>
                      <small style={{ fontSize: '14px', fontWeight: 600, color: '#44544B' }}>
                        {(data.liabilities || []).length} accounts
                      </small>
                    </h2>
                    <table>
                      <caption className="sr-only">Liabilities accounts</caption>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: 'auto' }}>Account</th>
                          <th scope="col" style={{ width: '90px', textAlign: 'right', fontSize: '14px', color: '#44544B' }}>Share</th>
                          <th scope="col" className="n" style={{ width: '140px' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.liabilities || []).length > 0 ? (
                          data.liabilities.map((item, idx) => {
                            const sharePct =
                              totalLiabilities > 0
                                ? ((Number(item.balance) / totalLiabilities) * 100).toFixed(1)
                                : '0.0';
                            return (
                              <tr key={idx}>
                                <td className="ln">{item.name}</td>
                                <td style={{ textAlign: 'right', fontSize: '14px', color: '#44544B', fontVariantNumeric: 'tabular-nums' }}>
                                  {sharePct}%
                                </td>
                                <td className="n">{formatNumber(item.balance)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', color: '#8A978F', padding: '24px' }}>
                              No liabilities recorded as of this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan="2">Total liabilities</th>
                          <td className="n">{formatNumber(totalLiabilities)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </section>

                  {/* Capital Table */}
                  <section className="sf-bs-bx" style={{ marginTop: '32px' }}>
                    <h2>
                      <span>Capital</span>
                      <small style={{ fontSize: '14px', fontWeight: 600, color: '#44544B' }}>
                        {capitalAccounts.length} accounts
                      </small>
                    </h2>
                    <table>
                      <caption className="sr-only">Capital accounts</caption>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: 'auto' }}>Account</th>
                          <th scope="col" style={{ width: '90px', textAlign: 'right', fontSize: '14px', color: '#44544B' }}>Share</th>
                          <th scope="col" className="n" style={{ width: '140px' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capitalAccounts.length > 0 ? (
                          capitalAccounts.map((item, idx) => {
                            const sharePct =
                              totalEquity > 0
                                ? ((Number(item.balance) / totalEquity) * 100).toFixed(1)
                                : '0.0';
                            return (
                              <tr key={idx}>
                                <td className="ln">
                                  {item.name}
                                  {item.name.includes('Profit') && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', background: '#E4EBDC', color: '#0E1A14', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                      Net Profit
                                    </span>
                                  )}
                                  {item.name.includes('Loss') && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                      Net Loss
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right', fontSize: '14px', color: '#44544B', fontVariantNumeric: 'tabular-nums' }}>
                                  {sharePct}%
                                </td>
                                <td className="n">{formatNumber(item.balance)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', color: '#8A978F', padding: '24px' }}>
                              No capital accounts recorded as of this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan="2">Total capital</th>
                          <td className="n">{formatNumber(totalEquity)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </section>
                </div>
              </div>

              {/* Bottom Matching Totals */}
              <div className={`sf-bs-tots ${layoutMode === 'stacked' ? 'stacked' : ''}`}>
                <div className="sf-bs-tt">
                  <span>Total assets</span>
                  <span>{formatNumber(totalAssets)}</span>
                </div>
                <div className="sf-bs-tt">
                  <span>
                    Total liabilities and capital
                    <small>Matched against assets</small>
                  </span>
                  <span>{formatNumber(totalLiabilitiesEquity)}</span>
                </div>
              </div>
            </div>

            {/* Educational Accordion */}
            <details className="sf-bs-how">
              <summary>Understanding the Accounting Equation</summary>
              <div>
                <p>
                  <b>Assets = Liabilities + Capital</b> is the fundamental rule of double-entry bookkeeping.
                </p>
                <p style={{ marginTop: '8px' }}>
                  Everything owned by the business (Assets: Cash, Bank, Furniture, Receivables) was either funded
                  by outside borrowing (Liabilities: Payables, Bank Loans) or contributed and earned by the owner
                  (Capital & Retained Earnings).
                </p>
              </div>
            </details>

            {/* Out of Balance Diagnostic State */}
            {!isBalanced && (
              <div style={{ marginTop: '56px' }}>
                <p className="sf-bs-lab">State · when the sides do not match</p>
                <div className="sf-bs-bad" role="alert">
                  <div className="h">
                    <h2>Not balanced. Difference {formatNumber(diff)}.</h2>
                    <p>
                      Total assets are {formatNumber(totalAssets)} but total liabilities and capital are{' '}
                      {formatNumber(totalLiabilitiesEquity)}.
                    </p>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '16px', color: '#0E1A14' }}>
                      Where to look
                    </p>
                    <p className="sf-bs-muted" style={{ marginTop: '6px', marginBottom: 0, fontSize: '15px' }}>
                      Check the Trial Balance first, then the General Journal for a transaction that was left incomplete or posted with mismatched accounts.
                    </p>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
                      <Link to="/trial-balance" className="sf-bs-btn sf-bs-lime">
                        Open Trial Balance →
                      </Link>
                      <Link to="/showtransections" className="sf-bs-btn" style={{ background: '#fff' }}>
                        Open General Journal →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps When Balanced */}
            {isBalanced && (
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
                  Books balance. Check other financial reports
                </p>
                <div className="sf-bs-nx">
                  <Link to="/income-report">
                    <span>Income Statement</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/trial-balance">
                    <span>Trial Balance</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .sf-bs-page {
          background: #F2F5EE;
          min-height: 100vh;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          color: #0E1A14;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
        }

        .sf-bs-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 32px;
          box-sizing: border-box;
        }

        .sf-bs-muted {
          color: #44544B;
        }

        /* Title */
        .sf-bs-title {
          font-family: 'Bricolage Grotesque', system-ui, -apple-system, sans-serif;
          font-size: clamp(44px, 6vw, 76px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: .98;
          margin-top: 14px;
          margin-bottom: 0;
          color: #0E1A14;
        }

        /* Interactive buttons */
        .sf-bs-btn {
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
          color: #0E1A14;
          box-sizing: border-box;
          transition: transform .15s ease-out, background .15s, color .15s;
        }
        .sf-bs-btn:hover {
          transform: translateY(-2px);
        }
        .sf-bs-lime {
          background: #C8F135;
          color: #0E1A14;
        }
        .sf-bs-ink {
          background: #0E1A14;
          color: #F2F5EE;
        }

        /* Control Card */
        .sf-bs-ctl {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
          margin-top: 28px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 20px 24px;
          box-shadow: 4px 4px 0 #0E1A14;
        }
        .sf-bs-lbl {
          display: block;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
          color: #0E1A14;
        }
        .sf-bs-date-input {
          min-height: 50px;
          padding: 0 14px;
          font-size: 16px;
          font-family: inherit;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          color: #0E1A14;
          box-sizing: border-box;
        }
        .sf-bs-date-input:focus-visible {
          outline: 3px solid #0E1A14;
          outline-offset: 2px;
        }

        /* Segmented Layout Controls */
        .sf-bs-seg {
          display: inline-flex;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
        }
        .sf-bs-seg label {
          padding: 12px 18px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          background: #fff;
          color: #0E1A14;
          transition: background .15s, color .15s;
          user-select: none;
          margin: 0;
        }
        .sf-bs-seg label + label {
          border-left: 2px solid #0E1A14;
        }
        .sf-bs-seg label:hover {
          background: #E4EBDC;
        }
        .sf-bs-seg label.active {
          background: #0E1A14;
          color: #F2F5EE;
        }

        /* Accounting Equation Cards */
        .sf-bs-eq {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 14px;
          margin-top: 30px;
        }
        .sf-bs-eq .b {
          flex: 1 1 240px;
          padding: 22px 26px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          box-shadow: 3px 3px 0 #0E1A14;
          transition: transform .15s ease-out;
        }
        .sf-bs-eq .b:hover {
          transform: translateY(-3px);
        }
        .sf-bs-eq .b span {
          display: block;
          font-size: 15px;
          font-weight: 600;
        }
        .sf-bs-eq .b b {
          display: block;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 46px;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-top: 6px;
        }
        .sf-bs-eq .op {
          align-self: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 44px;
          color: #0E1A14;
        }

        /* Ratio Bar */
        .sf-bs-pbar {
          margin-top: 24px;
        }
        .sf-bs-pbar .r {
          display: flex;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          overflow: hidden;
          height: 22px;
          background: #fff;
        }
        .sf-bs-pbar .r + .r {
          margin-top: 6px;
        }
        .sf-bs-pbar i {
          display: block;
          height: 100%;
          transition: width .3s ease-out;
        }

        /* Balance Sheet Container */
        .sf-bs-sheet {
          margin-top: 36px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          padding: 40px 44px;
          box-shadow: 4px 4px 0 #0E1A14;
        }
        .sf-bs-rh {
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 2px solid #0E1A14;
        }

        /* Columns Grid */
        .sf-bs-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 44px;
          margin-top: 8px;
        }
        .sf-bs-cols.stacked {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        /* Tables */
        .sf-bs-bx {
          margin-top: 22px;
        }
        .sf-bs-bx h2 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 26px;
          padding: 0 4px 8px;
          border-bottom: 2px solid #0E1A14;
          color: #0E1A14;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .sf-bs-bx table {
          width: 100%;
          border-collapse: collapse;
        }
        .sf-bs-bx th {
          padding: 10px 8px;
          font-size: 14px;
          font-weight: 600;
          color: #44544B;
          border-bottom: 1px solid #E5EBDF;
          text-align: left;
        }
        .sf-bs-bx td {
          padding: 12px 8px;
          font-size: 17px;
          text-align: left;
          font-weight: 400;
          border-bottom: 1px solid #E5EBDF;
          transition: background .12s ease-out;
        }
        .sf-bs-bx td.n,
        .sf-bs-bx th.n {
          text-align: right;
        }
        .sf-bs-bx tbody tr:hover td {
          background: #C8F135;
        }
        .sf-bs-bx tfoot th,
        .sf-bs-bx tfoot td {
          border-top: 2px solid #0E1A14;
          border-bottom: 0;
          font-weight: 700;
          padding-top: 13px;
          font-size: 17px;
        }

        /* Totals Banner */
        .sf-bs-tots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 44px;
          margin-top: 30px;
        }
        .sf-bs-tots.stacked {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .sf-bs-tt {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 20px 22px;
          border: 3px solid #0E1A14;
          border-radius: 6px;
          background: #C8F135;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 24px;
          letter-spacing: -0.03em;
          box-shadow: 3px 3px 0 #0E1A14;
        }
        .sf-bs-tt small {
          display: block;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0;
          margin-top: 2px;
          color: #0E1A14;
        }

        /* Educational Accordion */
        .sf-bs-how {
          margin-top: 28px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          max-width: 900px;
          box-shadow: 3px 3px 0 #0E1A14;
        }
        .sf-bs-how summary {
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
        .sf-bs-how summary::-webkit-details-marker {
          display: none;
        }
        .sf-bs-how summary::after {
          content: "+";
          font-size: 22px;
          font-weight: 500;
        }
        .sf-bs-how[open] summary::after {
          content: "−";
        }
        .sf-bs-how div {
          padding: 0 20px 20px;
          font-size: 16px;
          color: #44544B;
          line-height: 1.5;
        }
        .sf-bs-how b {
          color: #0E1A14;
        }

        /* Out of balance warning alert */
        .sf-bs-lab {
          font-size: 13px;
          font-weight: 700;
          color: #44544B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .sf-bs-bad {
          margin-top: 12px;
          max-width: 900px;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          background: #fff;
          overflow: hidden;
          box-shadow: 4px 4px 0 #0E1A14;
        }
        .sf-bs-bad .h {
          background: #F2B66B;
          padding: 20px 24px;
          border-bottom: 2px solid #0E1A14;
        }
        .sf-bs-bad .h h2 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 32px;
          margin: 0;
          color: #0E1A14;
        }
        .sf-bs-bad .h p {
          margin-top: 8px;
          font-size: 18px;
          margin-bottom: 0;
          color: #0E1A14;
        }

        /* Suggested Next Links */
        .sf-bs-nx {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          max-width: 900px;
        }
        .sf-bs-nx a {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          background: #fff;
          border: 2px solid #0E1A14;
          border-radius: 6px;
          font-weight: 700;
          font-size: 16px;
          color: #0E1A14;
          text-decoration: none;
          box-shadow: 3px 3px 0 #0E1A14;
          transition: transform .15s ease-out, background .15s;
        }
        .sf-bs-nx a:hover {
          transform: translateY(-2px);
          background: #E4EBDC;
        }

        @keyframes sf-bs-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .sf-bs-wrap {
            padding: 0 16px;
          }
          .sf-bs-sheet {
            padding: 24px 16px;
          }
          .sf-bs-cols,
          .sf-bs-tots {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .sf-bs-eq .op {
            display: none;
          }
        }

        @media print {
          .sf-bs-page {
            background: white !important;
          }
          .sf-bs-ctl,
          .sf-bs-ub,
          .sf-bs-how,
          .sf-bs-bad,
          .sf-bs-nx,
          header {
            display: none !important;
          }
          .sf-bs-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BalanceSheet;
