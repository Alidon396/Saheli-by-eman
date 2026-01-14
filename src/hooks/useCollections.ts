import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'saheli-custom-collections';

const DEFAULT_COLLECTIONS = [
  '1PC',
  '2PC',
  '3PC',
  'SUMMER',
  'WINTER',
  'NEW',
];

const loadCollections = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading collections:', error);
  }
  return DEFAULT_COLLECTIONS;
};

const saveCollections = (collections: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error('Error saving collections:', error);
  }
};

export const useCollections = () => {
  const [collections, setCollections] = useState<string[]>(() => loadCollections());

  useEffect(() => {
    saveCollections(collections);
  }, [collections]);

  const addCollection = useCallback((collection: string) => {
    const trimmed = collection.trim().toUpperCase();
    if (!trimmed) return false;
    if (collections.some(c => c.toUpperCase() === trimmed)) return false;
    setCollections(prev => [...prev, trimmed].sort());
    return true;
  }, [collections]);

  const removeCollection = useCallback((collection: string) => {
    setCollections(prev => prev.filter(c => c !== collection));
  }, []);

  const resetToDefaults = useCallback(() => {
    setCollections(DEFAULT_COLLECTIONS);
  }, []);

  return {
    collections,
    addCollection,
    removeCollection,
    resetToDefaults,
  };
};
