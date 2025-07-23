import React, { useState, useEffect } from "react";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

// Helper to get local date string in YYYY-MM-DD
function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
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

  const { selectedBusiness } = useBusiness();

  const debitTotal = rows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = rows.reduce((a, b) => a + (Number(b.credit) || 0), 0);
  const isSubmitDisabled =
    debitTotal === 0 || creditTotal === 0 || debitTotal !== creditTotal;

  const allAccountNamesFilled = rows.every((row) => row.accountName.trim() !== "");

  const getNumber = () => {
    let stored = localStorage.getItem("myNumber");
    return stored ? parseInt(stored, 10) : 1;
  };

  const incrementNumber = () => {
    const num = getNumber() + 1;
    localStorage.setItem("myNumber", num);
    setNumber(num);
  };

  useEffect(() => {
    const now = new Date();
    setDate(getLocalDateString());
    setTime(now.toLocaleTimeString());
    setNumber(getNumber());
  }, []);

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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) onSuccess();
      else alert("Error: " + (data.error || "Failed to save transaction."));
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
      setDate(getLocalDateString());
      setTime(new Date().toLocaleTimeString());
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

  const handleAccountNameChange = async (idx, value) => {
    const newRows = [...rows];
    newRows[idx].accountName = value;
    setRows(newRows);

    if (value.length > 0) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/search-accounts?query=${encodeURIComponent(value)}&business_id=${selectedBusiness?.business_id}`
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

  const addRow = () => setRows([...rows, { accountName: "", debit: "", credit: "" }]);
  const removeRow = (idx) =>
    setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

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

  const handleDebitKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].debit) addRow();
  };

  const handleCreditKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].credit) addRow();
  };

  return (
    <div className="container">
      <Navbar />
      <div className="container my-5 text-bg-light p-4 rounded" style={{ maxWidth: "100%", minWidth: "300px" }}>
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
              <span className="form-control bg-light" style={{ minWidth: "120px" }}>
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
              <th>Account Name</th>
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
                    onBlur={() => setTimeout(() => setShowSuggestionsIdx(null), 100)}
                    onFocus={() => row.accountName && setShowSuggestionsIdx(idx)}
                  />
                  {showSuggestionsIdx === idx && suggestions.length > 0 && (
                    <ul
                      className="list-group position-absolute w-100"
                      style={{ zIndex: 10, maxHeight: "150px", overflowY: "auto" }}
                    >
                      {suggestions.map((s) => (
                        <li
                          key={s.account_id}
                          className="list-group-item list-group-item-action"
                          onMouseDown={() => handleSuggestionClick(idx, s.account_name, s.account_id)}
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
                    className="form-control"
                    value={row.debit}
                    onChange={(e) => handleDebitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDebitKeyDown(idx, e)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={row.credit}
                    onChange={(e) => handleCreditChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCreditKeyDown(idx, e)}
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
            <input type="number" className="form-control" value={debitTotal} readOnly />
          </div>
          <div className="d-flex align-items-center">
            <label className="me-2">Credit Total:</label>
            <input type="number" className="form-control" value={creditTotal} readOnly />
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mt-5 gap-3">
          <div>
            <button className="btn btn-success me-2" disabled={isSubmitDisabled || !allAccountNamesFilled}>
              Edit
            </button>
            <button className="btn btn-danger" disabled={isSubmitDisabled || !allAccountNamesFilled}>
              Delete
            </button>
          </div>
          <div>
            <button
              className="btn btn-success me-2"
              onClick={handleSaveAndNew}
              disabled={isSubmitDisabled || !allAccountNamesFilled}
            >
              Save and New
            </button>
            <button
              className="btn btn-primary me-2"
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
