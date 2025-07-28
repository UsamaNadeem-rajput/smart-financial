import { useState, useEffect } from "react";
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

export default function TransactionEntryTable() {
  const [fromDate, setFromDate] = useState(getLocalDateString());
  const [toDate, setToDate] = useState(getLocalDateString());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const { selectedBusiness } = useBusiness();

  const fetchData = async () => {
    if (!fromDate || !toDate || !selectedBusiness?.business_id) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/showtransactions?from=${fromDate}&to=${toDate}&business_id=${selectedBusiness.business_id}`
      );
      const data = await res.json();

      const flat = data.entries.flatMap((tx) => {
        const entries = tx.entries.map((entry) => ({
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: entry.account_name,
          debit: entry.type === "debit" ? formatAmount(entry.amount) : "",
          credit: entry.type === "credit" ? formatAmount(entry.amount) : "",
        }));
        entries.push({
          frontend_transaction_id: tx.frontend_transaction_id,
          transaction_date: tx.date,
          account_name: `Total for Transaction ${tx.frontend_transaction_id}`,
          debit: formatAmount(tx.totals.debit),
          credit: formatAmount(tx.totals.credit),
          isTotal: true,
        });
        return entries;
      });

      flat.sort((a, b) => a.frontend_transaction_id - b.frontend_transaction_id);
      setEntries(flat);
      setTotals({
        debit: data.totals.debit || 0,
        credit: data.totals.credit || 0,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setEntries([]);
      setTotals({ debit: 0, credit: 0 });
    }
  };

  useEffect(() => {
    if (fromDate && toDate && selectedBusiness?.business_id) fetchData();
  }, [fromDate, toDate, selectedBusiness]);

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.frontend_transaction_id]) acc[entry.frontend_transaction_id] = [];
      acc[entry.frontend_transaction_id].push(entry);
      return acc;
    }, {});

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Transactions</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
          <style>
            @media print {
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { display: flex !important; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .print-header h2 { color: #1e90ff; font-size: 24px; margin: 0; }
              .print-header .business-name { font-size: 18px; text-align: center; flex-grow: 1; }
              .print-header .date { font-size: 12px; text-align: right; }
              .table { width: 100%; border-collapse: collapse; }
              .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
              .table th { background-color: #4169e1; color: #fff; font-size: 14px; }
              .table td { font-size: 12px; }
              .transaction-total-row { background-color: #e6f3ff; font-weight: bold; }
              .total-row { border-top: 2px solid black; border-bottom: 2px solid black; font-weight: bold; }
              .separator-row td { border: none; padding: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>FinanceFlow</h2>
            <div class="business-name">
              <h4>${selectedBusiness?.business_name || "Your Business Name"}</h4>
              <div class="text-center">General Journal</div>
            </div>
            <div class="date">${new Date().toLocaleDateString()}</div>
          </div>
            <div style="width: 50px;"></div>
          </div>
          <table class="table table-bordered">
            <thead class="table-dark">
              <tr>
                <th>Transaction ID / Date</th>
                <th>Ledger Name</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
    `);

    Object.entries(grouped).forEach(([frontend_transaction_id, group], groupIndex) => {
      group.forEach((entry, idx) => {
        printWindow.document.write(`
          <tr class="${entry.isTotal ? "transaction-total-row" : ""}">
            ${
              idx === 0 && !entry.isTotal
                ? `<td rowspan="${group.length}">${frontend_transaction_id}<br><span style="font-size: 0.8em; color: #888;">${
                    entry.transaction_date || "No Date"
                  }</span></td>`
                : ""
            }
            <td>${entry.account_name}</td>
            <td>${formatAmount(entry.debit)}</td>
            <td>${formatAmount(entry.credit)}</td>
          </tr>
        `);
      });
      if (groupIndex < Object.keys(grouped).length - 1) {
        printWindow.document.write(`
          <tr class="separator-row"><td colspan="4"></td></tr>

        `);
      }
    });

    printWindow.document.write(`
          <tr class="total-row">
            <td colspan="2" class="text-right">Total</td>
            <td>${formatAmount(totals.debit)}</td>
            <td>${formatAmount(totals.credit)}</td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleSavePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const addHeader = (callback) => {
      doc.setFontSize(18);
      doc.setTextColor(30, 144, 255);
      doc.text("FinanceFlow", 10, y);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(
        selectedBusiness?.business_name || "Your Business Name",
        pageWidth / 2,
        y,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 10, y, {
        align: "right",
      });

      callback();
    };

    const buildTable = () => {
      const grouped = entries.reduce((acc, entry) => {
        if (!acc[entry.frontend_transaction_id]) acc[entry.frontend_transaction_id] = [];
        acc[entry.frontend_transaction_id].push(entry);
        return acc;
      }, {});

      const tableRows = [];

      Object.entries(grouped).forEach(([frontend_transaction_id, group], groupIndex) => {
        group.forEach((entry, idx) => {
          tableRows.push([
            idx === 0 && !entry.isTotal
              ? `${frontend_transaction_id}\n(${entry.transaction_date || "No Date"})`
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
      });

      tableRows.push(["", "Total", formatAmount(totals.debit), formatAmount(totals.credit), ""]);

      let totalRowIndex = tableRows.length - 1;

      autoTable(doc, {
        startY: y + 10,
        head: [["Frontend Transaction ID / Date", "Ledger Name", "Debit", "Credit"]],
        body: tableRows,
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

    addHeader(buildTable);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
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
                  <th>Transaction ID / Date</th>
                  <th>Ledger Name</th>
                  <th>Debit</th>
                  <th>Credit</th>
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
                          className={entry.isTotal ? "font-bold transaction-total-row" : ""}
                        >
                          {idx === 0 && !entry.isTotal && (
                            <td rowSpan={group.length}>
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
                </tr>
              </tbody>
            </table>
          ) : (
            fromDate && toDate && <p>No transactions found for selected date range.</p>
          )}
        </div>
      </div>
    </>
  );
}