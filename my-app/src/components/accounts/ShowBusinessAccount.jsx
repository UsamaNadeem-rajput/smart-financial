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
  Wallet,
  PiggyBank,
  CreditCard,
  Eye,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const ShowBusinessAccount = () => {
  const navigate = useNavigate();
  const { selectedBusiness, refreshTrigger, triggerRefresh } = useBusiness();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [user, setUser] = useState(null);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchAccounts();
  }, [selectedBusiness, refreshTrigger]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedFilter]);

  const fetchAccounts = async () => {
    try {
      // Fetch accounts from backend API
      const response = await axios.get(`${apiUrl}/api/accounts-list/${selectedBusiness.business_id}`, {
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
        await axios.delete(`${apiUrl}/api/accounts/${accountId}`, {
          withCredentials: true
        });
        setAccounts(prev => prev.filter(a => a.account_id !== accountId));
        triggerRefresh();
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
    if (typeName.includes('Assets')) return <Wallet className="w-4 h-4 text-success-600" />;
    if (typeName.includes('Income')) return <PiggyBank className="w-4 h-4 text-primary-600" />;
    if (typeName.includes('Expense')) return <CreditCard className="w-4 h-4 text-error-600" />;

    return <DollarSign className="w-4 h-4 text-gray-600" />;
  };

  const accountTypeFilters = [
    { value: 'all', label: 'All Ledgers' },
    { value: 'assets', label: 'Assets' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0">
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

        {/* Animated business elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating financial icons */}
          <div className="absolute top-20 left-10 text-blue-400/20 animate-pulse flex items-center justify-center">
            <Wallet className="w-10 h-10" />
          </div>
          <div className="absolute top-40 right-20 text-cyan-400/20 animate-bounce flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="absolute bottom-40 left-32 text-purple-400/20 animate-pulse flex items-center justify-center">
            <BarChart3 className="w-12 h-12" />
          </div>
          <div className="absolute bottom-20 right-40 text-indigo-400/20 animate-bounce flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-teal-400/20 animate-pulse flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="absolute top-1/3 right-1/3 text-violet-400/20 animate-bounce flex items-center justify-center">
            <BarChart3 className="w-10 h-10" />
          </div>

          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-pulse"></div>

          {/* Network connection lines */}
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

        {/* Subtle overlay for content readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Chart of Accounts-Ledgers</h1>
                <p className="mt-2 text-gray-300">
                  Manage accounts for "{selectedBusiness?.business_name}"
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Link
                  to="/creatnewaccount"
                  className="btn-primary flex items-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Ledger
                </Link>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-4">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="min-w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20 shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mx-auto flex items-center justify-center mb-6">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm || selectedFilter !== 'all' ? 'No Ledger found' : 'No Ledger yet'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm || selectedFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first account to start tracking finances'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAccounts.map((account) => (
                        <tr key={account.account_id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-colors duration-200">
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
                            <span className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-full">
                              {formatCurrency(account.balance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => navigate('/editaccount', { state: { account } })}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit account"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.account_id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
    </div>
  );
};

export default ShowBusinessAccount;