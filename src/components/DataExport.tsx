import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Product } from '@/types/product';

interface DataExportProps {
  products: Product[];
}

export const DataExport = ({ products }: DataExportProps) => {
  const exportCSV = () => {
    const headers = ['productCode', 'productName', 'category', 'unit', 'purchasePrice', 'salePrice', 'stockQty', 'barcode', 'brand', 'fabric', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => 
        headers.map(h => {
          const value = p[h as keyof Product];
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    downloadFile(csvContent, 'saheli-products.csv', 'text/csv');
  };

  const exportJSON = () => {
    const jsonContent = JSON.stringify(products, null, 2);
    downloadFile(jsonContent, 'saheli-products.json', 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
