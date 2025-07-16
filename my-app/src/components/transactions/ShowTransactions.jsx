import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

export default function TransactionEntryTable() {
  const [date, setDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const { selectedBusiness } = useBusiness();

  const fetchData = async () => {
    if (!date) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/showtransactions?date=${date}`
      );
      const data = await res.json();

      const flat = data.entries.flatMap((tx) => {
        const entries = tx.entries.map((entry) => ({
          transaction_id: tx.transaction_id,
          transaction_date: tx.date,
          account_name: entry.account_name,
          debit: entry.type === "debit" ? entry.amount : "",
          credit: entry.type === "credit" ? entry.amount : "",
        }));
        // Add transaction total row
        entries.push({
          transaction_id: tx.transaction_id,
          transaction_date: tx.date,
          account_name: `Total for Transaction ${tx.transaction_id}`,
          debit: tx.totals.debit,
          credit: tx.totals.credit,
          isTotal: true,
        });
        return entries;
      });

      flat.sort((a, b) => a.transaction_id - b.transaction_id);
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
    if (date) fetchData();
  }, [date]);

  const handlePrint = () => {
    const table = document.getElementById("transaction-table");
    if (!table) return;
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Print Transactions</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />'
    );
    printWindow.document.write(
      "<style>@media print { .d-print-flex { display: flex !important; } .d-none { display: none !important; } .total-row { border-top: 2px solid black; border-bottom: 2px solid black; } .transaction-total-row { background-color: #e6f3ff !important; } }</style>"
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(table.outerHTML);
    printWindow.document.write("</body></html>");
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
        {
          align: "center",
        }
      );

      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 10, y, {
        align: "right",
      });

      callback();
    };

    const buildTable = () => {
      const grouped = entries.reduce((acc, entry) => {
        if (!acc[entry.transaction_id]) acc[entry.transaction_id] = [];
        acc[entry.transaction_id].push(entry);
        return acc;
      }, {});

      const tableRows = [];

      Object.entries(grouped).forEach(([transaction_id, group], groupIndex) => {
        group.forEach((entry, idx) => {
          tableRows.push([
            idx === 0 && !entry.isTotal
              ? `${transaction_id}\n(${entry.transaction_date || "No Date"})`
              : "",
            entry.account_name,
            entry.debit,
            entry.credit,
            entry.isTotal ? "transaction-total-row" : "", // Add class for total rows
          ]);
        });
        if (groupIndex < Object.keys(grouped).length - 1) {
          tableRows.push(["", "", "", "", ""]);
        }
      });

      tableRows.push(["", "Total", totals.debit.toFixed(2), totals.credit.toFixed(2), ""]);

      let totalRowIndex = tableRows.length - 1;

      autoTable(doc, {
        startY: y + 10,
        head: [["Transaction ID / Date", "Ledger Name", "Debit", "Credit"]],
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
          // Draw lines above and below the Total row
          if (data.section === "body" && data.row.index === totalRowIndex) {
            const { x, y, width, height } = data.cell;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            // Top line
            doc.line(x, y, x + width, y);
            // Bottom line
            doc.line(x, y + height, x + width, y + height);
          }
          // Apply background color to transaction total rows
  
        },
      });

      doc.save(`transactions_${date}.pdf`);
    };

    addHeader(buildTable);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>General Journal</h2>

        <div className="mb-3">
          <label>Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-control"
          />
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
                    if (!acc[entry.transaction_id])
                      acc[entry.transaction_id] = [];
                    acc[entry.transaction_id].push(entry);
                    return acc;
                  }, {});
                  return Object.entries(grouped).flatMap(
                    ([transaction_id, group]) =>
                      group.map((entry, idx) => (
                        <tr
                          key={`${transaction_id}-${idx}`}
                          className={entry.isTotal ? "font-bold transaction-total-row" : ""}
                        >
                          {idx === 0 && !entry.isTotal && (
                            <td rowSpan={group.length}>
                              {transaction_id}
                              <br />
                              <span
                                style={{ fontSize: "0.8em", color: "#888" }}
                              >
                                {group[0].transaction_date || "No Date"}
                              </span>
                            </td>
                          )}
                          <td>{entry.account_name}</td>
                          <td>{entry.debit}</td>
                          <td>{entry.credit}</td>
                        </tr>
                      ))
                  );
                })()}
                <tr className="font-bold total-row">
                  <td colSpan={2} className="text-right">
                    Total
                  </td>
                  <td>{totals.debit.toFixed(2)}</td>
                  <td>{totals.credit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            date && <p>No transactions found for selected date.</p>
          )}
        </div>
      </div>

      
    </>
  );
}