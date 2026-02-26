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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
    refreshTrigger,
    setBusinesses,
    selectBusiness,
    clearBusiness,
    triggerRefresh
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};