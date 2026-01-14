import { useState, useCallback, useEffect } from 'react';

const CUSTOM_BRANDS_KEY = 'saheli-custom-brands';

const DEFAULT_BRANDS = [
  'Sapphire',
  'Baroque',
  'Maria B',
  'Khaadi',
  'Gul Ahmed',
  'Junaid Jamshed',
];

const loadBrands = (): string[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_BRANDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading brands:', error);
  }
  return DEFAULT_BRANDS;
};

const saveBrands = (brands: string[]) => {
  try {
    localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(brands));
  } catch (error) {
    console.error('Error saving brands:', error);
  }
};

export const useBrands = () => {
  const [brands, setBrands] = useState<string[]>(() => loadBrands());

  useEffect(() => {
    saveBrands(brands);
  }, [brands]);

  const addBrand = useCallback((brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed) return false;
    if (brands.some(b => b.toLowerCase() === trimmed.toLowerCase())) return false;
    setBrands(prev => [...prev, trimmed].sort());
    return true;
  }, [brands]);

  const removeBrand = useCallback((brand: string) => {
    setBrands(prev => prev.filter(b => b !== brand));
  }, []);

  const resetToDefaults = useCallback(() => {
    setBrands(DEFAULT_BRANDS);
  }, []);

  return {
    brands,
    addBrand,
    removeBrand,
    resetToDefaults,
  };
};
