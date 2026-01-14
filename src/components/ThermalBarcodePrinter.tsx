import { BillItem } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Tag, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface ThermalBarcodePrinterProps {
  billItems: BillItem[];
  open: boolean;
  onClose: () => void;
}

type PrinterWidth = '58mm' | '80mm';

interface BarcodePreviewProps {
  value: string;
  productName: string;
  productCode: string;
  price: number;
  width: number;
  height: number;
}

const BarcodePreview = ({ value, productName, productCode, price, width, height }: BarcodePreviewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: true,
          fontSize: 10,
          margin: 2,
          background: "#ffffff"
        });
      } catch (e) {
        console.error("Barcode preview error:", e);
      }
    }
  }, [value, width, height]);

  return (
    <div className="bg-white text-black p-2 rounded border text-center">
      <div className="text-xs font-bold truncate">{productName}</div>
      <div className="text-[10px] text-gray-600">{productCode}</div>
      <svg ref={svgRef} className="mx-auto" />
      <div className="text-xs font-bold">Rs.{price.toLocaleString()}</div>
    </div>
  );
};

export const ThermalBarcodePrinter = ({ billItems, open, onClose }: ThermalBarcodePrinterProps) => {
  const [printerWidth, setPrinterWidth] = useState<PrinterWidth>('58mm');
  const [copiesPerItem, setCopiesPerItem] = useState(1);

  const barcodeWidth = printerWidth === '58mm' ? 1.2 : 1.5;
  const barcodeHeight = printerWidth === '58mm' ? 30 : 40;
  const fontSize = printerWidth === '58mm' ? 8 : 10;

  const handlePrint = () => {
    const widthPx = printerWidth === '58mm' ? 164 : 227;

    const printContent = `
      <html>
        <head>
          <title>Barcode Labels - Thermal Print</title>
          <style>
            @page { 
              size: ${printerWidth} auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body { 
              font-family: 'Arial', sans-serif;
              width: ${widthPx}px;
              background: #fff;
            }
            .label {
              width: 100%;
              padding: ${printerWidth === '58mm' ? '4px 2px' : '6px 4px'};
              text-align: center;
              border-bottom: 1px dashed #000;
              page-break-after: always;
            }
            .label:last-child {
              border-bottom: none;
            }
            .product-name {
              font-size: ${fontSize + 1}px;
              font-weight: bold;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              line-height: 1.2;
            }
            .product-code {
              font-size: ${fontSize - 1}px;
              color: #333;
              margin-bottom: 3px;
            }
            .price {
              font-size: ${fontSize + 2}px;
              font-weight: bold;
              margin-top: 2px;
            }
            .barcode-container svg {
              max-width: 100%;
              height: ${barcodeHeight}px;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${billItems.flatMap(item => 
            Array(copiesPerItem).fill(null).map((_, i) => `
              <div class="label">
                <div class="product-name">${item.product.productName}</div>
                <div class="product-code">${item.product.productCode}</div>
                <div class="barcode-container"><svg id="barcode-${item.product.productCode.replace(/[^a-zA-Z0-9]/g, '')}-${i}"></svg></div>
                <div class="price">Rs.${item.product.salePrice.toLocaleString()}</div>
              </div>
            `)
          ).join('')}
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              ${billItems.flatMap(item => {
                const barcodeValue = item.product.barcode || item.product.productCode;
                const safeId = item.product.productCode.replace(/[^a-zA-Z0-9]/g, '');
                return Array(copiesPerItem).fill(null).map((_, i) => `
                  try {
                    JsBarcode("#barcode-${safeId}-${i}", "${barcodeValue}", {
                      format: "CODE128",
                      width: ${barcodeWidth},
                      height: ${barcodeHeight},
                      displayValue: true,
                      fontSize: ${fontSize},
                      margin: 2,
                      background: "#ffffff"
                    });
                  } catch(e) { console.error("Barcode error:", e); }
                `);
              }).join('')}
              setTimeout(function() { window.print(); }, 800);
            });
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
    onClose();
  };

  const totalLabels = billItems.length * copiesPerItem;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Print Barcode Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Printer Width */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Thermal Printer Width</Label>
            <RadioGroup
              value={printerWidth}
              onValueChange={(val) => setPrinterWidth(val as PrinterWidth)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="58mm" id="58mm" />
                <Label htmlFor="58mm" className="cursor-pointer">58mm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="80mm" id="80mm" />
                <Label htmlFor="80mm" className="cursor-pointer">80mm</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Copies per item */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Copies per Item</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
          </div>

          {/* Barcode Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Barcode Preview
            </Label>
            <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-2">
              <div className="grid gap-2">
                {billItems.map(item => (
                  <BarcodePreview
                    key={item.product.productCode}
                    value={item.product.barcode || item.product.productCode}
                    productName={item.product.productName}
                    productCode={item.product.productCode}
                    price={item.product.salePrice}
                    width={barcodeWidth}
                    height={barcodeHeight}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="text-sm text-center py-2 bg-primary/10 rounded-lg">
            <span className="font-semibold text-primary">{totalLabels} labels</span> will be printed
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handlePrint} 
              disabled={billItems.length === 0}
              className="gradient-primary"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
