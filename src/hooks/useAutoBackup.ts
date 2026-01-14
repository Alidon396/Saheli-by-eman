import { useEffect, useCallback } from 'react';
import { useProducts } from './useProducts';
import { useSales } from './useSales';
import { useCustomers } from './useCustomers';
import { exportAllDataToCSV } from '@/utils/ledgerExport';
import { useToast } from './use-toast';

const BACKUP_INTERVAL_KEY = 'saheli-backup-interval';
const LAST_BACKUP_KEY = 'saheli-last-backup';

export const useAutoBackup = () => {
  const { products } = useProducts();
  const { sales } = useSales();
  const { getCustomersWithBalance } = useCustomers();
  const { toast } = useToast();

  const performBackup = useCallback(() => {
    const customers = getCustomersWithBalance();
    exportAllDataToCSV({ products, sales, customers });
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    toast({
      title: 'Backup Complete',
      description: `Exported ${products.length} products, ${sales.length} sales, ${customers.length} customers`,
    });
  }, [products, sales, getCustomersWithBalance, toast]);

  const getLastBackupDate = useCallback(() => {
    const stored = localStorage.getItem(LAST_BACKUP_KEY);
    return stored ? new Date(stored) : null;
  }, []);

  const setBackupInterval = useCallback((hours: number) => {
    localStorage.setItem(BACKUP_INTERVAL_KEY, hours.toString());
  }, []);

  const getBackupInterval = useCallback(() => {
    const stored = localStorage.getItem(BACKUP_INTERVAL_KEY);
    return stored ? parseInt(stored, 10) : 24; // default 24 hours
  }, []);

  // Auto backup check
  useEffect(() => {
    const checkBackup = () => {
      const interval = getBackupInterval();
      if (interval === 0) return; // disabled

      const lastBackup = getLastBackupDate();
      if (!lastBackup) return;

      const hoursSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
      if (hoursSinceBackup >= interval) {
        toast({
          title: 'Backup Reminder',
          description: `It's been ${Math.floor(hoursSinceBackup)} hours since your last backup. Click to export.`,
        });
      }
    };

    // Check on mount and every hour
    checkBackup();
    const intervalId = setInterval(checkBackup, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [getBackupInterval, getLastBackupDate, toast]);

  return {
    performBackup,
    getLastBackupDate,
    setBackupInterval,
    getBackupInterval,
  };
};
