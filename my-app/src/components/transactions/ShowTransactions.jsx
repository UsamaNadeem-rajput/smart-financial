import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";
import { useNavigate } from "react-router-dom";
import { Banknote, PieChart, Receipt, BookOpen, Calculator, FileText } from 'lucide-react';

// Helper to get local date string in YYYY-MM-DD
function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

// Helper to format numbers with commas and 2 decimals
function formatAmount(val) {
  if (val === "" || val === undefined || val === null) return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Helper to format date as YYYY-mmm-DD (e.g., 2024-jan-27)
function formatCustomDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2];

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  const month = monthNames[monthIndex];

  return `${year}-${month}-${day}`;
}

// Helper to convert image URL to data URL using proxy endpoint (bypasses CORS for print/PDF)
async function getImageAsDataUrl(logoPath, backendUrl) {
  try {
    // Extract filename from the logo path (e.g., "/logoupload/filename.png" -> "filename.png")
    const filename = logoPath.split('/').pop();
    // Use the proxy endpoint which has CORS headers
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


export default function TransactionEntryTable() {
  const [fromDate, setFromDate] = useState(getLocalDateString());
  const [toDate, setToDate] = useState(getLocalDateString());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [hasViewed, setHasViewed] = useState(false);
  const [showNoTransactionPopup, setShowNoTransactionPopup] = useState(false);
  const { selectedBusiness, refreshTrigger, triggerRefresh } = useBusiness();

  const fetchData = async () => {
    if (!fromDate || !toDate || !selectedBusiness?.business_id) return 0;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/showtransactions?from=${fromDate}&to=${toDate}&business_id=${selectedBusiness.business_id
        }`
      );
      const data = await res.json();

      const flat = data.entries.flatMap((tx) => {
        const entries = tx.entries.map((entry) => ({
          transaction_id: tx.transaction_id, // ✅ real unique id
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: entry.account_name,
          debit: entry.type === "debit" ? formatAmount(entry.amount) : "",
          credit: entry.type === "credit" ? formatAmount(entry.amount) : "",
        }));
        entries.push({
          transaction_id: tx.transaction_id, // ✅ total row ke liye bhi
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: `Total for Transaction ${tx.frontend_transaction_id}`,
          debit: formatAmount(tx.totals.debit),
          credit: formatAmount(tx.totals.credit),
          isTotal: true,
        });
        return entries;
      });

      flat.sort(
        (a, b) => a.frontend_transaction_id - b.frontend_transaction_id
      );
      setEntries(flat);
      setTotals({
        debit: data.totals.debit || 0,
        credit: data.totals.credit || 0,
      });
      return flat.length;
    } catch (err) {
      console.error("Error fetching data:", err);
      setEntries([]);
      setTotals({ debit: 0, credit: 0 });
      return 0;
    }
  };

  useEffect(() => {
    // Only clear data when business changes. Date changes should not trigger clear/fetch until "View" is clicked.
    setHasViewed(false);
    setEntries([]);
    setTotals({ debit: 0, credit: 0 });
  }, [selectedBusiness]);

  useEffect(() => {
    if (hasViewed) {
      fetchData();
    }
  }, [refreshTrigger]);

  const handlePrint = async () => {
    const printWindow = window.open("", "", "height=600,width=800");
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.frontend_transaction_id])
        acc[entry.frontend_transaction_id] = [];
      acc[entry.frontend_transaction_id].push(entry);
      return acc;
    }, {});

    const logoPath = selectedBusiness?.logo_url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Convert logo to data URL using proxy endpoint to bypass CORS
    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, backendUrl);
    }

    printWindow.document.write(`
      <html>
        <head>
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
            .logo { 
              max-height: 70px; 
              max-width: 70px; 
              object-fit: contain; 
            }
            .header-center { 
              flex-grow: 1; 
              text-align: center; 
            }
            .business-name { 
              font-size: 22px; 
              font-weight: bold; 
              color: #1a1a2e;
              margin-bottom: 5px;
            }
            .report-title { 
              font-size: 16px; 
              color: #4169e1;
              font-weight: 600;
            }
            .date-range {
              font-size: 12px;
              color: #666;
              margin-top: 3px;
            }
            .header-right { 
              text-align: right; 
              font-size: 11px; 
              color: #666;
              min-width: 100px;
            }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { 
              background-color: #4169e1; 
              color: #fff; 
              padding: 10px 8px; 
              text-align: left; 
              font-size: 13px;
              font-weight: 600;
            }
            td { 
              padding: 8px; 
              border: 1px solid #ddd; 
              font-size: 12px; 
            }
            .transaction-total-row { 
              background-color: #e8f0fe; 
              font-weight: 600; 
            }
            .total-row { 
              background-color: #4169e1; 
              color: white;
              font-weight: bold; 
            }
            .total-row td {
              border-color: #4169e1;
            }
            .separator-row td { border: none; padding: 4px; }
            .text-right { text-align: right; }
            @media print {
              @page { margin: 0; }
              body { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="logo-container">
              ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo" alt="Logo" id="printLogo" />` : '<div style="font-size: 24px; color: #4169e1; font-weight: bold;">SF</div>'}
            </div>
            <div class="header-center">
              <div class="business-name">${selectedBusiness?.business_name || "Your Business Name"}</div>
              <div class="report-title">General Journal</div>
              <div class="date-range">${formatCustomDate(fromDate)} to ${formatCustomDate(toDate)}</div>
            </div>
            <div class="header-right">
              <div>Generated on:</div>
              <div>${formatCustomDate(getLocalDateString())}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 120px;">Transaction ID / Date</th>
                <th>Ledger Name</th>
                <th style="width: 100px; text-align: right;">Debit</th>
                <th style="width: 100px; text-align: right;">Credit</th>
              </tr>
            </thead>
            <tbody>
    `);

    Object.entries(grouped).forEach(
      ([frontend_transaction_id, group], groupIndex) => {
        group.forEach((entry, idx) => {
          printWindow.document.write(`
          <tr class="${entry.isTotal ? "transaction-total-row" : ""}">
            ${idx === 0 && !entry.isTotal
              ? `<td rowspan="${group.length}">${frontend_transaction_id}<br><span style="font-size: 0.8em; color: #888;">${formatCustomDate(entry.transaction_date) || "No Date"}</span></td>`
              : ""
            }
            <td>${entry.account_name}</td>
            <td style="text-align: right;">${formatAmount(entry.debit)}</td>
            <td style="text-align: right;">${formatAmount(entry.credit)}</td>
          </tr>
        `);
        });
        if (groupIndex < Object.keys(grouped).length - 1) {
          printWindow.document.write(`<tr class="separator-row"><td colspan="4"></td></tr>`);
        }
      }
    );

    printWindow.document.write(`
          <tr class="total-row">
            <td colspan="2" class="text-right" style="text-align: right; font-weight: bold;">Grand Total</td>
            <td style="text-align: right;">${formatAmount(totals.debit)}</td>
            <td style="text-align: right;">${formatAmount(totals.credit)}</td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
    `);

    printWindow.document.close();

    // Wait for image to load before printing
    if (logoDataUrl) {
      const img = printWindow.document.getElementById('printLogo');
      if (img) {
        await new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        });
        // Small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    printWindow.focus();

    // Fix: Wait for content to render, then print. Use onafterprint to close.
    setTimeout(() => {
      printWindow.print();
    }, 500);

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const handleSavePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    const logoPath = selectedBusiness?.logo_url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Convert logo to data URL using proxy endpoint to bypass CORS
    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, backendUrl);
    }

    // === HEADER SECTION ===
    const headerY = y;
    const logoWidth = 25;
    let logoHeight = 25;

    // Add logo on the left
    if (logoDataUrl) {
      try {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        logoHeight = (img.height * logoWidth) / img.width;
        doc.addImage(logoDataUrl, 'PNG', 10, headerY - 5, logoWidth, logoHeight);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
        // Fallback: Draw placeholder box
        doc.setFillColor(255, 255, 255);
        doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
        doc.setTextColor(65, 105, 225);
        doc.setFontSize(16);
        doc.text("KF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
      }
    } else {
      // Draw placeholder for no logo
      doc.setFillColor(255, 255, 255);
      doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
      doc.setTextColor(65, 105, 225);
      doc.setFontSize(16);
      doc.text("KF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
    }

    // Business name and report title (centered)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(
      selectedBusiness?.business_name || "Your Business Name",
      pageWidth / 2,
      headerY,
      { align: "center" }
    );

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.setTextColor(65, 105, 225);
    doc.text("General Journal", pageWidth / 2, headerY + 7, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    doc.text(`${formatCustomDate(fromDate)} to ${formatCustomDate(toDate)}`, pageWidth / 2, headerY + 13, { align: "center" });

    // Date info on the right
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${formatCustomDate(getLocalDateString())}`, pageWidth - 10, headerY, { align: "right" });

    // Draw header separator line
    const lineY = Math.max(headerY + logoHeight, headerY + 18);
    doc.setDrawColor(65, 105, 225);
    doc.setLineWidth(0.5);
    doc.line(10, lineY, pageWidth - 10, lineY);

    y = lineY + 5;

    // Build table
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.frontend_transaction_id])
        acc[entry.frontend_transaction_id] = [];
      acc[entry.frontend_transaction_id].push(entry);
      return acc;
    }, {});

    const tableRows = [];

    Object.entries(grouped).forEach(
      ([frontend_transaction_id, group], groupIndex) => {
        group.forEach((entry, idx) => {
          tableRows.push([
            idx === 0 && !entry.isTotal
              ? `${frontend_transaction_id}\n(${formatCustomDate(entry.transaction_date) || "No Date"
              })`
              : "",
            entry.account_name,
            formatAmount(entry.debit),
            formatAmount(entry.credit),
            entry.isTotal ? "transaction-total-row" : "",
          ]);
        });
        if (groupIndex < Object.keys(grouped).length - 1) {
          tableRows.push(["", "", "", "", ""]);
        }
      }
    );

    tableRows.push([
      "",
      "Total",
      formatAmount(totals.debit),
      formatAmount(totals.credit),
      "",
    ]);

    let totalRowIndex = tableRows.length - 1;

    autoTable(doc, {
      startY: y + 10,
      head: [["Transaction ID/  Date", "Ledger Name", "Debit", "Credit"]],
      body: tableRows,
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
      },
      styles: {
        fontSize: 12,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [65, 105, 225],
        textColor: [255, 255, 255],
      },
      didDrawCell: (data) => {
        if (
          data.section === "body" &&
          data.row.raw[1] &&
          data.row.raw[1].includes("Total for Transaction")
        ) {
          doc.setFont(undefined, "bold");
          doc.setFontSize(12);
        } else {
          doc.setFont(undefined, "normal");
          doc.setFontSize(12);
        }

        if (
          data.section === "body" &&
          data.row.raw.every((cell) => cell === "")
        ) {
          const { x, y, width } = data.cell;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(x, y, x + width, y);
        }
        if (data.section === "body" && data.row.index === totalRowIndex) {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(x, y, x + width, y);
          doc.line(x, y + height, x + width, y + height);
        }
      },
    });

    doc.save(`transactions_${fromDate}_to_${toDate}.pdf`);
  };

  const navigate = useNavigate();

  const handleEdit = (transactionId) => {
    navigate(`/transaction-edit/${transactionId}`);
  };

  const handleView = async () => {
    setHasViewed(true);
    const count = await fetchData();
    if (!count) {
      setShowNoTransactionPopup(true);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This will permanently remove it from your reports and update ledger balances.")) {
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/delete-transaction/${transactionId}?business_id=${selectedBusiness.business_id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Transaction deleted successfully");
        fetchData(); // Refresh the table
        triggerRefresh();
      } else {
        alert(data.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("An error occurred while deleting the transaction.");
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 via-transparent to-cyan-800/20"></div>

        {/* Professional grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Animated transaction display elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating transaction display icons */}
          <div className="absolute top-20 left-10 text-blue-400/20 animate-pulse flex items-center justify-center">
            <Banknote className="w-10 h-10" />
          </div>
          <div className="absolute top-40 right-20 text-cyan-400/20 animate-bounce flex items-center justify-center">
            <PieChart className="w-8 h-8" />
          </div>
          <div className="absolute bottom-40 left-32 text-purple-400/20 animate-pulse flex items-center justify-center">
            <Receipt className="w-12 h-12" />
          </div>
          <div className="absolute bottom-20 right-40 text-indigo-400/20 animate-bounce flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-teal-400/20 animate-pulse flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="absolute top-1/3 right-1/3 text-violet-400/20 animate-bounce flex items-center justify-center">
            <FileText className="w-10 h-10" />
          </div>

          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: "20s" }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>

          {/* Network connection lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ filter: "blur(0.5px)" }}>
            <defs>
              <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: "#8b5cf6", stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: "#06b6d4", stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              d="M100,100 L300,200 L600,150 L900,300 L1200,200"
              stroke="url(#networkGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M200,400 L500,300 L800,450 L1100,350"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </svg>
        </div>

        {/* Subtle overlay for content readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="container mt-4 text-white">
          <h2>General Journal</h2>

          <div className="mb-3 row">
            <div className="col-md-3">
              <label>From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="form-control"
                max={toDate}
              />
            </div>
            <div className="col-md-3">
              <label>To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="form-control"
                min={fromDate}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleView}
                disabled={!fromDate || !toDate || !selectedBusiness?.business_id}
              >
                View
              </button>
            </div>
          </div>

          <div className="mb-3 d-flex gap-2">
            <button className="btn btn-secondary" onClick={handlePrint}>
              Print
            </button>
            <button className="btn btn-success" onClick={handleSavePDF}>
              Save as PDF
            </button>
          </div>

          <div id="transaction-table">
            <div className="print-header d-none d-print-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="text-2xl font-bold text-primary-600">
                  FinanceFlow
                </h2>
              </div>
              <div className="text-center flex-grow-1">
                <h4 className="mb-0">
                  {selectedBusiness?.business_name || "Your Business Name"}
                </h4>
                <small>{new Date().toLocaleDateString()}</small>
              </div>
              <div style={{ width: "50px" }}></div>
            </div>

            {entries.length > 0 ? (
              <table className="table table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "150px", maxWidth: "150px" }}>
                      Transaction ID / Date
                    </th>
                    <th>Ledger Name</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped = entries.reduce((acc, entry) => {
                      if (!acc[entry.frontend_transaction_id])
                        acc[entry.frontend_transaction_id] = [];
                      acc[entry.frontend_transaction_id].push(entry);

                      return acc;
                    }, {});
                    return Object.entries(grouped).flatMap(
                      ([frontend_transaction_id, group]) =>
                        group.map((entry, idx) => (
                          <tr
                            key={`${frontend_transaction_id}-${idx}`}
                            className={
                              entry.isTotal
                                ? "font-bold transaction-total-row"
                                : ""
                            }
                          >
                            {idx === 0 && !entry.isTotal && (
                              <td
                                rowSpan={group.length}
                                style={{ width: "150px", maxWidth: "150px" }}
                              >
                                {frontend_transaction_id}
                                <br />
                                <span
                                  style={{ fontSize: "0.8em", color: "#888" }}
                                >
                                  {group[0].transaction_date || "No Date"}
                                </span>
                              </td>
                            )}
                            <td>{entry.account_name}</td>
                            <td>{formatAmount(entry.debit)}</td>
                            <td>{formatAmount(entry.credit)}</td>
                            {idx === 0 && !entry.isTotal && (
                              <td rowSpan={group.length}>
                                <div className="d-flex flex-column gap-2" style={{ width: "90px" }}>
                                  <button
                                    className="btn btn-sm btn-primary w-100"
                                    onClick={() =>
                                      handleEdit(entry.transaction_id)
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger w-100"
                                    onClick={() =>
                                      handleDelete(entry.transaction_id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                    );
                  })()}
                  <tr className="font-bold total-row">
                    <td colSpan={2} className="text-right">
                      Total
                    </td>
                    <td>{formatAmount(totals.debit)}</td>
                    <td>{formatAmount(totals.credit)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              hasViewed ? null : null
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showNoTransactionPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNoTransactionPopup(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)'
              }}
            ></div>
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{
                background: "linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(10, 10, 10, 0.95))",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                color: "white",
                position: 'relative'
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4" style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  margin: '0 auto'
                }}>
                  <span style={{ fontSize: '32px' }}>ℹ️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>No Transactions Found</h3>
                <p className="text-gray-300 mb-6" style={{ color: '#d1d5db', marginBottom: '24px' }}>
                  There are no transactions recorded for the selected date range. Please try a different date or add new transactions.
                </p>
                <button
                  onClick={() => setShowNoTransactionPopup(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-blue-500/30"
                  style={{
                    padding: '8px 24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Okay, Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
