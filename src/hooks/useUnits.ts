import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'saheli-custom-units';

const DEFAULT_UNITS = [
  'piece',
  'set',
  'meter',
];

const loadUnits = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading units:', error);
  }
  return DEFAULT_UNITS;
};

const saveUnits = (units: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  } catch (error) {
    console.error('Error saving units:', error);
  }
};

export const useUnits = () => {
  const [units, setUnits] = useState<string[]>(() => loadUnits());

  useEffect(() => {
    saveUnits(units);
  }, [units]);

  const addUnit = useCallback((unit: string) => {
    const trimmed = unit.trim().toLowerCase();
    if (!trimmed) return false;
    if (units.some(u => u.toLowerCase() === trimmed)) return false;
    setUnits(prev => [...prev, trimmed].sort());
    return true;
  }, [units]);

  const removeUnit = useCallback((unit: string) => {
    setUnits(prev => prev.filter(u => u !== unit));
  }, []);

  const resetToDefaults = useCallback(() => {
    setUnits(DEFAULT_UNITS);
  }, []);

  return {
    units,
    addUnit,
    removeUnit,
    resetToDefaults,
  };
};
