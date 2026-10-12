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
    setHasViewed(true);
    setConfirmDeleteId(null);
    await fetchData(customFrom || fromDate, customTo || toDate);
  };

  const handleEdit = (transactionId) => {
    navigate(`/transaction-edit/${transactionId}`);
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    const logoPath = selectedBusiness?.logo_url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    let logoDataUrl = null;
    if (logoPath) {
      logoDataUrl = await getImageAsDataUrl(logoPath, backendUrl);
    }

    const headerY = y;
    const logoWidth = 25;
    let logoHeight = 25;

    if (logoDataUrl) {
      try {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        logoHeight = (img.height * logoWidth) / img.width;
        doc.addImage(logoDataUrl, "PNG", 10, headerY - 5, logoWidth, logoHeight);
      } catch (e) {
        console.error("Failed to add logo to PDF:", e);
        doc.setFillColor(255, 255, 255);
        doc.rect(10, headerY - 5, logoWidth, logoWidth, "F");
        doc.setTextColor(14, 26, 20);
        doc.setFontSize(16);
        doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(10, headerY - 5, logoWidth, logoWidth, "F");
      doc.setTextColor(14, 26, 20);
      doc.setFontSize(16);
      doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
    }

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
    doc.setTextColor(14, 26, 20);
    doc.text("General Journal", pageWidth / 2, headerY + 7, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${formatCustomDate(fromDate)} to ${formatCustomDate(toDate)}`,
      pageWidth / 2,
      headerY + 13,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${formatCustomDate(getLocalDateString())}`,
      pageWidth - 10,
      headerY,
      { align: "right" }
    );

    const lineY = Math.max(headerY + logoHeight, headerY + 18);
    doc.setDrawColor(14, 26, 20);
    doc.setLineWidth(0.5);
    doc.line(10, lineY, pageWidth - 10, lineY);

    y = lineY + 5;

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
              ? `${frontend_transaction_id}\n(${formatCustomDate(entry.transaction_date) || "No Date"})`
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
      head: [["Transaction ID / Date", "Ledger Name", "Debit", "Credit"]],
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
        fillColor: [14, 26, 20],
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
            disabled={!fromDate || !toDate || !selectedBusiness?.business_id}
          >
            View
          </button>
          <div className="sf-gj-sp">
            <button
              type="button"
              className="sf-btn"
              style={{ background: "#fff", color: "#0E1A14", minHeight: "50px" }}
              onClick={handlePrint}
              disabled={entries.length === 0}
            >
              Print
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-ink"
              style={{ minHeight: "50px" }}
              onClick={handleSavePDF}
              disabled={entries.length === 0}
            >
              Save as PDF
            </button>
          </div>
        </form>
        <p style={{ color: "#44544B", fontSize: "14px", marginTop: "10px" }}>
          Print and PDF include your business name, logo and this date range.
        </p>

        {/* Summary Metrics */}
        {hasViewed && (
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
        {transactionList.length > 0 && (
          <div id="transaction-table" style={{ marginTop: "12px" }}>
            {/* Table Header (Desktop) */}
            <div className="sf-gj-hdr" aria-hidden="true">
              <div className="c1">Transaction</div>
              <div className="c2">
                <span>Ledger</span>
                <span className="n">Debit ($)</span>
                <span className="n">Credit ($)</span>
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
                              Total for transaction #{frontend_id}{" "}
                              <span className="sf-gj-bal">Balanced</span>
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
                      onClick={() => handleEdit(txId)}
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
              <div className="c1">Grand total</div>
              <div className="c2">
                <span></span>
                <span className="n">{formatAmount(totals.debit)}</span>
                <span className="n">{formatAmount(totals.credit)}</span>
              </div>
              <div className="c3"></div>
            </div>
          </div>
        )}

        {/* Empty State when viewed and no records found */}
        {hasViewed && transactionList.length === 0 && (
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
