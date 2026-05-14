import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHackClubClient } from '@/api/hackclubClient';

const HackClubContext = createContext(null);
const FAVORITE_MODELS_STORAGE_KEY = 'hackclub_favorite_models';
const DEFAULT_FAVORITE_MODEL = '~anthropic/claude-sonnet-latest';

const sanitizeFavoriteModels = (models) => {
  if (!Array.isArray(models)) return [DEFAULT_FAVORITE_MODEL];
  const unique = Array.from(
    new Set(
      models
        .filter((model) => typeof model === 'string')
        .map((model) => model.trim())
        .filter(Boolean)
    )
  );
  return unique.length > 0 ? unique : [DEFAULT_FAVORITE_MODEL];
};

export const HackClubProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [client, setClient] = useState(null);
  const [favoriteModels, setFavoriteModelsState] = useState([DEFAULT_FAVORITE_MODEL]);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('hackclub_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      const hackclubClient = getHackClubClient(savedApiKey);
      setClient(hackclubClient);
      setIsApiKeySet(true);
    }

    const savedFavoriteModels = localStorage.getItem(FAVORITE_MODELS_STORAGE_KEY);
    if (savedFavoriteModels) {
      try {
        const parsed = JSON.parse(savedFavoriteModels);
        setFavoriteModelsState(sanitizeFavoriteModels(parsed));
      } catch (error) {
        setFavoriteModelsState([DEFAULT_FAVORITE_MODEL]);
      }
    } else {
      localStorage.setItem(FAVORITE_MODELS_STORAGE_KEY, JSON.stringify([DEFAULT_FAVORITE_MODEL]));
    }
  }, []);

  const setFavoriteModels = (models) => {
    const sanitizedModels = sanitizeFavoriteModels(models);
    setFavoriteModelsState(sanitizedModels);
    localStorage.setItem(FAVORITE_MODELS_STORAGE_KEY, JSON.stringify(sanitizedModels));
    return sanitizedModels;
  };

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
        favoriteModels,
        setFavoriteModels,
        defaultFavoriteModel: DEFAULT_FAVORITE_MODEL,
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
