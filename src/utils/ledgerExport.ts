import { format } from 'date-fns';
import { LedgerExportRow, DetailedLedgerEntry } from '@/types/ledger';

export const exportLedgerToCSV = (entries: DetailedLedgerEntry[], customerName?: string) => {
  const rows: LedgerExportRow[] = [];
  
  entries.forEach(entry => {
    if (entry.products && entry.products.length > 0) {
      // Add a row for each product in the sale
      entry.products.forEach((product, idx) => {
        rows.push({
          date: idx === 0 ? format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm') : '',
          customerName: idx === 0 ? entry.customerName : '',
          productName: product.productName,
          quantity: product.quantity,
          rate: product.rate,
          debit: idx === entry.products!.length - 1 ? entry.debit : '',
          credit: '',
          balance: idx === entry.products!.length - 1 ? entry.balance : 0,
          description: idx === 0 ? entry.description : '',
        });
      });
    } else {
      // Payment or entries without products
      rows.push({
        date: format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm'),
        customerName: entry.customerName,
        productName: entry.description,
        quantity: '-',
        rate: '-',
        debit: entry.debit || '',
        credit: entry.credit || '',
        balance: entry.balance,
        description: entry.description,
      });
    }
  });

  const headers = ['Date', 'Customer Name', 'Product Name', 'Qty', 'Rate', 'Debit', 'Credit', 'Balance', 'Description'];
  const csvContent = [
    headers.join(','),
    ...rows.map(row => [
      row.date,
      `"${row.customerName}"`,
      `"${row.productName}"`,
      row.quantity,
      row.rate,
      row.debit,
      row.credit,
      row.balance || '',
      `"${row.description}"`,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ledger_${customerName || 'all'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAllDataToCSV = (data: {
  products: any[];
  sales: any[];
  customers: any[];
}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  
  // Export products
  if (data.products.length > 0) {
    const productHeaders = ['Product Code', 'Product Name', 'Category', 'Unit', 'Purchase Price', 'Sale Price', 'Stock Qty', 'Brand', 'Fabric'];
    const productCSV = [
      productHeaders.join(','),
      ...data.products.map(p => [
        p.productCode,
        `"${p.productName}"`,
        p.category,
        p.unit,
        p.purchasePrice,
        p.salePrice,
        p.stockQty,
        p.brand || '',
        p.fabric || ''
      ].join(','))
    ].join('\n');
    downloadCSV(productCSV, `products_backup_${timestamp}.csv`);
  }

  // Export sales
  if (data.sales.length > 0) {
    const salesHeaders = ['Bill ID', 'Date', 'Customer', 'Phone', 'Subtotal', 'Discount', 'Grand Total', 'Items'];
    const salesCSV = [
      salesHeaders.join(','),
      ...data.sales.map(s => [
        s.id,
        format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm'),
        `"${s.customerName || ''}"`,
        s.customerPhone || '',
        s.subtotal,
        s.totalDiscount,
        s.grandTotal,
        s.items.length
      ].join(','))
    ].join('\n');
    downloadCSV(salesCSV, `sales_backup_${timestamp}.csv`);
  }

  // Export customers
  if (data.customers.length > 0) {
    const customerHeaders = ['Customer ID', 'Name', 'Phone', 'Address', 'Balance', 'Total Purchases', 'Total Payments'];
    const customerCSV = [
      customerHeaders.join(','),
      ...data.customers.map(c => [
        c.id,
        `"${c.name}"`,
        c.phone,
        `"${c.address || ''}"`,
        c.balance || 0,
        c.totalPurchases || 0,
        c.totalPayments || 0
      ].join(','))
    ].join('\n');
    downloadCSV(customerCSV, `customers_backup_${timestamp}.csv`);
  }
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
