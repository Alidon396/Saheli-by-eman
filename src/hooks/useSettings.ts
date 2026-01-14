import { useState, useEffect } from 'react';

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  currency: string;
  currencySymbol: string;
  lowStockThreshold: number;
  taxRate: number;
  receiptFooter: string;
}

const defaultSettings: StoreSettings = {
  storeName: 'Saheli by Emaan',
  storeAddress: '',
  storePhone: '',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  lowStockThreshold: 10,
  taxRate: 0,
  receiptFooter: 'Thank you for shopping with us!',
};

const STORAGE_KEY = 'saheli-settings';

const loadFromStorage = (): StoreSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return defaultSettings;
};

const saveToStorage = (settings: StoreSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>(loadFromStorage);

  useEffect(() => {
    saveToStorage(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
