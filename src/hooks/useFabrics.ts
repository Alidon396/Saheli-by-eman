import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'saheli-custom-fabrics';

const DEFAULT_FABRICS = [
  'Khaddar',
  'Lawn',
  'Chiffon',
  'Silk',
  'Organza',
  'Net',
  'Cotton Satin',
  'Viscose',
];

const loadFabrics = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading fabrics:', error);
  }
  return DEFAULT_FABRICS;
};

const saveFabrics = (fabrics: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fabrics));
  } catch (error) {
    console.error('Error saving fabrics:', error);
  }
};

export const useFabrics = () => {
  const [fabrics, setFabrics] = useState<string[]>(() => loadFabrics());

  useEffect(() => {
    saveFabrics(fabrics);
  }, [fabrics]);

  const addFabric = useCallback((fabric: string) => {
    const trimmed = fabric.trim();
    if (!trimmed) return false;
    if (fabrics.some(f => f.toLowerCase() === trimmed.toLowerCase())) return false;
    setFabrics(prev => [...prev, trimmed].sort());
    return true;
  }, [fabrics]);

  const removeFabric = useCallback((fabric: string) => {
    setFabrics(prev => prev.filter(f => f !== fabric));
  }, []);

  const resetToDefaults = useCallback(() => {
    setFabrics(DEFAULT_FABRICS);
  }, []);

  return {
    fabrics,
    addFabric,
    removeFabric,
    resetToDefaults,
  };
};
