import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";

// Helper to format numbers with commas
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
  const [isLoading, setIsLoading] = useState(false);

  // Search/Suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsIdx, setShowSuggestionsIdx] = useState(null);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);

  useEffect(() => {
    if (!transactionId || !selectedBusiness?.business_id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/edit-transaction/${transactionId}/${selectedBusiness.business_id}`
        );
        const data = await res.json();

        if (data.success && data.transaction) {
          setRows(
            data.transaction.entries.map((e) => ({
              entryId: e.entry_id,
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

  const debitTotal = rows.reduce((a, b) => a + (Number(b.debit) || 0), 0);
  const creditTotal = rows.reduce((a, b) => a + (Number(b.credit) || 0), 0);

  const hasInvalidLedger = rows.some(
    (r) => (r.debit || r.credit) && (!r.accountId || !r.accountName)
  );

  const isSubmitDisabled =
    rows.length === 0 ||
    debitTotal === 0 ||
    creditTotal === 0 ||
    debitTotal !== creditTotal ||
    hasInvalidLedger;

  // --- Handlers ---

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { entryId: null, accountName: "", accountId: null, debit: "", credit: "" },
    ]);
  };

  const removeRow = (idx) => {
    if (rows.length <= 2) return; // Keep at least 2 rows
    setRows(rows.filter((_, i) => i !== idx));
  };

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

  // --- Search & Suggestion Logic (Matches TransactionForm) ---

  const handleAccountNameChange = async (idx, value) => {
    const newRows = [...rows];
    newRows[idx].accountName = value;
    newRows[idx].accountId = undefined; // Reset ID on change
    setRows(newRows);
    setHighlightedSuggestion(-1);

    if (value.length > 0) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/search-accounts?query=${encodeURIComponent(
            value
          )}&business_id=${selectedBusiness?.business_id || ""}`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
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

  const handleSuggestionClick = (idx, acc) => {
    const newRows = [...rows];
    newRows[idx].accountId = acc.account_id;
    newRows[idx].accountName = acc.account_name;
    setRows(newRows);
    setSuggestions([]);
    setShowSuggestionsIdx(null);
    setHighlightedSuggestion(-1);
  };

  const handleAccountNameKeyDown = (idx, e) => {
    // Handle navigation keys if suggestions are visible
    if (showSuggestionsIdx === idx && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedSuggestion((prev) => (prev + 1) % suggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestionsIdx(null);
        setHighlightedSuggestion(-1);
        return;
      }
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent accidental form submit
      // 1. Select suggestion if highlighted
      if (showSuggestionsIdx === idx && suggestions.length > 0 && highlightedSuggestion >= 0) {
        const s = suggestions[highlightedSuggestion];
        handleSuggestionClick(idx, s);
        setHighlightedSuggestion(-1);
      }
      // 2. Otherwise, add new row if account name exists (User Request)
      else if (rows[idx].accountName) {
        addRow();
      }
    }
  };

  const handleDebitKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].debit) {
      addRow();
    }
  };

  const handleCreditKeyDown = (idx, e) => {
    if (e.key === "Enter" && rows[idx].accountName && rows[idx].credit) {
      addRow();
    }
  };


  // --- Save Logic ---

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        entries: rows
          .filter((r) => (r.debit || r.credit) && r.accountId)
          .map((r) =>
            r.debit
              ? { entry_id: r.entryId, account_id: r.accountId, amount: r.debit, type: "debit" }
              : { entry_id: r.entryId, account_id: r.accountId, amount: r.credit, type: "credit" }
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
    <div
      className="min-h-screen relative overflow-hidden bg-slate-900"
      style={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden"
      }}
    >
      {/* BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 via-transparent to-cyan-800/20"></div>

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

        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>

          <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
            <defs>
              <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              d="M100,100 L300,200 L600,150 L900,300 L1200,200"
              stroke="url(#networkGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M200,400 L500,300 L800,450 L1100,350"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>

        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full min-h-screen pb-10">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-sm shadow sm:rounded-2xl p-6 border border-white/20 mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Transaction</h2>

            <table className="table table-striped table-hover table-bordered border-secondary mt-3">
          <thead className="table-dark">
            <tr>
              <th>Ledger Name</th>
              <th>Debit</th>
              <th>Credit</th>
              <th className="text-center" style={{ width: "80px" }}>Remove</th>
            </tr>
          </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control"
                          value={row.accountName}
                          onChange={(e) => handleAccountNameChange(idx, e.target.value)}
                          onKeyDown={(e) => handleAccountNameKeyDown(idx, e)}
                          onFocus={() => { if (row.accountName) setShowSuggestionsIdx(idx); }}
                          onBlur={() => setTimeout(() => { setShowSuggestionsIdx(null); setHighlightedSuggestion(-1); }, 200)}
                          autoComplete="off"
                        />
                        {showSuggestionsIdx === idx && suggestions.length > 0 && (
                          <ul
                      className="list-group position-absolute shadow"
                      style={{ zIndex: 10, maxHeight: "200px", overflowY: "auto", minWidth: "100%", width: "max-content", maxWidth: "85vw", top: "100%" }}
                    >
                            {suggestions.map((s, sidx) => (
                              <li
                                key={s.account_id}
                                className={`list-group-item list-group-item-action ${highlightedSuggestion === sidx ? 'active' : ''}`}
                                onMouseDown={() => handleSuggestionClick(idx, s)}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                                  <span>{s.account_name}</span>
                                  <small className={highlightedSuggestion === sidx ? 'text-white' : 'text-muted'}>
                                    Balance: ${(s.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </small>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                        {row.accountName && !row.accountId && showSuggestionsIdx !== idx && (
                          <div className="text-danger small mt-1">Choose a valid ledger</div>
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
                      <td className="text-center align-middle">
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger"
                          onClick={() => removeRow(idx)}
                          title="Remove row"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
        </table>

            <div className="mt-2 text-end">
              <button className="btn btn-outline-secondary btn-sm" onClick={addRow}>
                + Add Row
              </button>
            </div>

            <div className="d-flex flex-wrap justify-content-end gap-3 mt-4">
              <div className="d-flex align-items-center">
                <label className="me-2 fw-bold">Debit Total:</label>
                <input
                  type="text"
                  className="form-control text-end"
                  value={formatNumberWithCommas(debitTotal)}
                  readOnly
                  style={{ width: "150px" }}
                />
              </div>
              <div className="d-flex align-items-center">
                <label className="me-2 fw-bold">Credit Total:</label>
                <input
                  type="text"
                  className="form-control text-end"
                  value={formatNumberWithCommas(creditTotal)}
                  readOnly
                  style={{ width: "150px" }}
                />
              </div>
            </div>

            <div className="mt-5 d-flex gap-2">
              <button
                className="btn btn-primary px-4"
                onClick={handleSave}
                disabled={isSubmitDisabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : "Save Changes"}
              </button>
              <button className="btn btn-secondary px-4" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
