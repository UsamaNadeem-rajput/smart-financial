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
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/business/${businessId}`, {
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
          {/* Floating building icons */}
          <div className="absolute top-20 left-10 text-4xl text-blue-400/20 animate-pulse">🏢</div>
          <div className="absolute top-40 right-20 text-3xl text-cyan-400/20 animate-bounce">📊</div>
          <div className="absolute bottom-40 left-32 text-5xl text-purple-400/20 animate-pulse">💼</div>
          <div className="absolute bottom-20 right-40 text-3xl text-indigo-400/20 animate-bounce">📈</div>
          <div className="absolute top-1/2 left-1/4 text-2xl text-teal-400/20 animate-pulse">🏪</div>
          <div className="absolute top-1/3 right-1/3 text-4xl text-violet-400/20 animate-bounce">🏭</div>
          
          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border border-cyan-400/20 rounded-lg rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
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
              style={{animationDelay: '1s'}}
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Your Businesses</h1>
                <p className="mt-2 text-gray-300">
                  Select a business to manage or create a new one
                </p>
              </div>
              <Link
                to="/business"
                className="btn-primary flex items-center shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Business
              </Link>
            </div>

            {/* Business Grid */}
            {businesses.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
                  <Building2 className="h-12 w-12 text-cyan-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">No businesses yet</h3>
                <p className="mt-2 text-gray-300">
                  Create your first business to get started with accounting
                </p>
                <Link
                  to="/business"
                  className="mt-4 inline-flex items-center btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
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
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 hover:bg-white hover:shadow-2xl transition-all duration-300 cursor-pointer border border-white/20 hover:scale-105"
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {business.business_name}
                          </h3>
                          {business.plan === 'premium' && (
                            <div className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                              <Crown className="w-4 h-4 text-white" />
                            </div>
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
                            <span className={`capitalize font-semibold px-2 py-1 rounded-full text-xs ${
                              business.plan === 'premium' 
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700' 
                                : 'bg-gray-100 text-gray-600'
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
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit business"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBusiness(business.business_id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete business"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group">
                        Select & Continue 
                        <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;