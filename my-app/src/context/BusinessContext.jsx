import { createContext, useContext, useState, useEffect } from 'react';

const BusinessContext = createContext();

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }) => {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    // Check if business is already selected
    const storedBusiness = localStorage.getItem('selectedBusiness');
    if (storedBusiness) {
      setSelectedBusiness(JSON.parse(storedBusiness));
    }
  }, []);

  const selectBusiness = (business) => {
    setSelectedBusiness(business);
    localStorage.setItem('selectedBusiness', JSON.stringify(business));
  };

  const clearBusiness = () => {
    setSelectedBusiness(null);
    localStorage.removeItem('selectedBusiness');
  };

  const value = {
    selectedBusiness,
    businesses,
    setBusinesses,
    selectBusiness,
    clearBusiness
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};