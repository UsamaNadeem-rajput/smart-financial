import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === "") return "";
  const parts = value.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export default function TransactionEdit() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();

  const [rows, setRows] = useState([]);
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Fetch transaction details
  useEffect(() => {
    if (!transactionId || !selectedBusiness?.business_id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/edit-transaction/${transactionId}/${selectedBusiness.business_id}`
        );
        const data = await res.json();
        console.log("📌 Transaction API Response:", data);

        if (data.success && data.transaction) {
          setDate(data.transaction.date);
          setRows(
            data.transaction.entries.map((e) => ({
              accountName: e.account_name,
              accountId: e.account_id,
              debit: e.type === "debit" ? e.amount : "",
              credit: e.type === "credit" ? e.amount : "",
            }))
          );
        }
      } catch (err) {
        console.error("❌ Error fetching transaction:", err);
      }
    };

    fetchData();
  }, [transactionId, selectedBusiness?.business_id]);

  // 🔹 Totals check
  const debitTotal = rows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = rows.reduce((a, b) => a + (Number(b.credit) || 0), 0);
  const isSubmitDisabled =
    rows.length === 0 ||
    debitTotal === 0 ||
    creditTotal === 0 ||
    debitTotal !== creditTotal;

  // 🔹 Debit & Credit changes
  const handleDebitChange = (idx, value) => {
    const raw = value.replace(/,/g, "");
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== "") return;
    const newRows = [...rows];
    newRows[idx].debit = raw;
    if (raw !== "") newRows[idx].credit = "";
    setRows(newRows);
  };

  const handleCreditChange = (idx, value) => {
    const raw = value.replace(/,/g, "");
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== "") return;
    const newRows = [...rows];
    newRows[idx].credit = raw;
    if (raw !== "") newRows[idx].debit = "";
    setRows(newRows);
  };

  // 🔹 Save transaction
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        entries: rows.map((r) =>
          r.debit
            ? { account_id: r.accountId, amount: r.debit, type: "debit" }
            : { account_id: r.accountId, amount: r.credit, type: "credit" }
        ),
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/edit-transaction/${transactionId}/${selectedBusiness.business_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("✅ Transaction updated successfully!");
        navigate(-1); // go back
      } else {
        alert("❌ Error: " + (data.error || "Failed to update transaction."));
      }
    } catch (err) {
      alert("❌ Network error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="container mt-4">
        <h2>Edit Transaction</h2>

        {/* Date */}
        <div className="mb-3">
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-control"
          />
        </div>

        {/* Ledger Rows */}
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Ledger Name</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={row.accountName}
                    readOnly
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(row.debit)}
                    onChange={(e) => handleDebitChange(idx, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={formatNumberWithCommas(row.credit)}
                    onChange={(e) => handleCreditChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="d-flex justify-content-end gap-3 mt-3">
          <div>
            <label className="me-2">Debit Total:</label>
            <input
              type="text"
              className="form-control"
              value={formatNumberWithCommas(debitTotal)}
              readOnly
            />
          </div>
          <div>
            <label className="me-2">Credit Total:</label>
            <input
              type="text"
              className="form-control"
              value={formatNumberWithCommas(creditTotal)}
              readOnly
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSubmitDisabled || isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
