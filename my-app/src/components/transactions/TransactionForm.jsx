import React, { useState, useEffect } from "react";
import Navbar from "../layout/Navbar";

export default function TransectionForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [number, setNumber] = useState(1);

  // Each row: { accountName: '', debit: '', credit: '' }
  const [rows, setRows] = useState([
    { accountName: "", debit: "", credit: "" },
    { accountName: "", debit: "", credit: "" },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsIdx, setShowSuggestionsIdx] = useState(null);

  // Totals
  const debitTotal = rows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = rows.reduce((a, b) => a + (Number(b.credit) || 0), 0);
  const isSubmitDisabled =
    debitTotal === 0 || creditTotal === 0 || debitTotal !== creditTotal;

  // Helper to get value from localStorage
  const getNumber = () => {
    let stored = localStorage.getItem("myNumber");
    let num = stored ? parseInt(stored, 10) : 1;
    return num;
  };

  // Helper to increment value in localStorage
  const incrementNumber = () => {
    let num = getNumber() + 1;
    localStorage.setItem("myNumber", num);
    setNumber(num);
  };

  useEffect(() => {
    const now = new Date();
    // Format date as YYYY-MM-DD for input type="date"
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
    setTime(now.toLocaleTimeString());
    setNumber(getNumber());
  }, []);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  // Submit handler to send transaction data to backend
  const handleSubmit = async (onSuccess) => {
    // Prepare entries array
    const entries = rows
      .filter((row) => row.accountId && (row.debit || row.credit))
      .map((row) => {
        return row.debit
          ? { account_id: row.accountId, amount: row.debit, type: "debit" }
          : { account_id: row.accountId, amount: row.credit, type: "credit" };
      });

    // Calculate totals for validation
    const debitTotal = rows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
    const creditTotal = rows.reduce((a, b) => a + (Number(b.credit) || 0), 0);

    // Validate that debit and credit totals match
    if (debitTotal !== creditTotal) {
      alert("Debit and Credit totals must match.");
      return;
    }

    const payload = {
      transaction_id: number,
      business_id: 1, // Replace with actual business_id
      description: "", // Add description if needed
      debit: debitTotal, // Send debit total
      credit: creditTotal, // Send credit total
      date,
      entries,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert("Error: " + (data.error || "Failed to save transaction."));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  const handleSaveAndNew = () => {
    handleSubmit(() => {
      incrementNumber();
      setRows([{ accountName: "", debit: "", credit: "" }]);
      setSuggestions([]);
      setShowSuggestionsIdx(null);
      const now = new Date();
      setDate(now.toISOString().split("T")[0]);
      setTime(now.toLocaleTimeString());
    });
  };

  const handleSaveAndClose = () => {
    handleSubmit(() => {
      incrementNumber();
      window.history.back();
    });
  };

  const handleClose = () => {
    incrementNumber();
    window.history.back();
  };

  // Live search handler
  const handleAccountNameChange = async (idx, value) => {
    const newRows = [...rows];
    newRows[idx].accountName = value;
    setRows(newRows);

    if (value.length > 0) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/search-accounts?query=${encodeURIComponent(
            value
          )}`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestionsIdx(idx);
      } catch (err) {
        setSuggestions([]);
        setShowSuggestionsIdx(null);
      }
    } else {
      setSuggestions([]);
      setShowSuggestionsIdx(null);
    }
  };

  // When a suggestion is clicked, store both account_id and account_name
  const handleSuggestionClick = (idx, name, id) => {
    const newRows = [...rows];
    newRows[idx].accountName = name;
    newRows[idx].accountId = id;
    setRows(newRows);
    setSuggestions([]);
    setShowSuggestionsIdx(null);
  };

  // Add new row
  const addRow = () => {
    setRows([...rows, { accountName: "", debit: "", credit: "" }]);
  };

  // Remove row
  const removeRow = (idx) => {
    const newRows = rows.filter((_, i) => i !== idx);
    setRows(
      newRows.length ? newRows : [{ accountName: "", debit: "", credit: "" }]
    );
  };

  // Debit/Credit input handlers
  const handleDebitChange = (idx, value) => {
    const newRows = [...rows];
    newRows[idx].debit = value;
    setRows(newRows);
  };

  const handleCreditChange = (idx, value) => {
    const newRows = [...rows];
    newRows[idx].credit = value;
    setRows(newRows);
  };

  // Enter key handler for debit
  const handleDebitKeyDown = (idx, e) => {
    if (e.key === "Enter") {
      // Only add row if current row has at least accountName and debit
      if (rows[idx].accountName && rows[idx].debit) {
        addRow();
      }
    }
  };

  // Enter key handler for credit
  const handleCreditKeyDown = (idx, e) => {
    if (e.key === "Enter") {
      // Only add row if current row has at least accountName and credit
      if (rows[idx].accountName && rows[idx].credit) {
        addRow();
      }
    }
  };

  // Helper to check if all account name cells are filled
  const allAccountNamesFilled = rows.every(
    (row) => row.accountName.trim() !== ""
  );

  return (
    <div>
      <Navbar />
      <div
        className="container mt-5 text-bg-light p-3"
        style={{ width: "70vw", minWidth: "600px" }}
      >
        <h1>Transaction Form</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "23vh",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <div>
              <label className="mx-2">Date: </label>
              <input type="date" value={date} onChange={handleDateChange} />
            </div>
            <div>
              <label className="mx-2">Time: </label>
              <span>{time}</span>
            </div>
          </div>
          <div>
            <div>
              <label className="mx-2">Transaction ID: </label>
              <input type="number" value={number} readOnly />
            </div>
          </div>
        </div>
        <table className="table table-striped table-hover table-bordered border-secondary">
          <thead className="table-dark">
            <tr>
              <th scope="col">Account name</th>
              <th scope="col">Debit</th>
              <th scope="col">Credit</th>
              <th scope="col">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ position: "relative" }}>
                  <input
                    className="AccountName"
                    style={{ width: "100%" }}
                    type="text"
                    value={row.accountName}
                    onChange={(e) =>
                      handleAccountNameChange(idx, e.target.value)
                    }
                    autoComplete="off"
                    onBlur={() =>
                      setTimeout(() => setShowSuggestionsIdx(null), 100)
                    }
                    onFocus={() =>
                      row.accountName && setShowSuggestionsIdx(idx)
                    }
                  />
                  {showSuggestionsIdx === idx && suggestions.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid #ccc",
                        zIndex: 10,
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {suggestions.map((s) => (
                        <li
                          key={s.account_id}
                          style={{ padding: "5px", cursor: "pointer" }}
                          onMouseDown={() =>
                            handleSuggestionClick(
                              idx,
                              s.account_name,
                              s.account_id
                            )
                          }
                        >
                          {s.account_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    value={row.debit}
                    onChange={(e) => handleDebitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDebitKeyDown(idx, e)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    value={row.credit}
                    onChange={(e) => handleCreditChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCreditKeyDown(idx, e)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-link btn-sm px-3"
                    data-mdb-ripple-init
                    data-ripple-color="primary"
                    onClick={() => removeRow(idx)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            marginTop: "40px",
            justifyContent: "flex-end",
          }}
        >
          <div>
            <label className="mx-2">Debit Total: </label>
            <input type="number" value={debitTotal} readOnly />
          </div>
          <div>
            <label className="mx-2">Credit Total: </label>
            <input type="number" value={creditTotal} readOnly />
          </div>
        </div>
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <button
              className="btn btn-success"
              style={{ marginRight: "10px" }}
              disabled={isSubmitDisabled || !allAccountNamesFilled}
            >
              Edit
            </button>
            <button
              className="btn btn-primary"
              style={{ marginRight: "10px" }}
              disabled={isSubmitDisabled || !allAccountNamesFilled}
            >
              Delete
            </button>
          </div>
          <div>
            <button
              className="btn btn-success"
              style={{ marginRight: "10px" }}
              onClick={handleSaveAndNew}
              disabled={isSubmitDisabled || !allAccountNamesFilled}
            >
              Save and New
            </button>
            <button
              className="btn btn-primary"
              style={{ marginRight: "10px" }}
              onClick={handleSaveAndClose}
              disabled={isSubmitDisabled || !allAccountNamesFilled}
            >
              Save and Close
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={!allAccountNamesFilled}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
