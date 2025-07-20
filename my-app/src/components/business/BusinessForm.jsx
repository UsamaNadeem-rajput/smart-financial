import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Save, ArrowLeft } from 'lucide-react';

const BusinessForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    industry: '',
    ntn_number: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    plan: 'free',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.state?.business) {
      const business = location.state.business;
      setFormData({
        business_name: business.business_name || '',
        business_type: business.business_type || '',
        industry: business.industry || '',
        ntn_number: business.ntn_number || '',
        address: business.address || '',
        city: business.city || '',
        country: business.country || '',
        phone: business.phone || '',
        plan: business.plan || 'free',
      });
      setIsEditMode(true);
    }
  }, [location.state]);

  const isDisabled = (field) => {
    const premiumOnly = ['industry', 'ntn_number', 'address', 'city', 'country', 'phone'];
    return formData.plan === 'free' && premiumOnly.includes(field);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }
    if (!formData.business_type) {
      newErrors.business_type = 'Business type is required';
    }
    if (formData.plan === 'premium') {
      if (!formData.industry.trim()) newErrors.industry = 'Industry is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    const payload = {
    plan: formData.plan,
    businessName: formData.business_name,
    businessType: formData.business_type,
    industry: formData.plan === 'premium' ? formData.industry : null,
    ntn: formData.plan === 'premium' ? formData.ntn_number : null,
    address: formData.plan === 'premium' ? formData.address : null,
    city: formData.plan === 'premium' ? formData.city : null,
    country: formData.plan === 'premium' ? formData.country : null,
    phone: formData.plan === 'premium' ? formData.phone : null,
  };


    try {
      if (isEditMode) {
        const businessId = location.state.business.business_id;
        console.log("Submitting payload:", formData);

        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/business/${businessId}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/business`, payload, { withCredentials: true });
      }
      navigate('/list');
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Something went wrong. Please try again.' + err.response.data.error});
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypes = [
    { value: 'sole', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'company', label: 'Company' },
  ];

  const industries = [
    'Agriculture', 'Automotive', 'Banking & Finance', 'Construction',
    'Consulting', 'Education', 'Food & Beverage', 'Healthcare',
    'Manufacturing', 'Real Estate', 'Retail', 'Technology',
    'Transportation', 'Other'
  ];

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/list')} className="mr-4 p-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Business' : 'Create New Business'}</h1>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'Update your business information' : 'Set up your business to start managing finances'}
            </p>
          </div>
        </div>

        {errors.general && <p className="text-red-600 mb-4">{errors.general}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Selector */}
           <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                      formData.plan === 'free'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, plan: 'free' }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="plan"
                        value="free"
                        checked={formData.plan === 'free'}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">Free Plan</h3>
                        <p className="text-sm text-gray-600">Up to 3 businesses</p>
                        <p className="text-sm text-gray-600">Basic business information</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                      formData.plan === 'premium'
                        ? 'border-warning-500 bg-warning-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, plan: 'premium' }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="plan"
                        value="premium"
                        checked={formData.plan === 'premium'}
                        onChange={handleChange}
                        className="h-4 w-4 text-warning-600 focus:ring-warning-500"
                      />
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">Premium Plan</h3>
                        <p className="text-sm text-gray-600">Unlimited businesses</p>
                        <p className="text-sm text-gray-600">Complete business profiles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              className={`input-field ${errors.business_name ? 'border-red-400' : ''}`}
              placeholder="Enter business name"
            />
            {errors.business_name && <p className="text-sm text-red-600">{errors.business_name}</p>}
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              className={`input-field ${errors.business_type ? 'border-red-400' : ''}`}
            >
              <option value="">Select type</option>
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.business_type && <p className="text-sm text-red-600">{errors.business_type}</p>}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry {formData.plan === 'premium' && <span className="text-red-500">*</span>}
            </label>
            <select
              name="industry"
              // disabled={isDisabled('industry')}
              value={formData.industry}
              onChange={handleChange}
              className={`input-field ${errors.industry ? 'border-red-400' : ''}`}
            >
              <option value="">Select industry</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            {errors.industry && <p className="text-sm text-red-600">{errors.industry}</p>}
          </div>

          {/* NTN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NTN Number</label>
            <input
              type="text"
              name="ntn_number"
              // disabled={isDisabled('ntn_number')}
              value={formData.ntn_number}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter NTN number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              disabled={isDisabled('address')}
              value={formData.address}
              onChange={handleChange}
              className="input-field"
              rows="2"
              placeholder="Business address"
            />
          </div>

          {/* City and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City {formData.plan === 'premium' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="city"
                disabled={isDisabled('city')}
                value={formData.city}
                onChange={handleChange}
                className={`input-field ${errors.city ? 'border-red-400' : ''}`}
              />
              {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country {formData.plan === 'premium' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="country"
                disabled={isDisabled('country')}
                value={formData.country}
                onChange={handleChange}
                className={`input-field ${errors.country ? 'border-red-400' : ''}`}
              />
              {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              disabled={isDisabled('phone')}
              value={formData.phone}
              onChange={handleChange}
              className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="e.g. +923001234567"
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Business' : 'Create Business'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;
