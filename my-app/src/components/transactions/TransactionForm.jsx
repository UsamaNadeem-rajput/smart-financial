import React, { useState, useEffect } from "react";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";
import { AnimatePresence, motion } from "framer-motion";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [submitMode, setSubmitMode] = useState(null);

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
  const allAccountsValid = validRows.every((row) => !!row.accountId);

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

    if (!allAccountsValid) {
      alert("One or more ledger names are invalid or not selected. Please choose from suggestions.");
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (entries.length === 0) {
      alert("No entries to save. Please add at least one valid ledger entry.");
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
        setSuccessData({
          transactionId: number,
          date,
          debitTotal,
          creditTotal,
          rowsCount: rows.filter(r => r.accountName && (r.debit || r.credit)).length,
        });
        setShowSuccess(true);
        if (typeof onSuccess === "function") onSuccess();
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
  const playSound = () => {
    const audio = new Audio("/success.mp3");
    audio.play();
  };

  const handleSaveAndNew = () => {
    playSound();
    setIsLoading(true);
    setSubmitMode("new");
    handleSubmit(async () => {
      await incrementNumber();
      setRows([
        { accountName: "", debit: "", credit: "" },
        { accountName: "", debit: "", credit: "" },
      ]);
      setSuggestions([]);
      setShowSuggestionsIdx(null);
      setDate(getLocalDateString());
      setTime(new Date().toLocaleTimeString());
    });
  };

  const handleSaveAndClose = () => {
    playSound();
    setIsLoading(true);
    setSubmitMode("close");
    handleSubmit(async () => {
      await incrementNumber();
      // Reset form on success so the background is clean
      setRows([
        { accountName: "", debit: "", credit: "" },
        { accountName: "", debit: "", credit: "" },
      ]);
      setSuggestions([]);
      setShowSuggestionsIdx(null);
      setDate(getLocalDateString());
      setTime(new Date().toLocaleTimeString());
      // Do NOT navigate back here; wait for "Close" on popup
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
    newRows[idx].accountId = undefined;
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
  const removeRow = (idx) => {
    if (rows.length <= 2) return; // Keep at least 2 rows
    setRows(rows.filter((_, i) => i !== idx));
  };

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
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          minHeight: "100vh",
          width: "100vw",
        }}
      >
        {/* Enhanced Professional Background */}
        <div className="absolute inset-0">
          {/* Primary gradient background - different from List.js */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900"></div>

          {/* Overlay gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 via-transparent to-teal-800/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-800/20 via-transparent to-emerald-800/20"></div>

          {/* Professional grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Animated transaction elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating transaction icons */}
            <div className="absolute top-20 left-10 text-4xl text-emerald-400/20 animate-pulse">💰</div>
            <div className="absolute top-40 right-20 text-3xl text-teal-400/20 animate-bounce">📊</div>
            <div className="absolute bottom-40 left-32 text-5xl text-cyan-400/20 animate-pulse">📝</div>
            <div className="absolute bottom-20 right-40 text-3xl text-green-400/20 animate-bounce">💳</div>
            <div className="absolute top-1/2 left-1/4 text-2xl text-teal-400/20 animate-pulse">📋</div>
            <div className="absolute top-1/3 right-1/3 text-4xl text-emerald-400/20 animate-bounce">🏦</div>

            {/* Subtle geometric shapes */}
            <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-emerald-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full animate-pulse"></div>

            {/* Network connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
              <defs>
                <linearGradient id="transactionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
                  <stop offset="50%" style={{ stopColor: '#14b8a6', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              <path
                d="M100,100 L300,200 L600,150 L900,300 L1200,200"
                stroke="url(#transactionGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M200,400 L500,300 L800,450 L1100,350"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth="1"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
            </svg>
          </div>

          {/* Subtle overlay for content readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
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
                    disabled={isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading}
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
                    disabled={isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading}
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
        </div>
        <AnimatePresence>
          {showSuccess && successData && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
              <motion.div
                className="relative z-10 w-[95%] max-w-xl rounded-2xl p-6 shadow-2xl"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(6, 6, 6, 0.15))",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <div className="text-lg fw-bold text-white">Transaction Saved</div>
                    <div className="text-white/70">
                      ID {successData.transactionId} · {new Date(successData.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="p-3 rounded-lg bg-white/10 text-white">
                      <div className="small text-white/70">Debit Total</div>
                      <div className="h5 mb-0">
                        {formatNumberWithCommas(successData.debitTotal)}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-lg bg-white/10 text-white">
                      <div className="small text-white/70">Credit Total</div>
                      <div className="h5 mb-0">
                        {formatNumberWithCommas(successData.creditTotal)}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-lg bg-white/10 text-white d-flex justify-content-between">
                      <div className="small text-white/70">Entries</div>
                      <div className="fw-bold">{successData.rowsCount}</div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  {submitMode !== 'close' && (
                    <button
                      className={`btn ${submitMode === "new" ? "btn-success" : "btn-outline-success"}`}
                      onClick={async () => {
                        setShowSuccess(false);
                        await incrementNumber();
                        setRows([
                          { accountName: "", debit: "", credit: "" },
                          { accountName: "", debit: "", credit: "" },
                        ]);
                        setSuggestions([]);
                        setShowSuggestionsIdx(null);
                        setDate(getLocalDateString());
                        setTime(new Date().toLocaleTimeString());
                      }}
                    >
                      Add Another
                    </button>
                  )}
                  <button
                    className={`btn ${submitMode === "close" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={async () => {
                      setShowSuccess(false);
                      await incrementNumber();
                      window.history.back();
                    }}
                  >
                    Close
                  </button>
                </div>
                <div className="position-absolute top-0 end-0 translate-middle pt-3 pe-3">
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => setShowSuccess(false)}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
