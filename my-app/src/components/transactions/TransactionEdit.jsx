import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../layout/Navbar";
import { useBusiness } from "../../context/BusinessContext";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

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
  const location = useLocation();
  const { selectedBusiness } = useBusiness();

  const [rows, setRows] = useState([]);
  const [frontendTransactionId, setFrontendTransactionId] = useState(
    location.state?.frontend_transaction_id || ""
  );
  const [transactionDate, setTransactionDate] = useState("");
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
          if (data.transaction.frontend_transaction_id) {
            setFrontendTransactionId(data.transaction.frontend_transaction_id);
          }
          if (data.transaction.date) {
            const d = new Date(data.transaction.date);
            setTransactionDate(!isNaN(d) ? d.toISOString().split("T")[0] : "");
          }
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
        console.error("Error fetching transaction:", err);
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

  const maxTotal = Math.max(debitTotal, creditTotal, 1);
  const debitRatio = debitTotal > 0 ? Math.min(100, (debitTotal / maxTotal) * 100) : 0;
  const creditRatio = creditTotal > 0 ? Math.min(100, (creditTotal / maxTotal) * 100) : 0;
  const isBalanced = debitTotal === creditTotal && debitTotal > 0;
  const displayVoucherNo = frontendTransactionId || transactionId;

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
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedSuggestion((prev) => (prev + 1) % suggestions.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestionsIdx(null);
        setHighlightedSuggestion(-1);
        return;
      }
    }

    // Handle Enter key
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestionsIdx === idx && suggestions.length > 0 && highlightedSuggestion >= 0) {
        const s = suggestions[highlightedSuggestion];
        handleSuggestionClick(idx, s);
        setHighlightedSuggestion(-1);
      } else if (rows[idx].accountName) {
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
        alert("Transaction updated successfully!");
        navigate(-1);
      } else {
        alert("Error: " + (data.message || "Failed to update transaction"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F2F5EE", minHeight: "100vh", color: "#0E1A14" }}>
      <Navbar />

      <main className="sf-wrap" style={{ paddingTop: "44px", paddingBottom: "88px" }}>
        {/* Breadcrumb */}
        <p className="text-brand-muted text-[15px] mb-3">
          <button
            type="button"
            onClick={() => navigate('/list')}
            className="hover:underline text-brand-muted cursor-pointer"
          >
            {selectedBusiness?.business_name || 'Businesses'}
          </button>
          {' / '}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hover:underline text-brand-muted cursor-pointer"
          >
            Transactions
          </button>
          {' / '}
          <span className="text-brand-ink font-medium">Edit voucher #{displayVoucherNo}</span>
        </p>

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
              Edit voucher.
            </h1>
            <p
              style={{
                color: "#44544B",
                fontSize: "18px",
                marginTop: "16px",
                maxWidth: "680px",
                lineHeight: 1.5,
              }}
            >
              Review and adjust journal entries for voucher #{displayVoucherNo}. Saving unlocks when total debits equal credits.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {selectedBusiness && (
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
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="sf-btn sf-btn-line flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Voucher Container */}
        <div className="sf-vc">
          {/* Left Voucher Stub */}
          <div className="sf-stub">
            <p className="sf-stub-cap">Voucher no.</p>
            <p className="sf-vn">#{displayVoucherNo}</p>
            <p className="sf-stub-cap" style={{ marginTop: "4px" }}>
              Permanent record in {selectedBusiness?.business_name || "active business"}.
            </p>

            <label htmlFor="dt">Transaction Date</label>
            <input
              id="dt"
              type="date"
              value={transactionDate}
              readOnly
              style={{ background: "#F2F5EE", cursor: "default" }}
            />

            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "2px dashed #0E1A14" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                <span style={{ color: "#44544B" }}>Total Entries:</span>
                <span>{rows.length} rows</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                <span style={{ color: "#44544B" }}>Status:</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    border: "1.5px solid #0E1A14",
                    background: isBalanced ? "#C8F135" : "#F2B66B",
                    color: "#0E1A14",
                  }}
                >
                  {isBalanced ? "Balanced" : "Unbalanced"}
                </span>
              </div>
            </div>
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
                    placeholder="Search a ledger..."
                    autoComplete="off"
                    onChange={(e) => handleAccountNameChange(idx, e.target.value)}
                    onBlur={() =>
                      setTimeout(() => {
                        setShowSuggestionsIdx(null);
                        setHighlightedSuggestion(-1);
                      }, 180)
                    }
                    onFocus={() => {
                      if (row.accountName) setShowSuggestionsIdx(idx);
                    }}
                    onKeyDown={(e) => handleAccountNameKeyDown(idx, e)}
                  />

                  {/* Suggestion Dropdown */}
                  {showSuggestionsIdx === idx && suggestions.length > 0 && (
                    <div className="sf-ac-dd">
                      <p>Active ledgers in {selectedBusiness?.business_name || "selected business"}</p>
                      {suggestions.map((s, sidx) => (
                        <button
                          key={s.account_id}
                          type="button"
                          className={`sf-op ${highlightedSuggestion === sidx ? "active" : ""}`}
                          onMouseDown={() => handleSuggestionClick(idx, s)}
                        >
                          <span>{s.account_name}</span>
                          <b>
                            ${Number(s.balance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {Number(s.balance || 0) >= 0 ? "Dr" : "Cr"}
                          </b>
                        </button>
                      ))}
                    </div>
                  )}

                  {row.accountName && !row.accountId && showSuggestionsIdx !== idx && (
                    <div className="text-danger small mt-1 font-semibold" style={{ color: "#E05252", fontSize: "12px", marginTop: "4px" }}>
                      Choose a valid ledger from suggestions
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
                <span className="sf-tn">${formatNumberWithCommas(debitTotal.toFixed(2))}</span>
                <div className="sf-trk">
                  <i style={{ width: `${debitRatio}%` }}></i>
                </div>
              </div>
              <div>
                <span className="sf-lb">Credit total</span>
                <span className="sf-tn">${formatNumberWithCommas(creditTotal.toFixed(2))}</span>
                <div className="sf-trk">
                  <i className={isBalanced ? "ok" : "wr"} style={{ width: `${creditRatio}%` }}></i>
                </div>
              </div>
            </div>

            {/* Balance Status Banner */}
            {rows.length === 0 ? (
              <p className="sf-st sf-idle" role="status">
                Loading voucher rows...
              </p>
            ) : isBalanced ? (
              <p className="sf-st sf-ok" role="status">
                ✓ Balanced. Debits equal credits (${formatNumberWithCommas(debitTotal.toFixed(2))}), you can save changes.
              </p>
            ) : (
              <p className="sf-st sf-bad" role="status">
                ⚠ Unbalanced. Difference: ${formatNumberWithCommas(Math.abs(debitTotal - creditTotal).toFixed(2))} (
                {debitTotal > creditTotal ? "Debits exceed Credits" : "Credits exceed Debits"}).
              </p>
            )}

            {/* Action Buttons */}
            <div className="sf-acts2">
              <button
                type="button"
                className="sf-btn sf-btn-lime flex items-center gap-2"
                style={
                  isSubmitDisabled || isLoading
                    ? { opacity: 0.45, cursor: "not-allowed", transform: "none" }
                    : {}
                }
                onClick={handleSave}
                disabled={isSubmitDisabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0E1A14] border-t-transparent"></div>
                    <span>Saving changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="sf-btn sf-btn-line"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
