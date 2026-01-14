import { useState, useCallback, useEffect } from 'react';
import { Product, Category } from '@/types/product';

const STORAGE_KEY = 'saheli-products';

const generateBarcode = (productCode: string): string => {
  return productCode;
};

const generateProductCode = (category: Category, existingProducts: Product[]): string => {
  const categoryProducts = existingProducts.filter(p => p.productCode.startsWith(category));
  const maxNumber = categoryProducts.reduce((max, p) => {
    const numPart = parseInt(p.productCode.replace(category, ''), 10);
    return numPart > max ? numPart : max;
  }, 0);
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${category}${nextNumber}`;
};

const defaultProducts: Product[] = [
  // 1 Piece Unstitched
  {
    productCode: '1PC001',
    productName: 'Embroidered Khaddar Shirt',
    category: '1PC',
    unit: 'piece',
    purchasePrice: 2500,
    salePrice: 3990,
    stockQty: 25,
    barcode: '1PC001',
    createdAt: new Date('2024-01-15'),
    brand: 'Sapphire',
    fabric: 'Khaddar',
  },
  {
    productCode: '1PC002',
    productName: 'Embroidered Viscose Shirt',
    category: '1PC',
    unit: 'piece',
    purchasePrice: 2900,
    salePrice: 4590,
    stockQty: 18,
    barcode: '1PC002',
    createdAt: new Date('2024-01-16'),
    brand: 'Sapphire',
    fabric: 'Viscose',
  },
  {
    productCode: '1PC003',
    productName: 'Printed Lawn Shirt',
    category: '1PC',
    unit: 'piece',
    purchasePrice: 1800,
    salePrice: 2990,
    stockQty: 32,
    barcode: '1PC003',
    createdAt: new Date('2024-01-17'),
    brand: 'Khaadi',
    fabric: 'Lawn',
  },
  // 2 Piece Unstitched
  {
    productCode: '2PC001',
    productName: 'Embroidered Lawn 2PC',
    category: '2PC',
    unit: 'set',
    purchasePrice: 3200,
    salePrice: 4990,
    stockQty: 15,
    barcode: '2PC001',
    createdAt: new Date('2024-01-18'),
    brand: 'Maria B',
    fabric: 'Lawn',
  },
  {
    productCode: '2PC002',
    productName: 'Printed Khaddar 2PC',
    category: '2PC',
    unit: 'set',
    purchasePrice: 2800,
    salePrice: 4290,
    stockQty: 22,
    barcode: '2PC002',
    createdAt: new Date('2024-01-19'),
    brand: 'Sapphire',
    fabric: 'Khaddar',
  },
  // 3 Piece Unstitched
  {
    productCode: '3PC001',
    productName: '3 Piece - Embroidered Khaddar Suit',
    category: '3PC',
    unit: 'set',
    purchasePrice: 4200,
    salePrice: 6990,
    stockQty: 12,
    barcode: '3PC001',
    createdAt: new Date('2024-01-20'),
    brand: 'Sapphire',
    fabric: 'Khaddar',
  },
  {
    productCode: '3PC002',
    productName: '3 Piece - Embroidered Cotton Satin Suit',
    category: '3PC',
    unit: 'set',
    purchasePrice: 5000,
    salePrice: 7990,
    stockQty: 8,
    barcode: '3PC002',
    createdAt: new Date('2024-01-21'),
    brand: 'Sapphire',
    fabric: 'Cotton Satin',
  },
  {
    productCode: '3PC003',
    productName: '3 Piece - Printed Khaddar Suit',
    category: '3PC',
    unit: 'set',
    purchasePrice: 2500,
    salePrice: 3990,
    stockQty: 28,
    barcode: '3PC003',
    createdAt: new Date('2024-01-22'),
    brand: 'Sapphire',
    fabric: 'Khaddar',
  },
  // Winter Collection
  {
    productCode: 'WINTER001',
    productName: 'Embroidered Velvet Shawl Suit',
    category: 'WINTER',
    unit: 'set',
    purchasePrice: 6500,
    salePrice: 9990,
    stockQty: 6,
    barcode: 'WINTER001',
    createdAt: new Date('2024-01-23'),
    brand: 'Baroque',
    fabric: 'Khaddar',
  },
  {
    productCode: 'WINTER002',
    productName: 'Printed Pashmina Suit',
    category: 'WINTER',
    unit: 'set',
    purchasePrice: 5200,
    salePrice: 8490,
    stockQty: 10,
    barcode: 'WINTER002',
    createdAt: new Date('2024-01-24'),
    brand: 'Gul Ahmed',
    fabric: 'Khaddar',
  },
  // Summer Collection
  {
    productCode: 'SUMMER001',
    productName: 'Printed Lawn 3PC Summer',
    category: 'SUMMER',
    unit: 'set',
    purchasePrice: 3000,
    salePrice: 4590,
    stockQty: 35,
    barcode: 'SUMMER001',
    createdAt: new Date('2024-01-25'),
    brand: 'Sapphire',
    fabric: 'Lawn',
  },
  {
    productCode: 'SUMMER002',
    productName: 'Embroidered Chiffon Dupatta Set',
    category: 'SUMMER',
    unit: 'set',
    purchasePrice: 4500,
    salePrice: 6990,
    stockQty: 14,
    barcode: 'SUMMER002',
    createdAt: new Date('2024-01-26'),
    brand: 'Maria B',
    fabric: 'Chiffon',
  },
  // New Arrivals
  {
    productCode: 'NEW001',
    productName: 'Luxury Organza Embroidered Suit',
    category: 'NEW',
    unit: 'set',
    purchasePrice: 7000,
    salePrice: 11990,
    stockQty: 5,
    barcode: 'NEW001',
    createdAt: new Date('2024-01-27'),
    brand: 'Sapphire',
    fabric: 'Organza',
  },
  {
    productCode: 'NEW002',
    productName: 'Net Embroidered Party Wear',
    category: 'NEW',
    unit: 'set',
    purchasePrice: 8500,
    salePrice: 13990,
    stockQty: 4,
    barcode: 'NEW002',
    createdAt: new Date('2024-01-28'),
    brand: 'Baroque',
    fabric: 'Net',
  },
];

const loadFromStorage = (): Product[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return defaultProducts;
};

const saveToStorage = (products: Product[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(products);
  }, [products]);

  const addProduct = useCallback((productData: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>) => {
    let newProduct: Product;
    setProducts(prev => {
      const productCode = generateProductCode(productData.category as Category, prev);
      newProduct = {
        ...productData,
        productCode,
        barcode: generateBarcode(productCode),
        createdAt: new Date(),
      };
      return [...prev, newProduct];
    });
    return newProduct!;
  }, []);

  const updateProduct = useCallback((productCode: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.productCode === productCode ? { ...p, ...updates } : p
    ));
  }, []);

  const deleteProduct = useCallback((productCode: string) => {
    setProducts(prev => prev.filter(p => p.productCode !== productCode));
  }, []);

  const getStats = useCallback(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.salePrice * p.stockQty), 0);
    const lowStock = products.filter(p => p.stockQty < 10).length;
    const categories = [...new Set(products.map(p => p.category))].length;
    return { totalProducts, totalValue, lowStock, categories };
  }, [products]);

  const resetToDefaults = useCallback(() => {
    setProducts(defaultProducts);
  }, []);

  const clearAllProducts = useCallback(() => {
    setProducts([]);
  }, []);

  const importProducts = useCallback((newProducts: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>[]) => {
    setProducts(prev => {
      const imported: Product[] = [];
      let currentProducts = [...prev];
      
      newProducts.forEach(productData => {
        const productCode = generateProductCode(productData.category as Category, currentProducts);
        const newProduct: Product = {
          ...productData,
          productCode,
          barcode: generateBarcode(productCode),
          createdAt: new Date(),
        };
        currentProducts.push(newProduct);
        imported.push(newProduct);
      });
      
      return currentProducts;
    });
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getStats,
    resetToDefaults,
    clearAllProducts,
    importProducts,
    generateProductCode: (category: Category) => generateProductCode(category, products),
  };
};
