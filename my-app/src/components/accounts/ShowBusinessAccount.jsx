import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';

const ShowBusinessAccount = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, [selectedBusiness]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedFilter]);

  // useEffect(() => {
  //   const storedUser = localStorage.getItem('user');
  //   if (storedUser) {
  //     setUser(JSON.parse(storedUser));
  //   }}, []);

  // const checkAuthAndFetchAccounts = async () => {
  //   try {
  //     // Check if user is authenticated
  //     const authResponse = await axios.get('http://localhost:5000/api/check-auth', {
  //       withCredentials: true
  //     });
      
  //     if (authResponse.data.user) {
  //       setUser(authResponse.data.user);
  //       if (!selectedBusiness) {
  //         navigate('/list');
  //         return;
  //       }
  //       fetchAccounts();
  //     } else {
  //       navigate('/login');
  //     }
  //   } catch (error) {
  //     console.error('Authentication check failed:', error);
  //     navigate('/login');
  //   }
  // };

  const fetchAccounts = async () => {
    try {
      // Fetch accounts from backend API
      const response = await axios.get(`https://smart-financial-production.up.railway.app/api/accounts-list/${selectedBusiness.business_id}`, {
        withCredentials: true
      });
      
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      // If API fails, show empty state
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by account type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(account =>
        account.type_name.toLowerCase().includes(selectedFilter.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await axios.delete(`https://smart-financial-production.up.railway.app/api/accounts/${accountId}`, {
          withCredentials: true
        });
        setAccounts(prev => prev.filter(a => a.account_id !== accountId));
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccountTypeIcon = (typeName) => {
    if (typeName.includes('Assets')) return <TrendingUp className="w-4 h-4 text-success-600" />;
    if (typeName.includes('Income')) return <TrendingUp className="w-4 h-4 text-primary-600" />;
    if (typeName.includes('Expense')) return <TrendingDown className="w-4 h-4 text-error-600" />;
    return <DollarSign className="w-4 h-4 text-gray-600" />;
  };

  const accountTypeFilters = [
    { value: 'all', label: 'All Accounts' },
    { value: 'assets', label: 'Assets' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' }
  ];

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
              <p className="mt-2 text-gray-600">
                Manage accounts for "{selectedBusiness?.business_name}"
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link
                to="/creatnewaccount"
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ledger
              </Link>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="input-field min-w-40"
                >
                  {accountTypeFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          {filteredAccounts.length === 0 ? (
            <div className="card text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm || selectedFilter !== 'all' ? 'No accounts found' : 'No accounts yet'}
              </h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first account to start tracking finances'
                }
              </p>
              {(!searchTerm && selectedFilter === 'all') && (
                <Link
                  to="/creatnewaccount"
                  className="mt-4 inline-flex items-center btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ledger
                </Link>
              )}
            </div>
          ) : (
            <div className="card p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ledger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        
                      </th> */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAccounts.map((account) => (
                      <tr key={account.account_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {account.account_name}
                            </div>
                            {account.description && (
                              <div className="text-sm text-gray-500">
                                {account.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              Created: {formatDate(account.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getAccountTypeIcon(account.type_name)}
                            <span className="ml-2 text-sm text-gray-900">
                              {account.type_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(account.balance)}
                          </span>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.status === 'active'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {account.status}
                          </span>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/account-details/${account.account_id}`)}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                              title="View transactions"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate('/editaccount', { state: { account } })}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Edit account"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.account_id)}
                              className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowBusinessAccount;