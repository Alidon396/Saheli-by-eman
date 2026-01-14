import { LedgerEntryProduct } from './customer';

export interface DetailedLedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'sale' | 'payment' | 'credit';
  billId?: string;
  productName?: string;
  quantity?: number;
  rate?: number;
  debit: number; // amount owed by customer
  credit: number; // amount paid by customer
  balance: number; // running balance
  description: string;
  products?: LedgerEntryProduct[];
  createdAt: Date;
}

export interface LedgerExportRow {
  date: string;
  customerName: string;
  productName: string;
  quantity: number | string;
  rate: number | string;
  debit: number | string;
  credit: number | string;
  balance: number;
  description: string;
}
