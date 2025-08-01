import React, { useState, useEffect } from "react";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

// Helper to get local date string in YYYY-MM-DD
function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

// Helper to format numbers with commas
function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') return '';
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export default function TransectionForm() {
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState("");
  const [number, setNumber] = useState(1);
  const [rows, setRows] = useState([
    { accountName: "", debit: "", credit: "" },
    { accountName: "", debit: "", credit: "" },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsIdx, setShowSuggestionsIdx] = useState(null);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const { selectedBusiness } = useBusiness();

  // Filter rows that have actual data (account name and either debit or credit)
  const validRows = rows.filter(row => 
    row.accountName.trim() !== "" && (row.debit !== "" || row.credit !== "")
  );
  
  const debitTotal = validRows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = validRows.reduce((a, b) => a + (Number(b.credit) || 0), 0);
  const isSubmitDisabled =
    validRows.length === 0 || debitTotal === 0 || creditTotal === 0 || debitTotal !== creditTotal;

  const allAccountNamesFilled = validRows.every(
    (row) => row.accountName.trim() !== ""
  );

  const getNextTransactionId = async () => {
    if (!selectedBusiness?.business_id) return 1;
    
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/next-transaction-id/${selectedBusiness.business_id}`
      );
      const data = await res.json();
      if (data.success) {
        return data.next_transaction_id;
      }
    } catch (err) {
      console.error('Error fetching next transaction ID:', err);
    }
    return 1;
  };

  const incrementNumber = async () => {
    const nextId = await getNextTransactionId();
    setNumber(nextId);
  };

  useEffect(() => {
    const initializeForm = async () => {
      const now = new Date();
      setDate(getLocalDateString());
      setTime(now.toLocaleTimeString());
      const nextId = await getNextTransactionId();
      setNumber(nextId);
    };
    
    initializeForm();
  }, [selectedBusiness?.business_id]);

  const handleDateChange = (e) => setDate(e.target.value);

  const handleSubmit = async (onSuccess) => {
    if (!selectedBusiness?.business_id) {
      alert("No business selected. Please select a business first.");
      return;
    }

    const entries = rows
      .filter((row) => row.accountId && (row.debit || row.credit))
      .map((row) =>
        row.debit
          ? { account_id: row.accountId, amount: row.debit, type: "debit" }
          : { account_id: row.accountId, amount: row.credit, type: "credit" }
      );

    if (debitTotal !== creditTotal) {
      alert("Debit and Credit totals must match.");
      return;
    }

    const payload = {
      transaction_id: number,
      business_id: selectedBusiness.business_id,
      description: "",
      debit: debitTotal,
      credit: creditTotal,
      date,
      entries,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/transactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        console.log("Transaction posted successfully. Account balances have been updated.");
        onSuccess();
      } else alert("Error: " + (data.error || "Failed to save transaction."));
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to recalculate all account balances
  const recalculateBalances = async () => {
    if (!selectedBusiness?.business_id) {
      alert("No business selected. Please select a business first.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/recalculate-balances/${selectedBusiness.business_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Account balances recalculated successfully!");
      } else alert("Error: " + (data.error || "Failed to recalculate balances."));
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  const handleSaveAndNew = () => {
    setIsLoading(true);
    handleSubmit(async () => {
      await incrementNumber();  // ✅ Increments transaction ID
      setRows([{ accountName: "", debit: "", credit: "" }]);
      setSuggestions([]);
      setShowSuggestionsIdx(null);
      setDate(getLocalDateString());
      setTime(new Date().toLocaleTimeString());
    });
  };

  const handleSaveAndClose = () => {
    setIsLoading(true);
    handleSubmit(async () => {
      await incrementNumber();  // ✅ Increments transaction ID
      window.history.back();
    });
  };

  const handleClose = () => {
    incrementNumber().then(() => {
      window.history.back();
    });
  };

  const handleAccountNameKeyDown = (idx, e) => {
    if (showSuggestionsIdx !== idx || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (highlightedSuggestion >= 0 && highlightedSuggestion < suggestions.length) {
        const s = suggestions[highlightedSuggestion];
        handleSuggestionClick(idx, s.account_name, s.account_id);
        setHighlightedSuggestion(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsIdx(null);
      setHighlightedSuggestion(-1);
    }
  };

  const handleAccountNameChange = async (idx, value) => {
    const newRows = [...rows];
    newRows[idx].accountName = value;
    setRows(newRows);
    setHighlightedSuggestion(-1);

    if (value.length > 0) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/search-accounts?query=${encodeURIComponent(
            value
          )}&business_id=${selectedBusiness?.business_id}`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestionsIdx(idx);
      } catch {
        setSuggestions([]);
        setShowSuggestionsIdx(null);
      }
    } else {
      setSuggestions([]);
      setShowSuggestionsIdx(null);
    }
  };

  const handleSuggestionClick = (idx, name, id) => {
    const newRows = [...rows];
    newRows[idx].accountName = name;
    newRows[idx].accountId = id;
    setRows(newRows);
    setSuggestions([]);
    setShowSuggestionsIdx(null);
  };

  const addRow = () =>
    setRows([...rows, { accountName: "", debit: "", credit: "" }]);
  const removeRow = (idx) =>
    setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  const handleDebitChange = (idx, value) => {
    // Remove commas for storage
    const raw = value.replace(/,/g, '');
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== '') return; // Only allow numbers
    const newRows = [...rows];
    newRows[idx].debit = raw;
    // Clear credit if debit is entered
    if (raw !== '') {
      newRows[idx].credit = '';
    }
    setRows(newRows);
  };

  const handleCreditChange = (idx, value) => {
    // Remove commas for storage
    const raw = value.replace(/,/g, '');
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== '') return; // Only allow numbers
    const newRows = [...rows];
    newRows[idx].credit = raw;
    // Clear debit if credit is entered
    if (raw !== '') {
      newRows[idx].debit = '';
    }
    setRows(newRows);
  };

  const handleDebitKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].debit) addRow();
  };

  const handleCreditKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].credit)
      addRow();
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div
          className="container my-5 text-bg-light p-4 rounded"
          style={{ maxWidth: "100%", minWidth: "300px" }}
        >
          <h2 className="mb-4">Transaction Form</h2>

          {/* Top Row: Date, Time, Transaction ID */}
          <div className="row g-3 align-items-center mb-4">
            <div className="col-md-8 col-12 d-flex flex-wrap gap-3 align-items-center">
              <div className="d-flex align-items-center gap-2">
                <label className="form-label m-0">Date:</label>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="form-control"
                  style={{ minWidth: "150px" }}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label m-0">Time:</label>
                <span
                  className="form-control bg-light"
                  style={{ minWidth: "120px" }}
                >
                  {time}
                </span>
              </div>
            </div>
            <div className="col-md-4 col-12 d-flex justify-content-md-end">
              <div className="d-flex align-items-center gap-2 w-100">
                <label className="form-label m-0">Transaction ID:</label>
                <input
                  type="number"
                  value={number}
                  readOnly
                  className="form-control"
                  style={{ minWidth: "150px" }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="table table-striped table-hover table-bordered border-secondary">
            <thead className="table-dark">
              <tr>
                <th>Ledgers Name</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ position: "relative" }}>
                    <input
                      className="form-control"
                      type="text"
                      value={row.accountName}
                      onChange={(e) => handleAccountNameChange(idx, e.target.value)}
                      autoComplete="off"
                      onBlur={() => setTimeout(() => { setShowSuggestionsIdx(null); setHighlightedSuggestion(-1); }, 100)}
                      onFocus={() => { row.accountName && setShowSuggestionsIdx(idx); }}
                      onKeyDown={(e) => handleAccountNameKeyDown(idx, e)}
                    />
                    {showSuggestionsIdx === idx && suggestions.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100"
                        style={{ zIndex: 10, maxHeight: "150px", overflowY: "auto" }}
                      >
                        {suggestions.map((s, sidx) => (
                          <li
                            key={s.account_id}
                            className={`list-group-item list-group-item-action${highlightedSuggestion === sidx ? ' active' : ''}`}
                            onMouseDown={() => handleSuggestionClick(idx, s.account_name, s.account_id)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span>{s.account_name}</span>
                              <small className="text-muted">
                                Balance: ${(s.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={formatNumberWithCommas(row.debit)}
                      onChange={(e) => handleDebitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDebitKeyDown(idx, e)}
                      disabled={row.credit !== ''}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={formatNumberWithCommas(row.credit)}
                      onChange={(e) => handleCreditChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCreditKeyDown(idx, e)}
                      disabled={row.debit !== ''}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-link btn-sm"
                      onClick={() => removeRow(idx)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="d-flex justify-content-end gap-3 mt-4">
            <div className="d-flex align-items-center">
              <label className="me-2">Debit Total:</label>
              <input
                type="text"
                className="form-control"
                value={formatNumberWithCommas(debitTotal)}
                readOnly
              />
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2">Credit Total:</label>
              <input
                type="text"
                className="form-control"
                value={formatNumberWithCommas(creditTotal)}
                readOnly
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mt-5 gap-3">
            <div>
              <button
                className="btn btn-success me-2"
                disabled={isSubmitDisabled || !allAccountNamesFilled || isLoading}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                disabled={isSubmitDisabled || !allAccountNamesFilled || isLoading}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-warning ms-2"
                onClick={recalculateBalances}
                disabled={isLoading}
                title="Recalculate all account balances"
              >
                Recalculate Balances
              </button>
            </div>
            <div>
              <button
                className="btn btn-success me-2"
                onClick={handleSaveAndNew}
                disabled={isSubmitDisabled || !allAccountNamesFilled || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  "Save and New"
                )}
              </button>
              <button
                className="btn btn-primary me-2"
                onClick={handleSaveAndClose}
                disabled={isSubmitDisabled || !allAccountNamesFilled || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  "Save and Close"
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={!allAccountNamesFilled || isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
