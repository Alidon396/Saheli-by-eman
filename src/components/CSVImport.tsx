import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Product, CATEGORIES, FABRICS, BRANDS, UNITS } from '@/types/product';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (products: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>[]) => void;
}

export const CSVImport = ({ open, onClose, onImport }: CSVImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const requiredHeaders = ['productname', 'category', 'saleprice'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const products: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      if (values.length !== headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });

      const category = row.category?.toUpperCase() || '1PC';
      const validCategory = CATEGORIES.includes(category as any) ? category : '1PC';
      const fabric = row.fabric || '';
      const validFabric = FABRICS.includes(fabric as any) ? fabric : undefined;
      const brand = row.brand || '';
      const validBrand = BRANDS.includes(brand as any) ? brand : undefined;
      const unit = row.unit?.toLowerCase() || 'piece';
      const validUnit = UNITS.includes(unit as any) ? unit : 'piece';

      products.push({
        productName: row.productname || 'Unnamed Product',
        category: validCategory,
        unit: validUnit,
        purchasePrice: parseFloat(row.purchaseprice) || 0,
        salePrice: parseFloat(row.saleprice) || 0,
        stockQty: parseInt(row.stockqty) || 0,
        brand: validBrand,
        fabric: validFabric,
      });
    }

    return products;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const products = parseCSV(text);
        setPreview(products);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
      setPreview(null);
      onClose();
    }
  };

  const handleClose = () => {
    setError(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Products from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with your products. Required columns: productName, category, salePrice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Preview: {preview.length} products found
              </p>
              <div className="max-h-48 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{p.productName}</td>
                        <td className="p-2">{p.category}</td>
                        <td className="p-2 text-right">Rs.{p.salePrice}</td>
                        <td className="p-2 text-right">{p.stockQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    ...and {preview.length - 10} more products
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleImport} className="gradient-primary">
                  Import {preview.length} Products
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">CSV Format:</p>
            <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
              productName,category,unit,purchasePrice,salePrice,stockQty,brand,fabric
            </code>
            <p>Categories: 1PC, 2PC, 3PC, SUMMER, WINTER, NEW</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
