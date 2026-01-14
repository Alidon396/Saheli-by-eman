import { useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { BarcodeDisplay } from './BarcodeDisplay';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Tags, Search, CheckSquare, Square } from 'lucide-react';

interface BulkBarcodeGeneratorProps {
  products: Product[];
  open: boolean;
  onClose: () => void;
}

type PrintFormat = 'A4' | '58mm' | '80mm';

const safeDomId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

export const BulkBarcodeGenerator = ({ products, open, onClose }: BulkBarcodeGeneratorProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [labelsPerProduct, setLabelsPerProduct] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [printFormat, setPrintFormat] = useState<PrintFormat>('80mm');

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [products, searchQuery]
  );

  const toggleProduct = (productCode: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productCode)) {
      newSelected.delete(productCode);
    } else {
      newSelected.add(productCode);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.productCode)));
    }
  };

  const handlePrint = () => {
    const selectedProductsList = products.filter((p) => selectedProducts.has(p.productCode));

    const labelRows = selectedProductsList.flatMap((product) =>
      Array(labelsPerProduct)
        .fill(null)
        .map((_, i) => {
          const id = `barcode-${safeDomId(product.productCode)}-${i}`;
          return {
            id,
            name: product.productName,
            code: product.productCode,
            barcode: product.barcode || product.productCode,
            price: product.salePrice,
          };
        })
    );

    const isThermal = printFormat !== 'A4';
    const thermalWidthMm = printFormat === '58mm' ? 58 : 80;

    const printContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Barcode Labels - Saheli by Emaan</title>
          <style>
            @page {
              ${isThermal ? `size: ${thermalWidthMm}mm auto; margin: 0mm;` : 'size: A4; margin: 10mm;'}
            }
            body {
              font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
              margin: 0;
              padding: ${isThermal ? '4mm' : '0'};
              color: #000;
            }
            .label-grid {
              ${isThermal ? 'display: flex; flex-direction: column; gap: 3mm;' : 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;'}
            }
            .label {
              border: 1px dashed #ccc;
              background: #fff;
              page-break-inside: avoid;
              ${isThermal ? `width: ${thermalWidthMm}mm; padding: 3mm;` : 'padding: 8px;'}
            }
            .product-name {
              font-size: 10px;
              font-weight: 700;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .product-code {
              font-size: 9px;
              opacity: 0.8;
              margin-bottom: 2px;
            }
            .price {
              font-size: 11px;
              font-weight: 700;
              margin-top: 2px;
            }
            .barcode {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 2px 0;
            }
            .barcode svg {
              width: 100%;
              height: ${isThermal ? '36px' : '40px'};
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .label { border: 1px dashed #999; }
            }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${labelRows
              .map(
                (row) => `
              <div class="label">
                <div class="product-name">${row.name}</div>
                <div class="product-code">${row.code}</div>
                <div class="barcode"><svg id="${row.id}"></svg></div>
                <div class="price">Rs.${Number(row.price).toLocaleString()}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
          <script>
            const rows = ${JSON.stringify(labelRows)};
            const render = () => {
              if (!window.JsBarcode) return;
              for (const row of rows) {
                try {
                  const el = document.getElementById(row.id);
                  if (!el) continue;
                  window.JsBarcode(el, String(row.barcode), {
                    format: "CODE128",
                    width: 1.5,
                    height: ${isThermal ? 44 : 45},
                    displayValue: true,
                    fontSize: 10,
                    margin: 0,
                    background: "transparent",
                  });
                } catch (e) {
                  // no-op
                }
              }
              setTimeout(() => window.print(), 250);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            Bulk Barcode Printing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Print Format</Label>
              <Select value={printFormat} onValueChange={(v) => setPrintFormat(v as PrintFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">Thermal 80mm</SelectItem>
                  <SelectItem value="58mm">Thermal 58mm</SelectItem>
                  <SelectItem value="A4">A4 Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Labels/Product</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={labelsPerProduct}
                  onChange={(e) =>
                    setLabelsPerProduct(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                  }
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between border rounded-lg px-3 py-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                  {selectedProducts.size === filteredProducts.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-1" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-1" /> Select All ({filteredProducts.length})
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} selected • {selectedProducts.size * labelsPerProduct} labels
                </span>
              </div>
            </div>
          </div>

          {/* Product List */}
          <ScrollArea className="flex-1 min-h-0 border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredProducts.map((product) => (
                <div
                  key={product.productCode}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.has(product.productCode)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                  onClick={() => toggleProduct(product.productCode)}
                >
                  <Checkbox
                    checked={selectedProducts.has(product.productCode)}
                    onCheckedChange={() => toggleProduct(product.productCode)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.productCode} • Rs.{product.salePrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <BarcodeDisplay
                      value={product.barcode || product.productCode}
                      width={1}
                      height={30}
                      displayValue={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePrint} disabled={selectedProducts.size === 0} className="gradient-primary">
              <Printer className="h-4 w-4 mr-2" />
              Print {selectedProducts.size * labelsPerProduct} Labels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
