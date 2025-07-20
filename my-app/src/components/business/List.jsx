import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import { Building2, Plus, Edit3, Trash2, Crown } from 'lucide-react';
import axios from 'axios';

const List = () => {
  const navigate = useNavigate();
  const { businesses, setBusinesses, selectBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true });
      setUser(res.data);
      fetchBusinesses(); // ✅ Only fetch if session is valid
      console.log('User is authenticated:', res.data.username);
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login',{ replace: true }); // 🔐 Redirect to login if session expired
    }
  };

  const fetchBusinesses = async () => {
    try {
      // Fetch businesses from backend API
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/showbusinesses`, {
        withCredentials: true
      });

      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = (business) => {
    selectBusiness(business);
    navigate('/showbusinessaccount');
  };

  const handleDeleteBusiness = async (businessId) => {
    if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/business/${businessId}`, {
          withCredentials: true
        });
        setBusinesses(prev => prev.filter(b => b.business_id !== businessId));
      } catch (error) {
        console.error('Failed to delete business:', error);
        alert('Failed to delete business. Please try again.');
      }
    }
  };

  const formatBusinessType = (type) => {
    const types = {
      'sole': 'Sole Proprietorship',
      'partnership': 'Partnership',
      'company': 'Company'
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Businesses</h1>
              <p className="mt-2 text-gray-600">
                Select a business to manage or create a new one
              </p>
            </div>
            <Link
              to="/business"
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Business
            </Link>
          </div>

          {/* Business Grid */}
          {businesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses yet</h3>
              <p className="mt-2 text-gray-500">
                Create your first business to get started with accounting
              </p>
              <Link
                to="/business"
                className="mt-4 inline-flex items-center btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Business
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <div
                  key={business.business_id}
                  className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleSelectBusiness(business)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Building2 className="w-5 h-5 text-primary-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {business.business_name}
                        </h3>
                        {business.plan === 'premium' && (
                          <Crown className="w-4 h-4 text-warning-500 ml-2" />
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Type:</span> {formatBusinessType(business.business_type)}
                        </p>
                        {business.industry && (
                          <p>
                            <span className="font-medium">Industry:</span> {business.industry}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Plan:</span>{' '}
                          <span className={`capitalize ${business.plan === 'premium' ? 'text-warning-600' : 'text-gray-600'
                            }`}>
                            {business.plan}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Created:</span> {formatDate(business.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/business', { state: { business } });
                        }}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit business"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBusiness(business.business_id);
                        }}
                        className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                        title="Delete business"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm">
                      Select & Continue →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default List;