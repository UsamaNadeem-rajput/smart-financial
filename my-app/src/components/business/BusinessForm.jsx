import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import { Plus, Check, X, Loader2 } from 'lucide-react';

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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

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
      if (business.logo_url) {
        setLogoPreview(`${import.meta.env.VITE_BACKEND_URL}${business.logo_url}`);
      }
      setIsEditMode(true);
    }
  }, [location.state]);

  const isDisabled = (field) => {
    const premiumOnly = ['address', 'city', 'country', 'phone'];
    return formData.plan === 'free' && premiumOnly.includes(field);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({ ...prev, logo: 'File size must be less than 2MB' }));
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number';
      }
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

    const submitData = new FormData();
    submitData.append("plan", formData.plan);
    submitData.append("businessName", formData.business_name.trim());
    submitData.append("businessType", formData.business_type);
    submitData.append("industry", formData.industry ? formData.industry.trim() : "");
    submitData.append("ntn", formData.ntn_number ? formData.ntn_number.trim() : "");

    if (formData.plan === 'premium') {
      submitData.append("address", formData.address ? formData.address.trim() : "");
      submitData.append("city", formData.city ? formData.city.trim() : "");
      submitData.append("country", formData.country ? formData.country.trim() : "");
      submitData.append("phone", formData.phone ? formData.phone.trim() : "");
    }

    if (logoFile) {
      submitData.append("logo", logoFile);
    }

    try {
      if (isEditMode) {
        const businessId = location.state.business.business_id;
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/business/${businessId}`, submitData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/business`, submitData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      navigate('/list');
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Something went wrong. Please try again. ' + (err.response?.data?.error || err.message) });
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
            Businesses
          </button>
          {' / '}
          <span className="text-brand-ink font-medium">
            {isEditMode ? 'Edit business' : 'New business'}
          </span>
        </p>

        {/* Page Title & Subtitle */}
        <h1 className="font-display font-extrabold text-[44px] sm:text-[76px] tracking-tight leading-[0.98] mt-1 text-brand-ink">
          {isEditMode ? 'Edit business.' : 'New business.'}
        </h1>
        <p className="text-brand-muted text-lg sm:text-xl max-w-[760px] mt-4 leading-normal">
          Every business gets its own vault: its own accounts, transactions and reports, never mixed with your other businesses.
        </p>

        <div className="sf-bf-cols">
          {/* Main Form */}
          <form className="sf-bf-fm" onSubmit={handleSubmit} noValidate>
            {/* Plan Section */}
            <div className="sf-bf-sec" style={{ marginTop: 0 }}>
              <h2>Plan</h2>
              <div className="sf-bf-tiles" role="group" aria-label="Plan">
                <button
                  type="button"
                  className={`sf-bf-tile ${formData.plan === 'free' ? 'on' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, plan: 'free' }))}
                >
                  <b>Free</b>
                  <span>Name, type, industry & NTN. Everything you need to start.</span>
                </button>
                <button
                  type="button"
                  className={`sf-bf-tile ${formData.plan === 'premium' ? 'on' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, plan: 'premium' }))}
                >
                  <b>
                    Premium{' '}
                  </b>
                  <span>Adds address, city, country and phone.</span>
                </button>
              </div>
            </div>

            {/* Business details Section */}
            <div className="sf-bf-sec">
              <h2>Business details</h2>
              <div className="sf-bf-fd">
                <label htmlFor="bn" className="sf-bf-lbl">
                  Business name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="bn"
                  name="business_name"
                  type="text"
                  required
                  placeholder="e.g. Corner Café"
                  autoComplete="organization"
                  value={formData.business_name}
                  onChange={handleChange}
                  className={`sf-bf-input ${errors.business_name ? 'err' : ''}`}
                />
                <p className="sf-bf-help">Required. This name appears on your reports.</p>
                {errors.business_name && (
                  <p className="sf-bf-hint">{errors.business_name}</p>
                )}
              </div>

              <div className="sf-bf-fd">
                <label className="sf-bf-lbl">
                  Business type <span aria-hidden="true">*</span>
                </label>
                <div className="sf-bf-segs" role="group" aria-label="Business type">
                  {businessTypes.map(type => {
                    const isSelected = formData.business_type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        className={`sf-bf-seg ${isSelected ? 'on' : ''}`}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, business_type: type.value }));
                          if (errors.business_type) {
                            setErrors(prev => ({ ...prev, business_type: '' }));
                          }
                        }}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                {errors.business_type && (
                  <p className="sf-bf-hint">{errors.business_type}</p>
                )}
              </div>
              <div className="sf-bf-fg3" style={{ marginTop: '20px' }}>
                <div className="sf-bf-fd">
                  <label htmlFor="ind" className="sf-bf-lbl">
                    Industry
                  </label>
                  <select
                    id="ind"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="sf-bf-input"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="sf-bf-fd">
                  <label htmlFor="ntn" className="sf-bf-lbl">
                    NTN number
                  </label>
                  <input
                    id="ntn"
                    type="text"
                    name="ntn_number"
                    value={formData.ntn_number}
                    onChange={handleChange}
                    placeholder="National Tax Number"
                    className="sf-bf-input"
                  />
                </div>
              </div>
            </div>

            {/* Premium details Section */}
            <div className="sf-bf-sec">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                {/* <h2>Premium details</h2> */}
                {formData.plan === 'free' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0E1A14',
                      background: '#C8F135',
                      border: '1.5px solid #0E1A14',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    Locked on Free
                  </span>
                )}
              </div>

              {formData.plan === 'free' ? (
                <div>
                  <p className="sf-bf-note2">
                    Address, city, country, and phone details are locked on the Free plan. Switch to Premium above to enable them.
                  </p>
                  <div className="sf-bf-fg3">
                    <div className="sf-bf-fd sf-bf-w2">
                      <label className="sf-bf-lbl">Address</label>
                      <input type="text" placeholder="Premium only" disabled={isDisabled('address')} className="sf-bf-input" />
                    </div>
                    <div className="sf-bf-fd">
                      <label className="sf-bf-lbl">City</label>
                      <input type="text" placeholder="Premium only" disabled={isDisabled('city')} className="sf-bf-input" />
                    </div>
                    <div className="sf-bf-fd">
                      <label className="sf-bf-lbl">Country</label>
                      <input type="text" placeholder="Premium only" disabled={isDisabled('country')} className="sf-bf-input" />
                    </div>
                    <div className="sf-bf-fd sf-bf-w2">
                      <label className="sf-bf-lbl">Phone</label>
                      <input type="tel" placeholder="Premium only" disabled={isDisabled('phone')} className="sf-bf-input" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sf-bf-fg3">
                  <div className="sf-bf-fd sf-bf-w2">
                    <label className="sf-bf-lbl">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street, area"
                      autoComplete="street-address"
                      className="sf-bf-input"
                    />
                  </div>

                  <div className="sf-bf-fd">
                    <label className="sf-bf-lbl">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Karachi"
                      className={`sf-bf-input ${errors.city ? 'err' : ''}`}
                    />
                    {errors.city && <p className="sf-bf-hint">{errors.city}</p>}
                  </div>

                  <div className="sf-bf-fd">
                    <label className="sf-bf-lbl">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g. Pakistan"
                      className={`sf-bf-input ${errors.country ? 'err' : ''}`}
                    />
                    {errors.country && <p className="sf-bf-hint">{errors.country}</p>}
                  </div>

                  <div className="sf-bf-fd sf-bf-w2">
                    <label className="sf-bf-lbl">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 0000000"
                      className={`sf-bf-input ${errors.phone ? 'err' : ''}`}
                    />
                    {errors.phone && <p className="sf-bf-hint">{errors.phone}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Logo Section */}
            <div className="sf-bf-sec">
              <h2>Profile picture / Logo</h2>
              <div className="sf-bf-drop">
                <div className="ic" aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0E1A14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    <circle cx="9" cy="10" r="2"></circle>
                    <path d="M21 16l-5-5-8 9"></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-[240px]">
                  <label htmlFor="lg" className="sf-bf-lbl mb-2">Business logo (optional)</label>
                  <input
                    id="lg"
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleLogoChange}
                  />
                  <p className="sf-bf-help mt-2">JPEG, PNG or GIF, up to 2 MB. Used on your statements.</p>
                  {errors.logo && (
                    <div className="mt-2.5 p-3 rounded bg-[#F2B66B] border-2 border-brand-ink font-semibold text-sm" role="alert">
                      {errors.logo}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="sf-bf-acts">
              <button
                type="submit"
                id="submitBtn"
                disabled={isLoading}
                className="sf-btn sf-btn-lime flex items-center justify-center gap-2.5 font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_#0E1A14] hover:shadow-[4px_4px_0_#0E1A14] active:translate-y-0 active:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isEditMode ? 'Updating business...' : 'Creating business...'}</span>
                  </>
                ) : (
                  <>
                    {isEditMode ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" strokeWidth={2.5} />}
                    <span>{isEditMode ? 'Update business' : 'Create business'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/list')}
                className="sf-btn sf-btn-line flex items-center justify-center gap-2 font-bold cursor-pointer transition-all duration-150 shadow-[2px_2px_0_#0E1A14] hover:bg-black/5 hover:shadow-[4px_4px_0_#0E1A14] active:translate-y-0 active:shadow-none"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>

              {errors.general && (
                <div className="w-full mt-3 p-3.5 rounded bg-[#F2B66B] border-2 border-brand-ink font-semibold text-sm" role="alert">
                  {errors.general}
                </div>
              )}
            </div>
          </form>

          {/* Sticky Live Vault Preview */}
          <aside className="sf-bf-as" aria-label="Preview of your new vault">
            <div className="sf-bf-pv">
              <small>Your new vault</small>
              <div className="lg" id="previewLogo" aria-hidden="true">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" />
                ) : (
                  'Logo'
                )}
              </div>
              <h2 id="previewBusinessName">
                {formData.business_name.trim() || 'Your business name'}
              </h2>
              <div className="tags">
                {formData.plan === 'free' ? (
                  <span>Free plan</span>
                ) : (
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#C8F135" stroke="#0E1A14" strokeWidth="2" strokeLinejoin="round"></path>
                    </svg>
                    Premium plan
                  </span>
                )}
                {formData.business_type === 'sole' && <span>Sole Proprietorship</span>}
                {formData.business_type === 'partnership' && <span>Partnership</span>}
                {formData.business_type === 'company' && <span>Company</span>}
                {!formData.business_type && <span>No type selected</span>}
                {formData.industry && <span>{formData.industry}</span>}
                {formData.ntn_number && <span>NTN: {formData.ntn_number}</span>}
              </div>
              <ul>
                <li>Its own chart of accounts</li>
                <li>Its own transactions and reports</li>
                <li style={{ borderBottom: '1px solid #2C3F34' }}>Never mixed with your other businesses</li>
              </ul>
            </div>

            <div className="sf-bf-nx">
              <b>What happens next</b>
              After you create it, you will see it in your list of businesses. Select it there to start adding accounts and posting transactions.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default BusinessForm;
