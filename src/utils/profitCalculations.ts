import { Bill, SavedBillItem } from '@/types/billing';
import { Product } from '@/types/product';

export interface ProfitData {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  profitMargin: number;
  totalDiscount: number;
}

export interface ItemProfitData {
  productCode: string;
  productName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export const calculateItemProfit = (
  item: SavedBillItem,
  products: Product[]
): ItemProfitData => {
  const product = products.find(p => p.productCode === item.productCode);
  const costPrice = product?.purchasePrice || 0;
  const cost = costPrice * item.quantity;
  const revenue = item.total;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    productCode: item.productCode,
    productName: item.productName,
    quantity: item.quantity,
    revenue,
    cost,
    profit,
    margin,
  };
};

export const calculateSaleProfit = (
  sale: Bill,
  products: Product[]
): ProfitData => {
  let costOfGoods = 0;

  sale.items.forEach(item => {
    const product = products.find(p => p.productCode === item.productCode);
    const costPrice = product?.purchasePrice || 0;
    costOfGoods += costPrice * item.quantity;
  });

  const revenue = sale.grandTotal;
  const grossProfit = revenue - costOfGoods;
  const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    costOfGoods,
    grossProfit,
    profitMargin,
    totalDiscount: sale.totalDiscount,
  };
};

export const calculatePeriodProfit = (
  sales: Bill[],
  products: Product[]
): ProfitData => {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscount = 0;

  sales.forEach(sale => {
    const saleProfit = calculateSaleProfit(sale, products);
    totalRevenue += saleProfit.revenue;
    totalCost += saleProfit.costOfGoods;
    totalDiscount += saleProfit.totalDiscount;
  });

  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    revenue: totalRevenue,
    costOfGoods: totalCost,
    grossProfit,
    profitMargin,
    totalDiscount,
  };
};

export const getTopProfitableProducts = (
  sales: Bill[],
  products: Product[],
  limit: number = 5
): ItemProfitData[] => {
  const productProfitMap: Record<string, ItemProfitData> = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const itemProfit = calculateItemProfit(item, products);
      
      if (!productProfitMap[item.productCode]) {
        productProfitMap[item.productCode] = { ...itemProfit };
      } else {
        productProfitMap[item.productCode].quantity += itemProfit.quantity;
        productProfitMap[item.productCode].revenue += itemProfit.revenue;
        productProfitMap[item.productCode].cost += itemProfit.cost;
        productProfitMap[item.productCode].profit += itemProfit.profit;
      }
    });
  });

  // Recalculate margins
  Object.values(productProfitMap).forEach(item => {
    item.margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
  });

  return Object.values(productProfitMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
};
