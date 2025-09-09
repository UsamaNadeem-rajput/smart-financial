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
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchAccounts();
  }, [selectedBusiness]);

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Accounting/Ledger Background */}
      <div className="absolute inset-0">
        {/* Primary gradient background - Green/Teal theme for accounting */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900"></div>
        
        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-800/30 via-transparent to-teal-700/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-800/20 via-transparent to-emerald-700/20"></div>
        
        {/* Ledger paper pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.3) 0px,
                rgba(255,255,255,0.3) 1px,
                transparent 1px,
                transparent 40px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.1) 0px,
                rgba(255,255,255,0.1) 1px,
                transparent 1px,
                transparent 60px
              )
            `,
            backgroundSize: '60px 40px'
          }}></div>
        </div>
        
        {/* Accounting elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Financial symbols */}
          <div className="absolute top-20 left-10 text-4xl text-green-400/15 animate-pulse">💰</div>
          <div className="absolute top-40 right-20 text-3xl text-emerald-400/15 animate-bounce">📋</div>
          <div className="absolute bottom-40 left-32 text-5xl text-teal-400/15 animate-pulse">📊</div>
          <div className="absolute bottom-20 right-40 text-3xl text-cyan-400/15 animate-bounce">🧾</div>
          <div className="absolute top-1/3 left-1/4 text-2xl text-green-300/15 animate-pulse">💳</div>
          <div className="absolute top-2/3 right-1/3 text-4xl text-emerald-300/15 animate-bounce">🏦</div>
          <div className="absolute top-1/4 right-1/4 text-2xl text-teal-300/15 animate-pulse">📈</div>
          
          {/* Calculator/Accounting elements */}
          <div className="absolute top-1/2 left-10 w-6 h-6 border border-green-400/20 rounded animate-pulse"></div>
          <div className="absolute bottom-1/3 right-20 w-8 h-8 border border-teal-400/20 rounded-lg animate-bounce"></div>
          
          {/* Spreadsheet grid pattern */}
          <div className="absolute top-1/4 left-1/3 w-32 h-24 opacity-10">
            <div className="grid grid-cols-4 grid-rows-3 gap-1 h-full">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white/20 rounded animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
              ))}
            </div>
          </div>
          
          {/* Balance scale visual */}
          <svg className="absolute top-1/3 right-1/4 w-16 h-16 text-emerald-400/10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          
          {/* Floating ledger lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
            <defs>
              <linearGradient id="ledgerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#14b8a6', stopOpacity: 0.15 }} />
                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <g>
              <path 
                d="M50,150 L350,150 M50,200 L350,200 M50,250 L350,250" 
                stroke="url(#ledgerGradient)" 
                strokeWidth="1" 
                className="animate-pulse"
              />
              <path 
                d="M700,300 L1000,300 M700,350 L1000,350 M700,400 L1000,400" 
                stroke="rgba(16, 185, 129, 0.1)" 
                strokeWidth="1" 
                className="animate-pulse"
                style={{animationDelay: '1s'}}
              />
            </g>
          </svg>
          
          {/* Credit/Debit columns visual */}
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-4 opacity-10">
              <div className="text-green-400 text-xs font-mono animate-pulse">DEBIT</div>
              <div className="w-px h-12 bg-green-400/30"></div>
              <div className="text-red-400 text-xs font-mono animate-pulse" style={{animationDelay: '0.5s'}}>CREDIT</div>
            </div>
          </div>
        </div>
        
        {/* Professional overlay for readability */}
        <div className="absolute inset-0 bg-black/25"></div>
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