import { Product } from './product';

export interface BillItem {
  product: Product;
  quantity: number;
  discount: number; // percentage
  salePrice: number; // manually entered sale price
}

export interface SavedBillItem {
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number; // purchase price for profit calculation
  discount: number;
  total: number;
}

export interface Bill {
  id: string;
  items: SavedBillItem[];
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  createdAt: Date;
}
