export interface Product {
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stockQty: number;
  barcode: string;
  createdAt: Date;
  image?: string;
  brand?: string;
  fabric?: string;
}

export const CATEGORIES = [
  '1PC',      // 1 Piece Unstitched
  '2PC',      // 2 Piece Unstitched
  '3PC',      // 3 Piece Unstitched
  'SUMMER',   // Summer Collection
  'WINTER',   // Winter Collection
  'NEW',      // New Arrivals
] as const;

export const FABRICS = [
  'Khaddar',
  'Lawn',
  'Chiffon',
  'Silk',
  'Organza',
  'Net',
  'Cotton Satin',
  'Viscose',
] as const;

export const BRANDS = [
  'Sapphire',
  'Baroque',
  'Maria B',
  'Khaadi',
  'Gul Ahmed',
  'Junaid Jamshed',
] as const;

export const UNITS = [
  'piece',
  'set',
  'meter',
] as const;

export type Category = typeof CATEGORIES[number];
export type Unit = typeof UNITS[number];
export type Fabric = typeof FABRICS[number];
export type Brand = typeof BRANDS[number];
