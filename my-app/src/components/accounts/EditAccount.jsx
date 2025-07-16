import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Save, ArrowLeft } from 'lucide-react';

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
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkAuthAndInitialize();
  }, [selectedBusiness, location.state]);

  const checkAuthAndInitialize = async () => {
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
        
        // Check if account data is passed from the previous page
        if (location.state?.account) {
          const account = location.state.account;
          setFormData({
            account_name: account.account_name || '',
            type_id: account.type_id || '',
            description: account.description || '',
            // status: account.status || 'active'
          });
        } else {
          // If no account data, redirect back
          navigate('/showbusinessaccount');
        }
        
        fetchAccountTypes();
    //   } else {
    //     navigate('/login');
    //   }
    // } catch (error) {
    //   console.error('Authentication check failed:', error);
    //   navigate('/login');
    };

  const fetchAccountTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/account-types', {
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

      await axios.put(`http://localhost:5000/api/accounts/${accountId}`, formData, {
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
    return accountTypes.filter(type => !type.is_subtype);
  };

  const getSubTypes = (parentTypeId) => {
    return accountTypes.filter(type => type.parent_type_id === parentTypeId);
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Account</h1>
              <p className="mt-2 text-gray-600">
                Update account information for {selectedBusiness?.business_name}
              </p>
            </div>
          </div>

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
                  Account Type <span className="text-error-500">*</span>
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
                  Account Name <span className="text-error-500">*</span>
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

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAccount;