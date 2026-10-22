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
  if (value === null || value === undefined || value === "") return "";
  const parts = value.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
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
  const validRows = rows.filter(
    (row) => row.accountName.trim() !== "" && (row.debit !== "" || row.credit !== "")
  );

  const debitTotal = validRows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = validRows.reduce((a, b) => a + (Number(b.credit) || 0), 0);
  const isSubmitDisabled =
    validRows.length === 0 || debitTotal === 0 || creditTotal === 0 || debitTotal !== creditTotal;

  const allAccountNamesFilled = validRows.every((row) => row.accountName.trim() !== "");
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
      console.error("Error fetching next transaction ID:", err);
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessData({
          transactionId: number,
          date,
          debitTotal,
          creditTotal,
          rowsCount: rows.filter((r) => r.accountName && (r.debit || r.credit)).length,
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
    try {
      const audio = new Audio("/success.mp3");
      audio.play().catch(() => {});
    } catch {
      // Audio playback might be restricted without direct user trigger
    }
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

  const handleClose = () => {
    incrementNumber().then(() => {
      window.history.back();
    });
  };

  const handleAccountNameKeyDown = (idx, e) => {
    if (showSuggestionsIdx !== idx || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedSuggestion >= 0 && highlightedSuggestion < suggestions.length) {
        const s = suggestions[highlightedSuggestion];
        handleSuggestionClick(idx, s.account_name, s.account_id);
        setHighlightedSuggestion(-1);
      }
    } else if (e.key === "Escape") {
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

  const addRow = () => setRows([...rows, { accountName: "", debit: "", credit: "" }]);

  const removeRow = (idx) => {
    if (rows.length <= 2) return; // Keep at least 2 rows
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleDebitChange = (idx, value) => {
    const raw = value.replace(/,/g, "");
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== "") return; // Only allow numbers
    const newRows = [...rows];
    newRows[idx].debit = raw;
    if (raw !== "") {
      newRows[idx].credit = "";
    }
    setRows(newRows);
  };

  const handleCreditChange = (idx, value) => {
    const raw = value.replace(/,/g, "");
    if (!/^\d*(\.\d*)?$/.test(raw) && raw !== "") return; // Only allow numbers
    const newRows = [...rows];
    newRows[idx].credit = raw;
    if (raw !== "") {
      newRows[idx].debit = "";
    }
    setRows(newRows);
  };

  const handleDebitKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].debit) addRow();
  };

  const handleCreditKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].credit) addRow();
  };

  const maxTotal = Math.max(debitTotal, creditTotal, 1);
  const debitRatio = debitTotal > 0 ? Math.min(100, (debitTotal / maxTotal) * 100) : 0;
  const creditRatio = creditTotal > 0 ? Math.min(100, (creditTotal / maxTotal) * 100) : 0;
  const isBalanced = debitTotal === creditTotal && debitTotal > 0;

  return (
    <div style={{ backgroundColor: "#F2F5EE", minHeight: "100vh", color: "#0E1A14" }}>
      <Navbar />

      <main className="sf-wrap" style={{ paddingTop: "44px", paddingBottom: "88px" }}>
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: "clamp(42px, 6vw, 76px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                margin: 0,
                color: "#0E1A14",
              }}
            >
              Post a transaction.
            </h1>
            <p
              style={{
                color: "#44544B",
                fontSize: "20px",
                marginTop: "16px",
                maxWidth: "680px",
                lineHeight: 1.5,
              }}
            >
              One voucher, as many rows as it needs. Saving stays locked until debits equal credits.
            </p>
          </div>
          {selectedBusiness && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  padding: "8px 14px",
                  border: "2px solid #0E1A14",
                  borderRadius: "6px",
                  background: "#fff",
                  fontWeight: 600,
                  fontSize: "15px",
                  boxShadow: "3px 3px 0 #0E1A14",
                }}
              >
                {selectedBusiness.business_name}
              </span>
            </div>
          )}
        </div>

        {/* Voucher Container */}
        <div className="sf-vc">
          {/* Left Voucher Stub */}
          <div className="sf-stub">
            <p className="sf-stub-cap">Voucher no.</p>
            <p className="sf-vn">{number}</p>
            <p className="sf-stub-cap" style={{ marginTop: "4px" }}>
              Numbered for you, one after the last in {selectedBusiness?.business_name || "active business"}.
            </p>

            <label htmlFor="dt">Date</label>
            <input id="dt" type="date" value={date} onChange={handleDateChange} />

            <label htmlFor="tm">Time</label>
            <input id="tm" type="text" value={time} readOnly />
          </div>

          {/* Right Voucher Body */}
          <div className="sf-vbody">
            {/* Header Columns */}
            <div className="sf-r3 sf-hd3">
              <span>Ledger name</span>
              <span style={{ textAlign: "right" }}>Debit (PKR)</span>
              <span style={{ textAlign: "right" }}>Credit (PKR)</span>
              <span></span>
            </div>

            {/* Entry Rows */}
            {rows.map((row, idx) => (
              <div className="sf-r3" key={idx}>
                {/* Ledger selector */}
                <div className="sf-ac">
                  <input
                    type="text"
                    value={row.accountName}
                    placeholder="Search a ledger…"
                    autoComplete="off"
                    onChange={(e) => handleAccountNameChange(idx, e.target.value)}
                    onBlur={() =>
                      setTimeout(() => {
                        setShowSuggestionsIdx(null);
                        setHighlightedSuggestion(-1);
                      }, 150)
                    }
                    onFocus={() => {
                      if (row.accountName) setShowSuggestionsIdx(idx);
                    }}
                    onKeyDown={(e) => handleAccountNameKeyDown(idx, e)}
                  />
                  {showSuggestionsIdx === idx && suggestions.length > 0 && (
                    <div className="sf-ac-dd">
                      <p>Active ledgers in {selectedBusiness?.business_name || "selected business"}</p>
                      {suggestions.map((s, sidx) => (
                        <button
                          key={s.account_id}
                          type="button"
                          className={`sf-op ${highlightedSuggestion === sidx ? "active" : ""}`}
                          onMouseDown={() => handleSuggestionClick(idx, s.account_name, s.account_id)}
                        >
                          <span>{s.account_name}</span>
                          <b>
                            PKR {Number(s.balance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {Number(s.balance || 0) >= 0 ? "Dr" : "Cr"}
                          </b>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Debit Input */}
                <div>
                  <input
                    className="sf-am"
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(row.debit)}
                    placeholder="0.00"
                    disabled={row.credit !== ""}
                    onChange={(e) => handleDebitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDebitKeyDown(idx, e)}
                  />
                </div>

                {/* Credit Input */}
                <div>
                  <input
                    className="sf-am"
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(row.credit)}
                    placeholder="0.00"
                    disabled={row.debit !== ""}
                    onChange={(e) => handleCreditChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCreditKeyDown(idx, e)}
                  />
                </div>

                {/* Remove Row Button */}
                <button
                  type="button"
                  className="sf-rm"
                  aria-label="Remove row"
                  disabled={rows.length <= 2}
                  onClick={() => removeRow(idx)}
                  title={rows.length <= 2 ? "A voucher requires at least two rows" : "Remove entry"}
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Row Controls */}
            <div className="sf-addr">
              <button
                type="button"
                className="sf-lk"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid #0E1A14",
                  cursor: "pointer",
                  padding: "0 0 2px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  color: "#0E1A14",
                }}
                onClick={addRow}
              >
                + Add row
              </button>
              <p style={{ color: "#44544B", fontSize: "14px", margin: 0 }}>
                Typing a debit locks the credit on that row, and the other way round.
              </p>
            </div>

            {/* Running Totals */}
            <div className="sf-tots">
              <div>
                <span className="sf-lb">Debit total</span>
                <span className="sf-tn">PKR {formatNumberWithCommas(debitTotal.toFixed(2))}</span>
                <div className="sf-trk">
                  <i style={{ width: `${debitRatio}%` }}></i>
                </div>
              </div>
              <div>
                <span className="sf-lb">Credit total</span>
                <span className="sf-tn">PKR {formatNumberWithCommas(creditTotal.toFixed(2))}</span>
                <div className="sf-trk">
                  <i className={isBalanced ? "ok" : "wr"} style={{ width: `${creditRatio}%` }}></i>
                </div>
              </div>
            </div>

            {/* Balance Status Banner */}
            {validRows.length === 0 ? (
              <p className="sf-st sf-idle" role="status">
                Enter ledger entries to balance the voucher.
              </p>
            ) : isBalanced ? (
              <p className="sf-st sf-ok" role="status">
                ✓ Balanced. Debits equal credits (PKR {formatNumberWithCommas(debitTotal.toFixed(2))}), so you can save.
              </p>
            ) : (
              <p className="sf-st sf-bad" role="status">
                ⚠ Unbalanced. Difference: PKR {formatNumberWithCommas(Math.abs(debitTotal - creditTotal).toFixed(2))} (
                {debitTotal > creditTotal ? "Debits exceed Credits" : "Credits exceed Debits"}).
              </p>
            )}

            {/* Action Buttons */}
            <div className="sf-acts2">
              <button
                type="button"
                className="sf-btn sf-btn-lime"
                style={
                  isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading
                    ? { opacity: 0.45, cursor: "not-allowed", transform: "none" }
                    : {}
                }
                onClick={handleSaveAndNew}
                disabled={isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading}
              >
                {isLoading && submitMode === "new" ? "Saving…" : "Save and New"}
              </button>

              <button
                type="button"
                className="sf-btn sf-btn-ink"
                style={
                  isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading
                    ? { opacity: 0.45, cursor: "not-allowed", transform: "none" }
                    : {}
                }
                onClick={handleSaveAndClose}
                disabled={isSubmitDisabled || !allAccountNamesFilled || !allAccountsValid || isLoading}
              >
                {isLoading && submitMode === "close" ? "Saving…" : "Save and Close"}
              </button>

              <button
                type="button"
                className="sf-btn sf-btn-line"
                onClick={handleClose}
                disabled={isLoading}
              >
                Close
              </button>

              <details className="sf-rc">
                <summary>Recalculate balances</summary>
                <div className="sf-rcb">
                  <p style={{ margin: 0, lineHeight: 1.4 }}>
                    Re-computes every ledger balance in {selectedBusiness?.business_name || "active business"} from
                    its entries. Use it only if balances ever look wrong.
                  </p>
                  <button
                    type="button"
                    className="sf-btn sf-btn-ink"
                    style={{ minHeight: "44px", marginTop: "12px", width: "100%", fontSize: "15px" }}
                    onClick={recalculateBalances}
                    disabled={isLoading}
                  >
                    Recalculate all ledgers
                  </button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && successData && (
          <motion.div
            className="sf-vmdl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="sf-vmc"
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="sf-vmh">
                <span>Saved. Ledger balances updated.</span>
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "18px",
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#0E1A14",
                    lineHeight: 1,
                  }}
                  aria-label="Dismiss modal"
                >
                  ✕
                </button>
              </div>
              <div className="sf-vmb">
                <p
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 800,
                    fontSize: "40px",
                    letterSpacing: "-0.04em",
                    margin: "0 0 16px",
                    color: "#0E1A14",
                  }}
                >
                  Voucher {successData.transactionId}
                </p>
                <dl>
                  <div>
                    <dt>Total amount</dt>
                    <dd>PKR {formatNumberWithCommas(Number(successData.debitTotal).toFixed(2))}</dd>
                  </div>
                  <div>
                    <dt>Entries</dt>
                    <dd>{successData.rowsCount}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{new Date(successData.date).toLocaleDateString()}</dd>
                  </div>
                </dl>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    marginTop: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  {submitMode !== "close" && (
                    <button
                      type="button"
                      className="sf-btn sf-btn-lime"
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
                      New transaction
                    </button>
                  )}
                  <button
                    type="button"
                    className="sf-btn sf-btn-ink"
                    onClick={async () => {
                      setShowSuccess(false);
                      await incrementNumber();
                      window.history.back();
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
