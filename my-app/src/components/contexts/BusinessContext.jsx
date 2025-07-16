// src/contexts/BusinessContext.jsx
import { createContext, useContext, useState } from 'react';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [businessId, setBusinessId] = useState(null); // 👈 Globally shared

  return (
    <BusinessContext.Provider value={{ businessId, setBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
