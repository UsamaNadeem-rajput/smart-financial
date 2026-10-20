import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Save, ArrowLeft, HelpCircle, Check, BookOpen, AlertTriangle } from 'lucide-react';

const CreateNewAccount = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [subAccountOptions, setSubAccountOptions] = useState([]);
  const [accountSuggestions, setAccountSuggestions] = useState([]);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    account_name: '',
    type_id: '',
    parent_account_id: '',
    description: '',
    is_sub_account: false,
    add_opening_balance: false,
    debit_amount: '',
    credit_amount: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    initialize();
  }, [selectedBusiness]);

  useEffect(() => {
    if (formData.type_id) {
      generateAccountSuggestions();
    }
  }, [formData.type_id]);

  const initialize = async () => {
    if (!selectedBusiness) {
      navigate('/list');
      return;
    }
    // Using static types since API might fail on production
    setAccountTypes([
      { type_id: 1, type_name: 'Income', parent_type_id: null, is_subtype: false },
      { type_id: 2, type_name: 'Expense', parent_type_id: null, is_subtype: false },
      { type_id: 3, type_name: 'Assets', parent_type_id: null, is_subtype: false, is_heading: true },
      { type_id: 4, type_name: 'Fixed Assets', parent_type_id: 3, is_subtype: true },
      { type_id: 5, type_name: 'Current Assets', parent_type_id: 3, is_subtype: true },
      { type_id: 6, type_name: 'Liability', parent_type_id: null, is_subtype: false, is_heading: true },
      { type_id: 7, type_name: 'Current Liability', parent_type_id: 6, is_subtype: true },
      { type_id: 8, type_name: 'Non-Current Liabilities', parent_type_id: 6, is_subtype: true },
      { type_id: 9, type_name: 'Equity', parent_type_id: null, is_subtype: false },
      { type_id: 10, type_name: 'Others', parent_type_id: null, is_subtype: false, is_heading: true },
      { type_id: 11, type_name: 'Other Assets', parent_type_id: 10, is_subtype: true },
      { type_id: 12, type_name: 'Other Incomes', parent_type_id: 10, is_subtype: true },
      { type_id: 13, type_name: 'Other Expenses', parent_type_id: 10, is_subtype: true },
      { type_id: 14, type_name: 'Cost Of Goods Sold', parent_type_id: 10, is_subtype: true }
    ]);
    fetchExistingAccounts();
  };

  const fetchExistingAccounts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/accounts-list/${selectedBusiness.business_id}`, {
        withCredentials: true
      });
      setSubAccountOptions(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch existing accounts:', error);
      setSubAccountOptions([]);
    }
  };

  const generateAccountSuggestions = () => {
    const selectedType = accountTypes.find(type => type.type_id == formData.type_id);
    if (!selectedType) return;

    const suggestions = {
      Income: ["Sales Revenue", "Service Revenue", "Commission Earned", "Fees Received", "Consulting Income"],
      Expense: ["Salaries & Wages", "Rent Expense", "Utilities Expense", "Depreciation Expense", "Insurance Expense", "Advertising Expense", "Office Supplies Expense", "Repairs & Maintenance"],
      "Fixed Assets": ["Land", "Building", "Machinery", "Furniture & Fixtures", "Office Equipment", "Vehicle", "Computers", "Accumulated Depreciation Building"],
      "Current Assets": ["Cash", "Bank", "Accounts Receivable / Debtors", "Inventory", "Prepaid Insurance", "Short-term Investments", "Bills Receivable", "Accrued Income"],
      "Current Liability": ["Accounts Payable/ Creditors", "Accrued Expenses", "Bills Payable", "Short-term Loans", "Unearned Revenue", "Bank Overdraft", "Interest Payable", "Salary Payable", "Dividend Payable"],
      "Non-Current Liabilities": ["Long-term Loan", "Mortgage Payable", "Bonds Payable", "Deferred Tax Liability", "Lease Obligation", "Provision for Gratuity", "Debentures"],
      "Other Assets": ["Prepaid Expense", "Deferred Tax Asset"],
      "Other Incomes": ["Dividend Income", "Interest Income", "Rent Income (non-core)", "Gain on Sale of Asset", "Miscellaneous Income", "Recovery of Bad Debts"],
      "Other Expenses": ["Loss on Sale of Assets"],
      "Cost Of Goods Sold": ["Purchases", "Raw Materials", "Direct Labor", "Cost Of Goods Sold"],
      "Equity": ["Capital (for sole proprietorship)", "Drawings", "Share Capital", "Share Premium", "Retained Earnings", "Reserves", "Revaluation Surplus"],
    };

    setAccountSuggestions(suggestions[selectedType.type_name] || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Digit Grouping for Amount Fields
      if (name === 'debit_amount' || name === 'credit_amount') {
        // Remove existing commas to get raw number
        const rawValue = value.replace(/,/g, '');
        if (!isNaN(rawValue) && rawValue !== '') {
          // Format with commas
          newData[name] = Number(rawValue).toLocaleString('en-US');
        } else if (rawValue === '') {
          newData[name] = '';
        } else {
          // Invalid input, don't update (effectively blocks non-numeric)
          return prev;
        }
      }

      // Mutual exclusivity for debit/credit inputs
      if (name === 'debit_amount' && newData.debit_amount) {
        newData.credit_amount = '';
      } else if (name === 'credit_amount' && newData.credit_amount) {
        newData.debit_amount = '';
      }

      return newData;
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      account_name: suggestion
    }));
    if (errors.account_name) {
      setErrors(prev => ({ ...prev, account_name: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }

    if (!formData.type_id) {
      newErrors.type_id = 'Account type is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const accountData = {
        ...formData,
        business_id: selectedBusiness.business_id,
        // Send separate fields as requested (parse commas out)
        opening_balance_debit: formData.add_opening_balance ? (parseFloat(formData.debit_amount.replace(/,/g, '')) || 0) : 0,
        opening_balance_credit: formData.add_opening_balance ? (parseFloat(formData.credit_amount.replace(/,/g, '')) || 0) : 0
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/createnewaccount`, accountData, {
        withCredentials: true
      });

      navigate('/showbusinessaccount');
    } catch (error) {
      console.error('Failed to create account:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create account. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAccountTypes = () => {
    return accountTypes.filter(type => !type.is_subtype && !type.is_heading);
  };

  const getSubTypes = (parentTypeId) => {
    return accountTypes.filter(type => type.parent_type_id === parentTypeId);
  };

  const getFilteredSubAccountOptions = () => {
    if (!formData.type_id) return [];
    return subAccountOptions.filter(account => account.type_id == formData.type_id);
  };

  const getAccountNature = (typeId) => {
    // 1=Income, 2=Expense, 3=Assets, 4=Fixed Assets, 5=Current Assets, 
    // 6=Liability, 7=Current Lia, 8=Non-Current Lia, 9=Equity, 
    // 11=Other Assets, 12=Other Income, 13=Other Expense, 14=COGS

    // Debit Nature: Assets (3,4,5,11), Expenses (2,13,14)
    const debitIds = [2, 3, 4, 5, 11, 13, 14];

    if (debitIds.includes(parseInt(typeId))) return 'Debit';
    return 'Credit'; // Income, Liability, Equity are Credit nature
  };

  const currentNature = formData.type_id ? getAccountNature(formData.type_id) : null;
  const showNatureWarning = formData.add_opening_balance && (
    (currentNature === 'Credit' && formData.debit_amount && parseFloat(formData.debit_amount.replace(/,/g, '')) > 0) ||
    (currentNature === 'Debit' && formData.credit_amount && parseFloat(formData.credit_amount.replace(/,/g, '')) > 0)
  );

  const selectedTypeObj = accountTypes.find(t => t.type_id == formData.type_id);
  const selectedParentObj = subAccountOptions.find(a => a.account_id == formData.parent_account_id);
  const filteredSubAccountOptions = getFilteredSubAccountOptions();

  return (
    <div className="min-h-screen bg-[#F2F5EE] text-[#0E1A14] font-sans">
      <Navbar />

      <main className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-8 pb-20">
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
            onClick={() => navigate('/showbusinessaccount')}
            className="hover:underline text-brand-muted cursor-pointer"
          >
            Chart of Accounts
          </button>
          {' / '}
          <span className="text-brand-ink font-medium">New ledger</span>
        </p>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-[32px] sm:text-[48px] lg:text-[64px] tracking-tight leading-[1] text-brand-ink">
              New ledger.
            </h1>
            <p className="text-brand-muted text-sm sm:text-base lg:text-lg max-w-[720px] mt-2">
              Add a new account to {selectedBusiness?.business_name ? <strong className="text-brand-ink">{selectedBusiness.business_name}</strong> : 'your chart of accounts'} to record transactions with double-entry integrity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/showbusinessaccount')}
            className="sf-btn sf-btn-line flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ledgers
          </button>
        </div>

        {/* Layout */}
        <div className="sf-cna-cols">
          {/* Main Form */}
          <form className="sf-cna-fm" onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <div className="sf-cna-warn" role="alert">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#0E1A14]" />
                <div>{errors.general}</div>
              </div>
            )}

            {/* Section 1: Classification */}
            <div className="sf-cna-sec">
              <h2>1. Ledger Classification</h2>
              <p className="sf-cna-sub">Select the primary accounting category that defines how this ledger operates.</p>

              <div className="sf-cna-fd">
                <label htmlFor="type_id" className="sf-cna-lbl">
                  Ledger Type <span aria-hidden="true">*</span>
                </label>
                <select
                  id="type_id"
                  name="type_id"
                  value={formData.type_id}
                  onChange={handleChange}
                  className={`sf-cna-select ${errors.type_id ? 'err' : ''}`}
                >
                  <option value="">Select ledger classification</option>
                  {/* Income */}
                  <optgroup label="Income">
                    <option value="1">Income</option>
                  </optgroup>

                  {/* Assets */}
                  <optgroup label="Assets">
                    <option value="4">Fixed Assets</option>
                    <option value="5">Current Assets</option>
                  </optgroup>

                  {/* Liability */}
                  <optgroup label="Liability">
                    <option value="7">Current Liability</option>
                    <option value="8">Non-Current Liabilities</option>
                  </optgroup>

                  {/* Equity */}
                  <optgroup label="Equity">
                    <option value="9">Equity</option>
                  </optgroup>

                  {/* Expense */}
                  <optgroup label="Expense">
                    <option value="2">Expense</option>
                  </optgroup>

                  {/* Others */}
                  <optgroup label="Others">
                    <option value="11">Other Assets</option>
                    <option value="12">Other Incomes</option>
                    <option value="13">Other Expenses</option>
                    <option value="14">Cost Of Goods Sold</option>
                  </optgroup>
                </select>
                {errors.type_id && (
                  <p className="sf-bf-hint">{errors.type_id}</p>
                )}
              </div>

              {currentNature && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-[#F2F5EE] border border-[#0E1A14]/20 rounded-md text-sm text-[#0E1A14]">
                  <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-[#0E1A14] text-[#C8F135]">
                    {currentNature} Nature
                  </span>
                  <span>
                    Normal balance is <strong>{currentNature} ({currentNature === 'Debit' ? 'Dr' : 'Cr'})</strong>.
                    Increases with {currentNature}s, decreases with {currentNature === 'Debit' ? 'Credit' : 'Debit'}s.
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Ledger Identity */}
            <div className="sf-cna-sec">
              <h2>2. Ledger Identity</h2>
              <p className="sf-cna-sub">Give this account a distinctive name and configure hierarchy if applicable.</p>

              <div className="sf-cna-fd">
                <label htmlFor="account_name" className="sf-cna-lbl">
                  Ledger Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="account_name"
                  name="account_name"
                  type="text"
                  value={formData.account_name}
                  onChange={handleChange}
                  className={`sf-cna-input ${errors.account_name ? 'err' : ''}`}
                  placeholder="e.g. Meezan Bank, Office Supplies, Consulting Revenue"
                />
                {errors.account_name && (
                  <p className="sf-bf-hint">{errors.account_name}</p>
                )}
              </div>

              {/* Sub-account toggle */}
              <div className="sf-cna-fd">
                <label htmlFor="is_sub_account" className="sf-cna-chk-card">
                  <input
                    id="is_sub_account"
                    name="is_sub_account"
                    type="checkbox"
                    checked={formData.is_sub_account}
                    onChange={handleChange}
                  />
                  <div className="sf-cna-chk-info">
                    <b>Make this a sub-account</b>
                    <span>Nest this ledger under an existing parent account of the same type for hierarchical grouping.</span>
                  </div>
                </label>
              </div>

              {/* Parent Account dropdown */}
              {formData.is_sub_account && (
                <div className="sf-cna-fd pl-4 border-l-2 border-[#0E1A14] mt-3">
                  <label htmlFor="parent_account_id" className="sf-cna-lbl">
                    Parent Account
                  </label>
                  {filteredSubAccountOptions.length > 0 ? (
                    <select
                      id="parent_account_id"
                      name="parent_account_id"
                      value={formData.parent_account_id}
                      onChange={handleChange}
                      className="sf-cna-select"
                    >
                      <option value="">Select parent account</option>
                      {filteredSubAccountOptions.map(account => (
                        <option key={account.account_id} value={account.account_id}>
                          {account.account_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-[#F2F5EE] border border-[#0E1A14] rounded text-sm text-[#5A6E63]">
                      No existing parent accounts available under {selectedTypeObj ? selectedTypeObj.type_name : 'this category'}. You can create primary accounts first or uncheck sub-account.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Opening Balance */}
            <div className="sf-cna-sec">
              <h2>3. Opening Balance (Optional)</h2>
              <p className="sf-cna-sub">If migrating from another accounting system, record the starting balance.</p>

              <label htmlFor="add_opening_balance" className="sf-cna-chk-card">
                <input
                  id="add_opening_balance"
                  name="add_opening_balance"
                  type="checkbox"
                  checked={formData.add_opening_balance}
                  onChange={handleChange}
                />
                <div className="sf-cna-chk-info">
                  <b>Add opening balance</b>
                  <span>Record an initial Debit or Credit balance for this ledger upon creation.</span>
                </div>
              </label>

              {formData.add_opening_balance && (
                <div className="sf-cna-bal-grid">
                  <div>
                    <label htmlFor="debit_amount" className="sf-cna-lbl">
                      Debit Amount (PKR)
                    </label>
                    <input
                      id="debit_amount"
                      name="debit_amount"
                      type="text"
                      value={formData.debit_amount}
                      onChange={handleChange}
                      className={`sf-cna-input ${showNatureWarning && formData.debit_amount ? 'err' : ''}`}
                      placeholder="0.00"
                    />
                    <span className="text-xs text-[#5A6E63] mt-1 block">Left side entry (increases assets & expenses)</span>
                  </div>
                  <div>
                    <label htmlFor="credit_amount" className="sf-cna-lbl">
                      Credit Amount (PKR)
                    </label>
                    <input
                      id="credit_amount"
                      name="credit_amount"
                      type="text"
                      value={formData.credit_amount}
                      onChange={handleChange}
                      className={`sf-cna-input ${showNatureWarning && formData.credit_amount ? 'err' : ''}`}
                      placeholder="0.00"
                    />
                    <span className="text-xs text-[#5A6E63] mt-1 block">Right side entry (increases liabilities, equity & revenue)</span>
                  </div>
                </div>
              )}

              {showNatureWarning && (
                <div className="sf-cna-warn">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#0E1A14]" />
                  <span>
                    <strong>Accounting Notice:</strong> You entered a <strong>{formData.debit_amount ? 'Debit' : 'Credit'}</strong> balance for a <strong>{currentNature}</strong> nature account. Usually, {currentNature === 'Debit' ? 'Assets & Expenses' : 'Liabilities, Equity & Income'} maintain a normal {currentNature} balance.
                  </span>
                </div>
              )}
            </div>

            {/* Section 4: Description */}
            <div className="sf-cna-sec">
              <h2>4. Description & Notes</h2>
              <p className="sf-cna-sub">Add contextual notes or reference codes for your bookkeeping team.</p>

              <div className="sf-cna-fd">
                <label htmlFor="description" className="sf-cna-lbl">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="sf-cna-textarea"
                  placeholder="Enter ledger purpose or notes (optional)"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="sf-cna-acts">
              <button
                type="button"
                onClick={() => navigate('/showbusinessaccount')}
                className="sf-btn sf-btn-line"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="sf-btn sf-btn-lime flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0E1A14] border-t-transparent"></div>
                    <span>Creating ledger...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Ledger</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sticky Sidebar (Preview & Suggestions) */}
          <aside className="sf-cna-as">
            {/* Live Ledger Card */}
            <div className="sf-cna-pv">
              <div className="sf-cna-pv-hd">
                <span>Ledger Preview</span>
                <span>{selectedBusiness?.business_name || 'Business'}</span>
              </div>

              <div className="sf-cna-pv-title">
                {formData.account_name.trim() || 'Untitled Ledger'}
              </div>

              <div className="sf-cna-pv-tags">
                <span className="sf-cna-pv-pill sf-cna-pv-pill-lime">
                  {selectedTypeObj ? selectedTypeObj.type_name : 'No Category'}
                </span>
                {currentNature && (
                  <span className="sf-cna-pv-pill sf-cna-pv-pill-dark">
                    Normal: {currentNature === 'Debit' ? 'Dr' : 'Cr'}
                  </span>
                )}
                {formData.is_sub_account && selectedParentObj && (
                  <span className="sf-cna-pv-pill sf-cna-pv-pill-dark">
                    Sub of: {selectedParentObj.account_name}
                  </span>
                )}
              </div>

              <div className="sf-cna-pv-box">
                <div className="k">Opening Balance</div>
                <div className="v">
                  {formData.add_opening_balance ? (
                    formData.debit_amount ? (
                      <span className="text-[#C8F135]">Dr PKR {formData.debit_amount}</span>
                    ) : formData.credit_amount ? (
                      <span className="text-[#C8F135]">Cr PKR {formData.credit_amount}</span>
                    ) : (
                      'PKR 0.00'
                    )
                  ) : (
                    'PKR 0.00'
                  )}
                </div>
              </div>

              {formData.description && (
                <div className="sf-cna-pv-box">
                  <div className="k">Notes</div>
                  <div className="text-xs text-[#B9C6BD] mt-1 line-clamp-3">
                    {formData.description}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Card */}
            {accountSuggestions.length > 0 && (
              <div className="sf-cna-sugg">
                <h3>Suggested Ledger Names</h3>
                <p>Click any standard accounting title to autofill:</p>
                <div className="sf-cna-chips">
                  {accountSuggestions.map((suggestion, index) => {
                    const isActive = formData.account_name === suggestion;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`sf-cna-chip ${isActive ? 'active' : ''}`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-[#0E1A14]/10">
                  <select
                    className="sf-cna-select text-xs py-2"
                    onChange={e => handleSuggestionClick(e.target.value)}
                    value={formData.account_name || ""}
                  >
                    <option value="" disabled>Or choose from list...</option>
                    {accountSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion}>{suggestion}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Double-Entry Guidance Card */}
            <div className="sf-cna-guide">
              <h4>Double-Entry Principles</h4>
              <ul>
                <li><strong>Debit (Dr):</strong> Left side. Increases Assets and Expenses.</li>
                <li><strong>Credit (Cr):</strong> Right side. Increases Liabilities, Equity, and Revenue.</li>
                <li><strong>Accounting Equation:</strong> Assets = Liabilities + Equity.</li>
                <li><strong>Self-Balancing:</strong> All journal entries must have equal Debits and Credits.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CreateNewAccount;
