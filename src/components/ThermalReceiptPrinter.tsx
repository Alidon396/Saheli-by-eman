import { BillItem } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';
import { useState } from 'react';

interface ThermalReceiptPrinterProps {
  open: boolean;
  onClose: () => void;
  billItems: BillItem[];
  calculations: {
    subtotal: number;
    totalDiscount: number;
    grandTotal: number;
  };
  customerName?: string;
  customerPhone?: string;
  storeName: string;
}

type PrinterWidth = '58mm' | '80mm';

const ThermalReceiptPrinter = ({
  open,
  onClose,
  billItems,
  calculations,
  customerName,
  customerPhone,
  storeName,
}: ThermalReceiptPrinterProps) => {
  const [printerWidth, setPrinterWidth] = useState<PrinterWidth>('80mm');

  const handlePrint = () => {
    const paperWidth = printerWidth === '58mm' ? '48mm' : '72mm';
    const fontSize = printerWidth === '58mm' ? '10px' : '12px';
    const smallFont = printerWidth === '58mm' ? '8px' : '10px';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: ${fontSize};
              width: ${paperWidth};
              margin: 0 auto;
              padding: 4mm;
            }
            .header { text-align: center; margin-bottom: 4mm; }
            .store-name { font-size: 14px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .item { display: flex; justify-content: space-between; margin: 1mm 0; }
            .item-name { max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .totals { margin-top: 2mm; }
            .total-row { display: flex; justify-content: space-between; }
            .grand-total { font-weight: bold; font-size: 14px; margin-top: 2mm; }
            .footer { text-align: center; margin-top: 4mm; font-size: ${smallFont}; }
            .customer { font-size: ${smallFont}; margin-bottom: 2mm; }
            @media print {
              @page { 
                size: ${paperWidth} auto; 
                margin: 0; 
              }
              body { 
                width: ${paperWidth}; 
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${storeName}</div>
            <div>${new Date().toLocaleString()}</div>
          </div>
          
          ${customerName || customerPhone ? `
            <div class="customer">
              ${customerName ? `Customer: ${customerName}` : ''}
              ${customerPhone ? `<br>Phone: ${customerPhone}` : ''}
            </div>
          ` : ''}
          
          <div class="divider"></div>
          
          ${billItems.map(item => {
            const total = item.salePrice * item.quantity * (1 - item.discount / 100);
            return `
              <div class="item">
                <span class="item-name">${item.product.productName}</span>
                <span>${item.quantity}x${item.salePrice}</span>
              </div>
              <div class="item">
                <span></span>
                <span>Rs.${total.toLocaleString()}</span>
              </div>
            `;
          }).join('')}
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rs.${calculations.subtotal.toLocaleString()}</span>
            </div>
            ${calculations.totalDiscount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-Rs.${calculations.totalDiscount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="divider"></div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>Rs.${calculations.grandTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping!</p>
            <p>Please visit again</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Thermal Receipt Print
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Printer Paper Width</Label>
            <Select value={printerWidth} onValueChange={(v: PrinterWidth) => setPrinterWidth(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (Small)</SelectItem>
                <SelectItem value="80mm">80mm (Standard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium">Receipt Preview</p>
            <p className="text-2xl font-bold mt-2">Rs.{calculations.grandTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{billItems.length} items</p>
          </div>

          <Button onClick={handlePrint} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThermalReceiptPrinter;
