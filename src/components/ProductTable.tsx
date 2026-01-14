import { useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { BarcodeDisplay } from './BarcodeDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Trash2, Search, Barcode, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productCode: string) => void;
  selectedCategory: string | null;
}

const safeDomId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

export const ProductTable = ({ products, onEdit, onDelete, selectedCategory }: ProductTableProps) => {
  const [search, setSearch] = useState('');
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase();
      const matchesSearch =
        product.productName.toLowerCase().includes(q) ||
        product.productCode.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.fabric && product.fabric.toLowerCase().includes(q));
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const getStockBadge = (qty: number) => {
    if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (qty < 10) return <Badge variant="outline" className="border-warning text-warning">Low Stock</Badge>;
    return <Badge variant="secondary">In Stock</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '1PC': 'bg-pink-100 text-pink-700',
      '2PC': 'bg-purple-100 text-purple-700',
      '3PC': 'bg-primary/10 text-primary',
      'SUMMER': 'bg-warning/10 text-warning',
      'WINTER': 'bg-info/10 text-info',
      'NEW': 'bg-success/10 text-success',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      '1PC': '1 Piece',
      '2PC': '2 Piece',
      '3PC': '3 Piece',
      'SUMMER': 'Summer',
      'WINTER': 'Winter',
      'NEW': 'New In',
    };
    return labels[category] || category;
  };

  const formatPrice = (price: number) => {
    return `Rs.${price.toLocaleString()}`;
  };

  const handlePrintSingle = (product: Product) => {
    const domId = `barcode-${safeDomId(product.productCode)}`;
    const barcodeValue = product.barcode || product.productCode;

    const printContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Barcode - ${product.productCode}</title>
          <style>
            @page { size: 80mm auto; margin: 0mm; }
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 4mm; color: #000; }
            .label { width: 80mm; border: 1px dashed #ccc; padding: 3mm; background: #fff; }
            .name { font-size: 10px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .code { font-size: 9px; opacity: 0.8; margin-top: 1px; }
            .barcode { display: flex; justify-content: center; margin-top: 2px; }
            .barcode svg { width: 100%; height: 36px; }
            .price { font-size: 11px; font-weight: 700; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${product.productName}</div>
            <div class="code">${product.productCode}</div>
            <div class="barcode"><svg id="${domId}"></svg></div>
            <div class="price">Rs.${Number(product.salePrice).toLocaleString()}</div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
          <script>
            const render = () => {
              if (!window.JsBarcode) return;
              try {
                const el = document.getElementById('${domId}');
                if (!el) return;
                window.JsBarcode(el, '${String(barcodeValue)}', {
                  format: 'CODE128',
                  width: 1.5,
                  height: 44,
                  displayValue: true,
                  fontSize: 10,
                  margin: 0,
                  background: 'transparent',
                });
                setTimeout(() => window.print(), 250);
              } catch (e) {
                // no-op
              }
            };
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', render);
            } else {
              render();
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, brand, fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Product Name</TableHead>
                <TableHead className="font-semibold">Collection</TableHead>
                <TableHead className="font-semibold">Brand</TableHead>
                <TableHead className="font-semibold">Fabric</TableHead>
                <TableHead className="font-semibold text-right">Cost</TableHead>
                <TableHead className="font-semibold text-right">Sale</TableHead>
                <TableHead className="font-semibold text-right">Stock</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow
                  key={product.productCode}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-mono text-sm font-medium text-primary">{product.productCode}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{product.productName}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(product.category)}`}
                    >
                      {getCategoryLabel(product.category)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.brand || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{product.fabric || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(product.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{formatPrice(product.salePrice)}</TableCell>
                  <TableCell className="text-right font-medium">{product.stockQty}</TableCell>
                  <TableCell>{getStockBadge(product.stockQty)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBarcodeProduct(product)}
                        className="h-8 w-8"
                        aria-label="View barcode"
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(product)}
                        className="h-8 w-8"
                        aria-label="Edit product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(product.productCode)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Product Barcode</DialogTitle>
          </DialogHeader>
          {barcodeProduct && (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-lg font-medium text-center">{barcodeProduct.productName}</p>
              {barcodeProduct.brand && (
                <p className="text-sm text-muted-foreground">
                  {barcodeProduct.brand} • {barcodeProduct.fabric}
                </p>
              )}
              <div className="bg-card p-4 rounded-lg border w-full">
                <BarcodeDisplay
                  value={barcodeProduct.barcode || barcodeProduct.productCode}
                  height={80}
                  width={3}
                />
              </div>
              <div className="flex items-center justify-between w-full gap-2">
                <p className="text-sm text-muted-foreground font-mono truncate">{barcodeProduct.productCode}</p>
                <Button size="sm" onClick={() => handlePrintSingle(barcodeProduct)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
