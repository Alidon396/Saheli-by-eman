export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: Date;
}

export interface LedgerEntryProduct {
  productCode: string;
  productName: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  type: 'sale' | 'payment' | 'credit';
  amount: number;
  description: string;
  billId?: string;
  products?: LedgerEntryProduct[];
  createdAt: Date;
}

export interface CustomerWithBalance extends Customer {
  balance: number; // positive = customer owes, negative = store owes
  totalPurchases: number;
  totalPayments: number;
}
