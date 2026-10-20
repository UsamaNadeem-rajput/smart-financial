import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';

const EditAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    account_name: '',
    type_id: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkAuthAndInitialize();
  }, [selectedBusiness, location.state]);

  const checkAuthAndInitialize = async () => {
    if (!selectedBusiness) {
      navigate('/list');
      return;
    }

    // Check if account data is passed from the previous page
    if (location.state?.account) {
      const account = location.state.account;
      setFormData({
        account_name: account.account_name || '',
        type_id: account.type_id || '',
        description: account.description || ''
      });
    } else {
      // If no account data, redirect back
      navigate('/showbusinessaccount');
    }

    fetchAccountTypes();
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/account-types`, {
        withCredentials: true
      });
      setAccountTypes(response.data.accountTypes || []);
    } catch (error) {
      console.error('Failed to fetch account types:', error);
      // Fallback to mock data if API fails
      const mockAccountTypes = [
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
      ];
      setAccountTypes(mockAccountTypes);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      const accountId = location.state?.account?.account_id;
      if (!accountId) {
        throw new Error('Account ID not found');
      }

      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/accounts/${accountId}`, formData, {
        withCredentials: true
      });

      navigate('/showbusinessaccount');
    } catch (error) {
      console.error('Failed to update account:', error);
      setErrors({ general: 'Failed to update account. Please try again.' });
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

  const getAccountNature = (typeId) => {
    const debitIds = [2, 3, 4, 5, 11, 13, 14];
    if (debitIds.includes(parseInt(typeId))) return 'Debit';
    return 'Credit';
  };

  const accountId = location.state?.account?.account_id;
  const selectedTypeObj = accountTypes.find(t => t.type_id == formData.type_id);
  const currentNature = formData.type_id ? getAccountNature(formData.type_id) : null;

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
          <span className="text-brand-ink font-medium">Edit ledger</span>
        </p>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-[32px] sm:text-[48px] lg:text-[64px] tracking-tight leading-[1] text-brand-ink">
              Edit ledger.
            </h1>
            <p className="text-brand-muted text-sm sm:text-base lg:text-lg max-w-[720px] mt-2">
              Update account details, classification, and status for {selectedBusiness?.business_name ? <strong className="text-brand-ink">{selectedBusiness.business_name}</strong> : 'your business'}.
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
              <p className="sf-cna-sub">Give this account a distinctive, recognizable name for your reports.</p>

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
            </div>

            {/* Section 3: Description */}
            <div className="sf-cna-sec">
              <h2>3. Description & Notes</h2>
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
                    <span>Updating ledger...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Ledger</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sticky Sidebar (Preview & Guidelines) */}
          <aside className="sf-cna-as">
            {/* Live Ledger Card */}
            <div className="sf-cna-pv">
              <div className="sf-cna-pv-hd">
                <span>Editing Ledger</span>
                <span>{accountId ? `#${accountId}` : 'Business'}</span>
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

              </div>

              <div className="sf-cna-pv-box">
                <div className="k">Account ID</div>
                <div className="v">#{accountId || '--'}</div>
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

            {/* Double-Entry Guidance Card */}
            <div className="sf-cna-guide">
              <h4>Ledger Maintenance Guidelines</h4>
              <ul>
                <li><strong>Category Consistency:</strong> Changing an account type affects historical reports (Trial Balance and Balance Sheet).</li>
                <li><strong>Debit (Dr) vs Credit (Cr):</strong> Assets & Expenses are Debit nature; Liabilities, Equity & Income are Credit nature.</li>
                <li><strong>Inactivating Accounts:</strong> Inactive accounts retain historical transactions but are hidden from daily entry dropdowns.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default EditAccount;
