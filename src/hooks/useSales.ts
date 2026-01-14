import { useState, useCallback, useEffect, useMemo } from 'react';
import { Bill } from '@/types/billing';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, format, subDays } from 'date-fns';

const STORAGE_KEY = 'saheli-sales';

const loadFromStorage = (): Bill[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
      }));
    }
  } catch (error) {
    console.error('Error loading sales from localStorage:', error);
  }
  return [];
};

const saveToStorage = (sales: Bill[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  } catch (error) {
    console.error('Error saving sales to localStorage:', error);
  }
};

export const useSales = () => {
  const [sales, setSales] = useState<Bill[]>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(sales);
  }, [sales]);

  const addSale = useCallback((bill: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: `BILL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: new Date(),
    };
    setSales(prev => [newBill, ...prev]);
    return newBill;
  }, []);

  const deleteSale = useCallback((billId: string) => {
    setSales(prev => prev.filter(s => s.id !== billId));
  }, []);

  const clearAllSales = useCallback(() => {
    setSales([]);
  }, []);

  const getStats = useCallback(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const todaySales = sales.filter(s => 
      isWithinInterval(new Date(s.createdAt), { start: todayStart, end: todayEnd })
    );
    const weekSales = sales.filter(s => 
      isWithinInterval(new Date(s.createdAt), { start: weekStart, end: todayEnd })
    );
    const monthSales = sales.filter(s => 
      isWithinInterval(new Date(s.createdAt), { start: monthStart, end: todayEnd })
    );

    return {
      today: {
        count: todaySales.length,
        total: todaySales.reduce((sum, s) => sum + s.grandTotal, 0),
      },
      week: {
        count: weekSales.length,
        total: weekSales.reduce((sum, s) => sum + s.grandTotal, 0),
      },
      month: {
        count: monthSales.length,
        total: monthSales.reduce((sum, s) => sum + s.grandTotal, 0),
      },
      allTime: {
        count: sales.length,
        total: sales.reduce((sum, s) => sum + s.grandTotal, 0),
      },
    };
  }, [sales]);

  const getDailyData = useCallback((days: number = 7) => {
    const now = new Date();
    const data: { date: string; sales: number; orders: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const daySales = sales.filter(s => 
        isWithinInterval(new Date(s.createdAt), { start: dayStart, end: dayEnd })
      );

      data.push({
        date: format(date, 'MMM dd'),
        sales: daySales.reduce((sum, s) => sum + s.grandTotal, 0),
        orders: daySales.length,
      });
    }

    return data;
  }, [sales]);

  const getCategoryData = useCallback(() => {
    const categoryMap: Record<string, number> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.category;
        categoryMap[category] = (categoryMap[category] || 0) + item.total;
      });
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const getTopProducts = useCallback((limit: number = 5) => {
    const productMap: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productMap[item.productCode]) {
          productMap[item.productCode] = { name: item.productName, quantity: 0, revenue: 0, cost: 0 };
        }
        productMap[item.productCode].quantity += item.quantity;
        productMap[item.productCode].revenue += item.total;
        productMap[item.productCode].cost += (item.costPrice || 0) * item.quantity;
      });
    });

    return Object.entries(productMap)
      .map(([code, data]) => ({ code, ...data, profit: data.revenue - data.cost }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [sales]);

  const getProfitStats = useCallback(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        totalRevenue += item.total;
        totalCost += (item.costPrice || 0) * item.quantity;
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
    };
  }, [sales]);

  return {
    sales,
    addSale,
    deleteSale,
    clearAllSales,
    getStats,
    getDailyData,
    getCategoryData,
    getTopProducts,
    getProfitStats,
  };
};
