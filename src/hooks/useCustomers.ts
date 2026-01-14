import { useState, useCallback, useEffect } from 'react';
import { Customer, LedgerEntry, CustomerWithBalance } from '@/types/customer';

const CUSTOMERS_KEY = 'saheli-customers';
const LEDGER_KEY = 'saheli-ledger';

const loadCustomers = (): Customer[] => {
  try {
    const stored = localStorage.getItem(CUSTOMERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    }
  } catch (error) {
    console.error('Error loading customers:', error);
  }
  return [];
};

const loadLedger = (): LedgerEntry[] => {
  try {
    const stored = localStorage.getItem(LEDGER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((e: any) => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }));
    }
  } catch (error) {
    console.error('Error loading ledger:', error);
  }
  return [];
};

const saveCustomers = (customers: Customer[]) => {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error('Error saving customers:', error);
  }
};

const saveLedger = (ledger: LedgerEntry[]) => {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch (error) {
    console.error('Error saving ledger:', error);
  }
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => loadLedger());

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveLedger(ledger);
  }, [ledger]);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      createdAt: new Date(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setLedger(prev => prev.filter(e => e.customerId !== id));
  }, []);

  const addLedgerEntry = useCallback((entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    const newEntry: LedgerEntry = {
      ...entry,
      id: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      createdAt: new Date(),
    };
    setLedger(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const getCustomerLedger = useCallback((customerId: string) => {
    return ledger
      .filter(e => e.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ledger]);

  const getCustomerBalance = useCallback((customerId: string) => {
    const entries = ledger.filter(e => e.customerId === customerId);
    return entries.reduce((balance, entry) => {
      if (entry.type === 'sale' || entry.type === 'credit') {
        return balance + entry.amount;
      } else if (entry.type === 'payment') {
        return balance - entry.amount;
      }
      return balance;
    }, 0);
  }, [ledger]);

  const getCustomersWithBalance = useCallback((): CustomerWithBalance[] => {
    return customers.map(customer => {
      const entries = ledger.filter(e => e.customerId === customer.id);
      const totalPurchases = entries
        .filter(e => e.type === 'sale' || e.type === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);
      const totalPayments = entries
        .filter(e => e.type === 'payment')
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        ...customer,
        balance: totalPurchases - totalPayments,
        totalPurchases,
        totalPayments,
      };
    });
  }, [customers, ledger]);

  const searchCustomers = useCallback((query: string) => {
    const q = query.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }, [customers]);

  const getTotalReceivables = useCallback(() => {
    const customersWithBalance = getCustomersWithBalance();
    return customersWithBalance
      .filter(c => c.balance > 0)
      .reduce((sum, c) => sum + c.balance, 0);
  }, [getCustomersWithBalance]);

  return {
    customers,
    ledger,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addLedgerEntry,
    getCustomerLedger,
    getCustomerBalance,
    getCustomersWithBalance,
    searchCustomers,
    getTotalReceivables,
  };
};
