import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

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
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2];

  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  const month = monthNames[monthIndex];

  return `${year}-${month}-${day}`;
}

// Helper to format voucher display date (e.g., 01 Oct 2026)
function formatVoucherDate(dateStr) {
  if (!dateStr) return "No Date";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// HTML escape helper to prevent XSS in document.write templates
const escapeHtml = (str) => {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Helper to convert image URL to data URL using proxy endpoint (bypasses CORS for print/PDF)
async function getImageAsDataUrl(logoPath, backendUrl) {
  try {
    const filename = logoPath.split("/").pop();
    const proxyUrl = `${backendUrl}/api/business/logo-proxy/${filename}`;

    const response = await fetch(proxyUrl, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to data URL:", error);
    return null;
  }
}

export default function TransactionEntryTable() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(getLocalDateString());
  const [toDate, setToDate] = useState(getLocalDateString());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [hasViewed, setHasViewed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { selectedBusiness, refreshTrigger, triggerRefresh } = useBusiness();

  const fetchData = async (overrideFrom = fromDate, overrideTo = toDate) => {
    if (!overrideFrom || !overrideTo || !selectedBusiness?.business_id) return 0;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/showtransactions?from=${overrideFrom}&to=${overrideTo}&business_id=${selectedBusiness.business_id}`
      );
      const data = await res.json();

      const flat = (data.entries || []).flatMap((tx) => {
        const rowEntries = tx.entries.map((entry) => ({
          transaction_id: tx.transaction_id,
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: entry.account_name,
          debit: entry.type === "debit" ? formatAmount(entry.amount) : "",
          credit: entry.type === "credit" ? formatAmount(entry.amount) : "",
        }));
        rowEntries.push({
          transaction_id: tx.transaction_id,
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: `Total for Transaction ${tx.frontend_transaction_id}`,
          debit: formatAmount(tx.totals.debit),
          credit: formatAmount(tx.totals.credit),
          isTotal: true,
        });
        return rowEntries;
      });

      flat.sort((a, b) => a.frontend_transaction_id - b.frontend_transaction_id);
      setEntries(flat);
      setTotals({
        debit: data.totals?.debit || 0,
        credit: data.totals?.credit || 0,
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
    setHasViewed(false);
    setEntries([]);
    setTotals({ debit: 0, credit: 0 });
  }, [selectedBusiness]);

  useEffect(() => {
    if (hasViewed) {
      fetchData();
    }
  }, [refreshTrigger]);

  const handleView = async (customFrom, customTo) => {
    setConfirmDeleteId(null);
    setIsLoading(true);
    try {
      await fetchData(customFrom || fromDate, customTo || toDate);
      setHasViewed(true);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transactionId, frontendTxId) => {
    navigate(`/transaction-edit/${transactionId}`, {
      state: { frontend_transaction_id: frontendTxId },
    });
  };

  const handleDelete = async (transactionId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/delete-transaction/${transactionId}?business_id=${selectedBusiness.business_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Transaction deleted successfully");
        fetchData();
        triggerRefresh();
      } else {
        alert(data.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("An error occurred while deleting the transaction.");
    }
  };

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
              color: #0E1A14;
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
              background-color: #0E1A14; 
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
              background-color: #0E1A14; 
              color: white; 
              font-weight: bold; 
            }
            .total-row td {
              border-color: #0E1A14;
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
              ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo" alt="Logo" id="printLogo" />` : '<div style="font-size: 24px; color: #0E1A14; font-weight: bold;">SF</div>'}
            </div>
            <div class="header-center">
              <div class="business-name">${escapeHtml(selectedBusiness?.business_name || "Your Business Name")}</div>
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
              ? `<td rowspan="${group.length}">${escapeHtml(frontend_transaction_id)}<br><span style="font-size: 0.8em; color: #888;">${formatCustomDate(entry.transaction_date) || "No Date"}</span></td>`
              : ""
            }
            <td>${escapeHtml(entry.account_name)}</td>
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

    if (logoDataUrl) {
      const img = printWindow.document.getElementById("printLogo");
      if (img) {
        await new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const handleSavePDF = async () => {
    if (!entries || entries.length === 0) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Date formatting helpers for the PDF
    const shortMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const fullMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formatJournalDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = String(dateStr).split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${shortMonths[monthIdx] || parts[1]} ${year}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`;
      }
      return dateStr;
    };

    const formatFullDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = String(dateStr).split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${fullMonths[monthIdx] || parts[1]} ${year}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
      }
      return dateStr;
    };

    const formatShortDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = String(dateStr).split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${shortMonths[monthIdx] || parts[1]} ${year}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`;
      }
      return dateStr;
    };

    const now = new Date();
    const genDay = now.getDate();
    const genMon = shortMonths[now.getMonth()];
    const genYr = now.getFullYear();
    const genHrs = String(now.getHours()).padStart(2, "0");
    const genMins = String(now.getMinutes()).padStart(2, "0");
    const genDateTime = `${genDay} ${genMon} ${genYr}, ${genHrs}:${genMins}`;

    const businessName = selectedBusiness?.business_name || "Your Business Name";

    // 1. First-page header (top of page 1 only)
    const logoPath = selectedBusiness?.logo_url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    let logoDataUrl = null;
    if (logoPath) {
      try {
        logoDataUrl = await getImageAsDataUrl(logoPath, backendUrl);
      } catch (err) {
        console.error("Failed to load logo:", err);
      }
    }

    let logoDrawn = false;
    if (logoDataUrl) {
      try {
        const format =
          logoDataUrl.startsWith("data:image/jpeg") ||
          logoDataUrl.startsWith("data:image/jpg")
            ? "JPEG"
            : "PNG";
        doc.addImage(logoDataUrl, format, 14, 14, 11, 11);
        logoDrawn = true;
      } catch (e) {
        console.error("Failed to draw logo:", e);
      }
    }

    if (!logoDrawn) {
      doc.setFillColor(26, 26, 26);
      doc.rect(14, 14, 11, 11, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("SF", 14 + 5.5, 14 + 7.8, { align: "center" });
    }

    // Three lines to the right of logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(26, 26, 26);
    doc.text(businessName, 28, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text("General Journal", 28, 23);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    doc.text(
      `For the period ${formatFullDate(fromDate)} to ${formatFullDate(toDate)}`,
      28,
      27.5
    );

    // Top-right text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    doc.text("Smart Financial", 196, 18, { align: "right" });
    doc.text(`Generated ${genDateTime}`, 196, 23, { align: "right" });

    // 1 pt rule (#1A1A1A) across 14 to 196 at y = 33
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.35);
    doc.line(14, 33, 196, 33);

    // Note under rule
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(85, 85, 85);
    doc.text(
      "Amounts in PKR. Transactions are listed by transaction number. Credit accounts are indented.",
      14,
      37
    );

    // Group entries by frontend_transaction_id using existing grouped data
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.frontend_transaction_id]) {
        acc[entry.frontend_transaction_id] = [];
      }
      acc[entry.frontend_transaction_id].push(entry);
      return acc;
    }, {});

    const tableRows = [];

    Object.entries(grouped).forEach(([txId, group]) => {
      const entryLines = group.filter((e) => !e.isTotal);
      const totalEntry = group.find((e) => e.isTotal);

      entryLines.forEach((entry, idx) => {
        const isCredit = Boolean(entry.credit && entry.credit !== "");
        const row = [
          idx === 0 ? formatJournalDate(entry.transaction_date) : "",
          idx === 0 ? String(txId) : "",
          entry.account_name,
          entry.debit || "",
          entry.credit || "",
        ];
        row.rowType = "entry";
        row.isCredit = isCredit;
        tableRows.push(row);
      });

      if (totalEntry) {
        const totalRow = [
          "",
          "",
          "",
          totalEntry.debit || "",
          totalEntry.credit || "",
        ];
        totalRow.rowType = "entry-total";
        tableRows.push(totalRow);
      }
    });

    const grandTotalRow = [
      "",
      "",
      "Grand total",
      formatAmount(totals.debit),
      formatAmount(totals.credit),
    ];
    grandTotalRow.rowType = "grand-total";
    tableRows.push(grandTotalRow);

    const drawFooter = (pageNum) => {
      doc.setDrawColor(212, 212, 212);
      doc.setLineWidth(0.18);
      doc.line(14, 281, 196, 281);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(85, 85, 85);
      const footerLeft = `${businessName}  |  General Journal  |  ${formatShortDate(fromDate)} to ${formatShortDate(toDate)}`;
      doc.text(footerLeft, 14, 285);
      doc.text(
        `Page ${pageNum} of {total_pages_count_string}`,
        196,
        285,
        { align: "right" }
      );
      doc.text(`Generated by Smart Financial on ${genDateTime}`, 14, 289);
    };

    autoTable(doc, {
      startY: 41,
      margin: { left: 14, right: 14, top: 14, bottom: 22 },
      showHead: "everyPage",
      theme: "plain",
      head: [["Date", "Txn no.", "Account", "Debit (PKR)", "Credit (PKR)"]],
      body: tableRows,
      columnStyles: {
        0: { cellWidth: 26, halign: "left" },
        1: { cellWidth: 18, halign: "left" },
        2: { cellWidth: 80, halign: "left" },
        3: { cellWidth: 29, halign: "right" },
        4: { cellWidth: 29, halign: "right" },
      },
      headStyles: {
        fillColor: [237, 237, 237],
        textColor: [26, 26, 26],
        font: "helvetica",
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: { top: 1.3, bottom: 1.3, left: 1.5, right: 1.5 },
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: [26, 26, 26],
        cellPadding: { top: 1.3, bottom: 1.3, left: 1.5, right: 1.5 },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const rawRow = data.row.raw;
          if (rawRow?.rowType === "entry") {
            if (data.column.index === 1) {
              data.cell.styles.fontStyle = "bold";
            }
            if (data.column.index === 2 && rawRow.isCredit) {
              data.cell.styles.cellPadding = {
                top: 1.3,
                bottom: 1.3,
                left: 6.5,
                right: 1.5,
              };
            }
          } else if (rawRow?.rowType === "entry-total") {
            data.cell.styles.cellPadding = {
              top: 1.3,
              bottom: 4.5,
              left: 1.5,
              right: 1.5,
            };
            if (data.column.index === 2) {
              data.cell.styles.fontStyle = "italic";
              data.cell.styles.fontSize = 8.5;
              data.cell.styles.textColor = [85, 85, 85];
            } else if (data.column.index === 3 || data.column.index === 4) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fontSize = 9;
              data.cell.styles.textColor = [26, 26, 26];
            }
          } else if (rawRow?.rowType === "grand-total") {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fontSize = 10;
            data.cell.styles.textColor = [26, 26, 26];
            data.cell.styles.cellPadding = {
              top: 2.0,
              bottom: 2.0,
              left: 1.5,
              right: 1.5,
            };
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === "head") {
          doc.setDrawColor(26, 26, 26);
          doc.setLineWidth(0.28);
          doc.line(
            data.cell.x,
            data.cell.y,
            data.cell.x + data.cell.width,
            data.cell.y
          );
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        } else if (data.section === "body") {
          const rawRow = data.row.raw;
          if (rawRow?.rowType === "entry-total") {
            if (data.column.index === 3 || data.column.index === 4) {
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.18);
              doc.line(
                data.cell.x,
                data.cell.y,
                data.cell.x + data.cell.width,
                data.cell.y
              );
            }
            if (data.column.index === 0) {
              doc.setDrawColor(212, 212, 212);
              doc.setLineWidth(0.14);
              doc.line(
                14,
                data.cell.y + data.cell.height,
                196,
                data.cell.y + data.cell.height
              );
            }
          } else if (rawRow?.rowType === "grand-total") {
            if (data.column.index === 3 || data.column.index === 4) {
              doc.setDrawColor(26, 26, 26);
              doc.setLineWidth(0.28);
              doc.line(
                data.cell.x,
                data.cell.y,
                data.cell.x + data.cell.width,
                data.cell.y
              );

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

    // End of report block
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 41;
    let blockStartY = finalY + 8;
    if (blockStartY + 28 > 281) {
      doc.addPage();
      drawFooter(doc.internal.getNumberOfPages());
      blockStartY = 24;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    const endText = "End of report";
    const endTextWidth = doc.getTextWidth(endText);
    const centerX = 105;
    doc.text(endText, centerX, blockStartY, { align: "center" });

    doc.setDrawColor(212, 212, 212);
    doc.setLineWidth(0.14);
    const lineOffset = endTextWidth / 2 + 4;
    doc.line(14, blockStartY - 1, centerX - lineOffset, blockStartY - 1);
    doc.line(centerX + lineOffset, blockStartY - 1, 196, blockStartY - 1);

    const sentenceY = blockStartY + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);

    const txCount = Object.keys(grouped).length;
    const totalDebitStr = formatAmount(totals.debit);
    const totalCreditStr = formatAmount(totals.credit);
    const numDebit = Number(totals.debit) || 0;
    const numCredit = Number(totals.credit) || 0;
    const diff = Math.abs(numDebit - numCredit);
    const diffStr = formatAmount(diff);
    const balanceText =
      diff < 0.005
        ? "Difference 0.00: the journal balances."
        : `Difference ${diffStr}: the journal does not balance.`;
    const summarySentence = `${txCount} transactions. Total debits ${totalDebitStr}, total credits ${totalCreditStr}. ${balanceText}`;
    doc.text(summarySentence, centerX, sentenceY, { align: "center" });

    const sigY = sentenceY + 16;
    doc.setDrawColor(212, 212, 212);
    doc.setLineWidth(0.18);
    doc.line(14, sigY, 58, sigY);
    doc.line(83, sigY, 127, sigY);
    doc.line(152, sigY, 196, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    doc.text("Prepared by", 36, sigY + 4.5, { align: "center" });
    doc.text("Reviewed by", 105, sigY + 4.5, { align: "center" });
    doc.text("Approved by", 174, sigY + 4.5, { align: "center" });

    doc.putTotalPages("{total_pages_count_string}");
    doc.save(`transactions_${fromDate}_to_${toDate}.pdf`);
  };

  // Group entries by frontend_transaction_id
  const groupedTransactions = entries.reduce((acc, entry) => {
    if (!acc[entry.frontend_transaction_id]) {
      acc[entry.frontend_transaction_id] = [];
    }
    acc[entry.frontend_transaction_id].push(entry);
    return acc;
  }, {});

  const transactionList = Object.entries(groupedTransactions);
  const transactionCount = transactionList.length;
  const isJournalBalanced =
    totals.debit > 0 && Number(totals.debit) === Number(totals.credit);

  return (
    <div
      style={{
        backgroundColor: "#F2F5EE",
        minHeight: "100vh",
        color: "#0E1A14",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <Navbar />

      <main className="sf-wrap" style={{ paddingTop: "40px", paddingBottom: "90px" }}>
        {/* Breadcrumb & Header Title */}
        <p style={{ color: "#44544B", fontSize: "15px", margin: 0 }}>
          <Link to="/transectionForm" style={{ borderBottom: "1px solid #0E1A14", color: "#0E1A14" }}>
            Post transactions
          </Link>{" "}
          / General journal
        </p>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "clamp(44px, 6vw, 76px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.98,
            marginTop: "14px",
            marginBottom: 0,
            color: "#0E1A14",
          }}
        >
          General Journal.
        </h1>
        <p
          style={{
            color: "#44544B",
            fontSize: "20px",
            marginTop: "16px",
            maxWidth: "720px",
            lineHeight: 1.5,
          }}
        >
          Every entry in date order, with both sides side by side. Check it, correct it, or print it for your auditor.
        </p>

        {/* Filter Bar */}
        <form
          className="sf-gj-fb"
          onSubmit={(e) => {
            e.preventDefault();
            handleView();
          }}
        >
          <div>
            <label className="f" htmlFor="fd">
              From date
            </label>
            <input
              id="fd"
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="f" htmlFor="td">
              To date
            </label>
            <input
              id="td"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="sf-btn sf-btn-lime"
            style={{ minWidth: "120px", minHeight: "50px", fontSize: "16px" }}
            disabled={isLoading || !fromDate || !toDate || !selectedBusiness?.business_id}
          >
            {isLoading ? "Loading…" : "View"}
          </button>
          <div className="sf-gj-sp">
            <button
              type="button"
              className="sf-btn"
              style={{ background: "#fff", color: "#0E1A14", minHeight: "50px" }}
              onClick={handlePrint}
              disabled={isLoading || entries.length === 0}
            >
              Print
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-ink"
              style={{ minHeight: "50px" }}
              onClick={handleSavePDF}
              disabled={isLoading || entries.length === 0}
            >
              Save as PDF
            </button>
          </div>
        </form>
        <p style={{ color: "#44544B", fontSize: "14px", marginTop: "10px" }}>
          Print and PDF include your business name, logo and this date range.
        </p>

        {/* Loading Indicator */}
        {isLoading && (
          <div
            style={{
              marginTop: "32px",
              padding: "48px 24px",
              textAlign: "center",
              background: "#fff",
              border: "2px solid #0E1A14",
              borderRadius: "6px",
              boxShadow: "3px 3px 0 #0E1A14",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
            }}
            role="status"
            aria-live="polite"
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "3px solid #E2E8F0",
                borderTopColor: "#0E1A14",
                borderRadius: "50%",
                animation: "sf-spin 0.7s linear infinite",
              }}
            />
            <p
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: "18px",
                color: "#0E1A14",
              }}
            >
              Fetching transactions...
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#44544B" }}>
              Loading journal records from {formatVoucherDate(fromDate)} to {formatVoucherDate(toDate)}
            </p>
          </div>
        )}

        {/* Summary Metrics */}
        {!isLoading && hasViewed && (
          <div className="sf-gj-sm">
            <p style={{ margin: 0 }}>
              <b>{transactionCount} transactions</b> from {formatVoucherDate(fromDate)} to{" "}
              {formatVoucherDate(toDate)}
            </p>
            <p style={{ margin: 0 }}>
              Debits <b>{formatAmount(totals.debit)}</b> = Credits <b>{formatAmount(totals.credit)}</b>{" "}
              <span className={`sf-gj-bal ${isJournalBalanced ? "" : "bad"}`}>
                {isJournalBalanced ? "Journal balances" : "Unbalanced"}
              </span>
            </p>
          </div>
        )}

        {/* Journal Entries List */}
        {!isLoading && transactionList.length > 0 && (
          <div id="transaction-table" style={{ marginTop: "12px" }}>
            {/* Table Header (Desktop) */}
            <div className="sf-gj-hdr" aria-hidden="true">
              <div className="c1">Transaction</div>
              <div className="c2">
                <span>Ledger</span>
                <span className="n">Debit (PKR)</span>
                <span className="n">Credit (PKR)</span>
              </div>
              <div className="c3">Actions</div>
            </div>

            {/* Vouchers */}
            {transactionList.map(([frontend_id, group]) => {
              const mainEntries = group.filter((e) => !e.isTotal);
              const totalRow = group.find((e) => e.isTotal);
              const txId = group[0]?.transaction_id;
              const txDate = group[0]?.transaction_date;
              const isDeleting = confirmDeleteId === txId;

              // Collect affected ledger names for confirmation message
              const ledgerNames = Array.from(new Set(mainEntries.map((e) => e.account_name))).join(", ");

              return (
                <article
                  key={frontend_id}
                  className="sf-gj-v"
                  aria-label={`Transaction ${frontend_id}`}
                >
                  <div className="sf-gj-vm">
                    <span className="sf-gj-vn">#{frontend_id}</span>
                    <span className="sf-gj-vd">{formatVoucherDate(txDate)}</span>
                  </div>

                  <div className="sf-gj-vb">
                    <table>
                      <colgroup>
                        <col />
                        <col className="a" />
                        <col className="a" />
                      </colgroup>
                      <tbody>
                        {mainEntries.map((entry, idx) => {
                          const isCredit = !!entry.credit && !entry.debit;
                          return (
                            <tr key={idx} className={isCredit ? "cr" : "dr"}>
                              <td className="ln">{entry.account_name}</td>
                              <td className="n">{entry.debit ? formatAmount(entry.debit) : ""}</td>
                              <td className="n">{entry.credit ? formatAmount(entry.credit) : ""}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {totalRow && (
                        <tfoot>
                          <tr>
                            <th scope="row">
                              Total for transaction #{frontend_id}
                            </th>
                            <td className="n">{formatAmount(totalRow.debit)}</td>
                            <td className="n">{formatAmount(totalRow.credit)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <div className="sf-gj-va">
                    <button
                      type="button"
                      className="sf-gj-ed"
                      onClick={() => handleEdit(txId, frontend_id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="sf-gj-dl"
                      onClick={() => setConfirmDeleteId(isDeleting ? null : txId)}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Inline Delete Confirmation */}
                  {isDeleting && (
                    <div className="sf-gj-cf" role="alert">
                      <p style={{ fontWeight: 700, fontSize: "18px", margin: 0, color: "#0E1A14" }}>
                        Delete transaction #{frontend_id}?
                      </p>
                      <p style={{ marginTop: "6px", marginBottom: 0, color: "#44544B", fontSize: "15px" }}>
                        It is hidden, not erased. The balances of {ledgerNames} are recalculated straight away.
                      </p>
                      <div className="sf-gj-acts">
                        <button
                          type="button"
                          className="sf-btn sf-btn-ink"
                          style={{ minHeight: "44px", padding: "0 20px", fontSize: "15px" }}
                          onClick={() => {
                            setConfirmDeleteId(null);
                            handleDelete(txId);
                          }}
                        >
                          Yes, delete it
                        </button>
                        <button
                          type="button"
                          className="sf-lk"
                          style={{
                            background: "none",
                            border: "none",
                            borderBottom: "2px solid #0E1A14",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#0E1A14",
                            padding: "0 0 2px",
                          }}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Grand Total Bar */}
            <div className="sf-gj-gt">
              <div className="sf-gj-gt-title">Grand total</div>
              <div className="sf-gj-gt-totals">
                <div className="sf-gj-gt-item">
                  <span className="sf-gj-gt-lbl">Debit</span>
                  <span className="sf-gj-gt-val">{formatAmount(totals.debit)}</span>
                </div>
                <div className="sf-gj-gt-item">
                  <span className="sf-gj-gt-lbl">Credit</span>
                  <span className="sf-gj-gt-val">{formatAmount(totals.credit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State when viewed and no records found */}
        {!isLoading && hasViewed && transactionList.length === 0 && (
          <div style={{ marginTop: "40px" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#44544B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              State · nothing found
            </p>
            <div className="sf-gj-es" role="status">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, margin: 0 }}>
                No entries in this range.
              </h2>
              <p>
                There are no transactions in {selectedBusiness?.business_name || "this business"} between{" "}
                {formatVoucherDate(fromDate)} and {formatVoucherDate(toDate)}. Try a wider date range.
              </p>
              <button
                type="button"
                className="sf-btn sf-btn-lime"
                style={{ marginTop: "20px" }}
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  const thirtyDaysAgo = d.toISOString().split("T")[0];
                  const today = getLocalDateString();
                  setFromDate(thirtyDaysAgo);
                  setToDate(today);
                  handleView(thirtyDaysAgo, today);
                }}
              >
                Show the last 30 days
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
