import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Save, ArrowLeft, HelpCircle } from 'lucide-react';

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
    is_sub_account: false
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
    // try {
    //   // Check if user is authenticated
    //   const authResponse = await axios.get('http://localhost:5000/api/check-auth', {
    //     withCredentials: true
    //   });
      
    //   if (authResponse.data.user) {
    //     setUser(authResponse.data.user);
        if (!selectedBusiness) {
          navigate('/list');
          return;
        }
        fetchAccountTypes();
        fetchExistingAccounts();
    //   } else {
    //     navigate('/login');
    //   }
    // } catch (error) {
    //   console.error('Authentication check failed:', error);
    //   navigate('/login');
    // }
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
        { type_id: 3, type_name: 'Assets', parent_type_id: null, is_subtype: false },
        { type_id: 4, type_name: 'Fixed Assets', parent_type_id: 3, is_subtype: true },
        { type_id: 5, type_name: 'Current Assets', parent_type_id: 3, is_subtype: true },
        { type_id: 6, type_name: 'Liability', parent_type_id: null, is_subtype: false },
        { type_id: 7, type_name: 'Current Liability', parent_type_id: 6, is_subtype: true },
        { type_id: 8, type_name: 'Non-Current Liabilities', parent_type_id: 6, is_subtype: true },
        { type_id: 9, type_name: 'Equity', parent_type_id: null, is_subtype: false },
        { type_id: 10, type_name: 'Others', parent_type_id: null, is_subtype: false },
        { type_id: 11, type_name: 'Other Assets', parent_type_id: 10, is_subtype: true },
        { type_id: 12, type_name: 'Other Incomes', parent_type_id: 10, is_subtype: true },
        { type_id: 13, type_name: 'Other Expenses', parent_type_id: 10, is_subtype: true },
        { type_id: 14, type_name: 'Cost Of Goods Sold', parent_type_id: 10, is_subtype: true }
      ];
      setAccountTypes(mockAccountTypes);
    }
  };

  const fetchExistingAccounts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/list/}`, {
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
      Income: ["Sales Revenue","Service Revenue","Commission Earned","Fees Received","Consulting Income"],
        Expense: ["Salaries & Wages","Rent Expense","Utilities Expense", "Depreciation Expense","Insurance Expense","Advertising Expense","Office Supplies Expense","Repairs & Maintenance"],
        "Fixed Assets": ["Land","Building", "Machinery","Furniture & Fixtures","Office Equipment","Vehicle","Computers","Accumulated Depreciation Building"],
        "Current Assets": ["Cash", "Bank", "Accounts Receivable / Debtors","Inventory","Prepaid Insurance","Short-term Investments","Bills Receivable","Accrued Income"],
        "Current Liability": ["Accounts Payable/ Creditors", "Accrued Expenses","Bills Payable","Short-term Loans","Unearned Revenue","Bank Overdraft","Interest Payable","Salary Payable","Dividend Payable"],
        "Non-Current Liabilities": ["Long-term Loan", "Mortgage Payable", "Bonds Payable", "Deferred Tax Liability", "Lease Obligation","Provision for Gratuity","Debentures"],
        "Other Assets": ["Prepaid Expense", "Deferred Tax Asset"],
        "Other Incomes": ["Dividend Income","Interest Income","Rent Income (non-core)","Gain on Sale of Asset","Miscellaneous Income","Recovery of Bad Debts"],
        "Other Expenses": ["Loss on Sale of Assets"],
        "Cost Of Goods Sold": ["Raw Materials", "Direct Labor"],
        "Equity": ["Capital (for sole proprietorship)","Drawings","Share Capital","Share Premium","Retained Earnings","Reserves","Revaluation Surplus"],
    };

    setAccountSuggestions(suggestions[selectedType.type_name] || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        business_id: selectedBusiness.business_id
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
    return accountTypes.filter(type => !type.is_subtype);
  };

  const getSubTypes = (parentTypeId) => {
    return accountTypes.filter(type => type.parent_type_id === parentTypeId);
  };

  const getFilteredSubAccountOptions = () => {
    if (!formData.type_id) return [];
    return subAccountOptions.filter(account => account.type_id == formData.type_id);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/showbusinessaccount')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Ledger</h1>
              <p className="mt-2 text-gray-600">
                Add a new Ledger to {selectedBusiness?.business_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
                      {errors.general}
                    </div>
                  )}

                  {/* Account Type */}
                  <div>
                    <label htmlFor="type_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Ledger Type <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="type_id"
                      name="type_id"
                      value={formData.type_id}
                      onChange={handleChange}
                      className={`input-field ${errors.type_id ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    >
                      <option value="">Select account type</option>
                      {getFilteredAccountTypes().map(type => (
                        <optgroup key={type.type_id} label={type.type_name}>
                          <option value={type.type_id}>{type.type_name}</option>
                          {getSubTypes(type.type_id).map(subType => (
                            <option key={subType.type_id} value={subType.type_id}>
                              &nbsp;&nbsp;{subType.type_name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.type_id && (
                      <p className="mt-1 text-sm text-error-600">{errors.type_id}</p>
                    )}
                  </div>

                  {/* Account Name */}
                  <div>
                    <label htmlFor="account_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Ledger Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      id="account_name"
                      name="account_name"
                      type="text"
                      value={formData.account_name}
                      onChange={handleChange}
                      className={`input-field ${errors.account_name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                      placeholder="Enter account name"
                    />
                    {errors.account_name && (
                      <p className="mt-1 text-sm text-error-600">{errors.account_name}</p>
                    )}
                  </div>

                  {/* Sub Account Option */}
                  <div>
                    <div className="flex items-center">
                      <input
                        id="is_sub_account"
                        name="is_sub_account"
                        type="checkbox"
                        checked={formData.is_sub_account}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_sub_account" className="ml-2 block text-sm text-gray-900">
                        Make this a sub-account
                      </label>
                      <HelpCircle className="ml-2 w-4 h-4 text-gray-400" title="Sub-accounts are grouped under parent accounts for better organization" />
                    </div>
                  </div>

                  {/* Parent Account Selection */}
                  {formData.is_sub_account && (
                    <div>
                      <label htmlFor="parent_account_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Account
                      </label>
                      <select
                        id="parent_account_id"
                        name="parent_account_id"
                        value={formData.parent_account_id}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select parent account</option>
                        {getFilteredSubAccountOptions().map(account => (
                          <option key={account.account_id} value={account.account_id}>
                            {account.account_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter account description (optional)"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => navigate('/showbusinessaccount')}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex items-center"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Ledger
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Suggestions Sidebar */}
            {accountSuggestions.length > 0 && (
              <div className="lg:col-span-1">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Account Names</h3>
                  <select
                    className="w-full px-3 py-2 text-sm text-gray-700 rounded-md border border-gray-300"
                    onChange={e => handleSuggestionClick(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a suggestion</option>
                    {accountSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion}>{suggestion}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewAccount;