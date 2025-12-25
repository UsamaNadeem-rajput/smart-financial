import { useState, useEffect } from "react";
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
          setDate(data.transaction.date);
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

  const fetchLedgerSuggestions = async (query) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/search-accounts?query=${encodeURIComponent(
          query
        )}&business_id=${selectedBusiness?.business_id || ""}`
      );
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const handleLedgerNameChange = async (idx, value) => {
    const newRows = [...rows];
    newRows[idx].accountName = value;
    newRows[idx].accountId = undefined;
    setRows(newRows);
    setHighlightedSuggestion(-1);

    if (value.length > 0) {
      const list = await fetchLedgerSuggestions(value);
      setSuggestions(list);
      setShowSuggestionsIdx(idx);
    } else {
      setSuggestions([]);
      setShowSuggestionsIdx(null);
    }
  };

  const chooseSuggestion = (idx, acc) => {
    const newRows = [...rows];
    newRows[idx].accountId = acc.account_id;
    newRows[idx].accountName = acc.account_name;
    setRows(newRows);
    setSuggestions([]);
    setShowSuggestionsIdx(null);
    setHighlightedSuggestion(-1);
  };

  const handleLedgerKeyDown = (idx, e) => {
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
        chooseSuggestion(idx, s);
      }
    } else if (e.key === "Escape") {
      setShowSuggestionsIdx(null);
      setHighlightedSuggestion(-1);
      setSuggestions([]);
    }
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { entryId: null, accountName: "", accountId: null, debit: "", credit: "" },
    ]);
  };

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
    <div className="min-h-screen relative">
      <Navbar />
      <div className="container mt-4">
        <h2>Edit Transaction</h2>


        <table className="table table-bordered mt-8">
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
                    onChange={(e) => handleLedgerNameChange(idx, e.target.value)}
                    onKeyDown={(e) => handleLedgerKeyDown(idx, e)}
                  />
                  {showSuggestionsIdx === idx && suggestions.length > 0 && (
                    <div className="list-group mt-1">
                      {suggestions.map((acc) => (
                        <button
                          key={acc.account_id}
                          type="button"
                          className="list-group-item list-group-item-action"
                          onClick={() => chooseSuggestion(idx, acc)}
                        >
                          {acc.account_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {row.accountName && !row.accountId && (
                    <div className="text-danger mt-1">Choose a valid ledger</div>
                  )}
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
        <div className="mt-2">
          <button className="btn btn-outline-secondary" onClick={addRow}>
            Add Row
          </button>
        </div>

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
