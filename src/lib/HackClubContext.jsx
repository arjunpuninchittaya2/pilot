import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHackClubClient } from '@/api/hackclubClient';

const HackClubContext = createContext(null);

export const HackClubProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [client, setClient] = useState(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('hackclub_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      const hackclubClient = getHackClubClient(savedApiKey);
      setClient(hackclubClient);
      setIsApiKeySet(true);
    }
  }, []);

  const saveApiKey = (newApiKey) => {
    if (newApiKey && newApiKey.trim()) {
      localStorage.setItem('hackclub_api_key', newApiKey.trim());
      const hackclubClient = getHackClubClient(newApiKey.trim());
      setClient(hackclubClient);
      setApiKey(newApiKey.trim());
      setIsApiKeySet(true);
      return true;
    }
    return false;
  };

  const clearApiKey = () => {
    localStorage.removeItem('hackclub_api_key');
    setApiKey(null);
    setIsApiKeySet(false);
    setClient(null);
  };

  return (
    <HackClubContext.Provider
      value={{
        apiKey,
        isApiKeySet,
        client,
        saveApiKey,
        clearApiKey,
      }}
    >
      {children}
    </HackClubContext.Provider>
  );
};

export const useHackClub = () => {
  const context = useContext(HackClubContext);
  if (!context) {
    throw new Error('useHackClub must be used within HackClubProvider');
  }
  return context;
};
