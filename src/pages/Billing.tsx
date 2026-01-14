import { useState, useMemo, useEffect, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { useCustomers } from '@/hooks/useCustomers';
import { BillItem, SavedBillItem } from '@/types/billing';
import { Product } from '@/types/product';
import { CustomerWithBalance } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ShoppingCart, Receipt, Minus, Plus, RotateCcw, CreditCard, Banknote, QrCode, Calendar, Printer } from 'lucide-react';
import logo from '@/assets/logo.png';
import BarcodeScanner from '@/components/BarcodeScanner';
import NavigationMenu from '@/components/NavigationMenu';
import SettingsDialog from '@/components/SettingsDialog';
import CustomerSelector from '@/components/CustomerSelector';
import ThermalReceiptPrinter from '@/components/ThermalReceiptPrinter';

type PaymentMethod = 'cash' | 'card' | 'online' | 'credit';

const Sale = () => {
  const { products, updateProduct } = useProducts();
  const { addSale } = useSales();
  const { settings } = useSettings();
  const { addLedgerEntry } = useCustomers();
  const { toast } = useToast();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBalance | null>(null);
  const [addToCredit, setAddToCredit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThermalPrint, setShowThermalPrint] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input for hardware scanner
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If typing in an input, don't interfere
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Focus barcode scanner on any key press
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const addToBill = (product: Product) => {
    const existingIndex = billItems.findIndex(item => item.product.productCode === product.productCode);
    
    if (existingIndex >= 0) {
      const newItems = [...billItems];
      if (newItems[existingIndex].quantity < product.stockQty) {
        newItems[existingIndex].quantity += 1;
        setBillItems(newItems);
      } else {
        toast({
          title: 'Stock Limit',
          description: `Only ${product.stockQty} units available`,
          variant: 'destructive',
        });
      }
    } else {
      setBillItems([...billItems, { product, quantity: 1, discount: 0, salePrice: product.salePrice || 0 }]);
    }
  };

  const updateSalePrice = (index: number, price: number) => {
    const newItems = [...billItems];
    newItems[index].salePrice = Math.max(0, price);
    setBillItems(newItems);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...billItems];
    const maxQty = newItems[index].product.stockQty;
    newItems[index].quantity = Math.min(Math.max(1, quantity), maxQty);
    setBillItems(newItems);
  };

  const updateDiscount = (index: number, discount: number) => {
    const newItems = [...billItems];
    newItems[index].discount = Math.min(Math.max(0, discount), 100);
    setBillItems(newItems);
  };

  const removeItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculations = useMemo(() => {
    const subtotal = billItems.reduce((sum, item) => 
      sum + (item.salePrice * item.quantity), 0
    );
    const totalDiscount = billItems.reduce((sum, item) => 
      sum + (item.salePrice * item.quantity * item.discount / 100), 0
    );
    const taxAmount = 0;
    const grandTotal = subtotal - totalDiscount + taxAmount;
    return { subtotal, totalDiscount, taxAmount, grandTotal };
  }, [billItems]);

  const handleCompleteSale = () => {
    if (billItems.length === 0) {
      toast({
        title: 'Empty Bill',
        description: 'Add items to the bill before completing',
        variant: 'destructive',
      });
      return;
    }

    // Update stock
    billItems.forEach(item => {
      updateProduct(item.product.productCode, {
        stockQty: item.product.stockQty - item.quantity,
      });
    });

    const savedItems: SavedBillItem[] = billItems.map(item => {
      const itemTotal = item.salePrice * item.quantity;
      const discountAmount = itemTotal * item.discount / 100;
      return {
        productCode: item.product.productCode,
        productName: item.product.productName,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: item.salePrice,
        costPrice: item.product.purchasePrice,
        discount: item.discount,
        total: itemTotal - discountAmount,
      };
    });

    const bill = addSale({
      items: savedItems,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      subtotal: calculations.subtotal,
      totalDiscount: calculations.totalDiscount,
      grandTotal: calculations.grandTotal,
    });

    // Add to customer ledger if customer selected and credit/udhaar
    if (selectedCustomer && (addToCredit || paymentMethod === 'credit')) {
      addLedgerEntry({
        customerId: selectedCustomer.id,
        type: 'sale',
        amount: calculations.grandTotal,
        description: `Bill #${bill.id.slice(-8)} - ${savedItems.length} items`,
        billId: bill.id,
        products: savedItems.map(item => ({
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          rate: item.unitPrice,
          total: item.total,
        })),
      });
      toast({
        title: 'Added to Credit',
        description: `Rs.${calculations.grandTotal.toLocaleString()} added to ${selectedCustomer.name}'s account`,
      });
    }

    toast({
      title: 'Sale Complete',
      description: `Invoice for Rs.${calculations.grandTotal.toLocaleString()} created`,
    });

    // Reset
    setBillItems([]);
    setSelectedCustomer(null);
    setAddToCredit(false);
    setPaymentMethod('cash');
  };

  const handlePrintInvoice = () => {
    if (billItems.length === 0) return;

    const printContent = `
      <html>
        <head>
          <title>Invoice - ${settings.storeName}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; font-size: 12px; color: #666; }
            .customer { margin-bottom: 15px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { padding: 8px 4px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
            .totals { border-top: 2px solid #000; padding-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
            .grand-total { font-weight: bold; font-size: 18px !important; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.storeName}</h1>
            <p>Invoice</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          ${selectedCustomer ? `
            <div class="customer">
              <div><strong>Customer:</strong> ${selectedCustomer.name}</div>
              <div><strong>Phone:</strong> ${selectedCustomer.phone}</div>
            </div>
          ` : ''}
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems.map(item => `
                <tr>
                  <td>${item.product.productName}<br><small>${item.product.productCode}</small></td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">Rs.${item.salePrice.toLocaleString()}</td>
                  <td class="text-right">Rs.${(item.salePrice * item.quantity).toLocaleString()}${item.discount > 0 ? `<br><small>-${item.discount}%</small>` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal:</span><span>Rs.${calculations.subtotal.toLocaleString()}</span></div>
            ${calculations.totalDiscount > 0 ? `<div><span>Discount:</span><span>-Rs.${calculations.totalDiscount.toLocaleString()}</span></div>` : ''}
            <div class="grand-total"><span>Grand Total:</span><span>Rs.${calculations.grandTotal.toLocaleString()}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const clearBill = () => {
    setBillItems([]);
    setSelectedCustomer(null);
    setAddToCredit(false);
  };

  const transactionId = useMemo(() => {
    return `TRX-${Date.now().toString().slice(-5)}`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NavigationMenu onSettingsClick={() => setShowSettings(true)} />
              <img src={logo} alt="Logo" className="h-9 w-auto" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">Sale Transaction</h1>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                    {transactionId}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{settings.storeName} • POS Terminal 01</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Side - Barcode Scanner + Items Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner - Prominent */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
              <BarcodeScanner 
                products={products} 
                onProductScanned={addToBill}
                inputRef={barcodeInputRef}
              />
            </div>

            {/* Bill Items Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">Product Details</div>
                <div className="col-span-2 text-center">Sale Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Disc %</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {/* Table Body */}
              <div className="divide-y max-h-[400px] overflow-auto">
                {billItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                    <p className="font-medium">No items in cart</p>
                    <p className="text-sm">Scan barcode or enter SKU to add products</p>
                  </div>
                ) : (
                  billItems.map((item, index) => {
                    const itemTotal = item.salePrice * item.quantity;
                    const discountAmount = itemTotal * item.discount / 100;
                    const finalTotal = itemTotal - discountAmount;
                    
                    return (
                      <div key={item.product.productCode} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            IMG
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.productName}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.product.productCode}</p>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Input
                            type="number"
                            min={0}
                            value={item.salePrice || ''}
                            onChange={(e) => updateSalePrice(index, parseFloat(e.target.value) || 0)}
                            placeholder="Price"
                            className="w-20 h-7 text-center text-sm font-bold"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQty}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount || ''}
                            onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                            placeholder="-"
                            className="w-14 h-7 text-center text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-xs text-muted-foreground">PKR</span>
                          <p className="font-bold text-sm">{finalTotal.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              {billItems.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
                  <Button variant="outline" size="sm">
                    Hold Bill
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={clearBill}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset Sale
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Customer & Payment */}
          <div className="space-y-4">
            {/* Customer Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onSelect={setSelectedCustomer}
                  onAddToCredit={addToCredit}
                  onCreditChange={setAddToCredit}
                />
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({billItems.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                  <span className="font-medium">PKR {calculations.subtotal.toLocaleString()}</span>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-primary font-medium">-PKR {calculations.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">Grand Total</span>
                    <span className="text-2xl font-bold text-primary">PKR {calculations.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className={paymentMethod === 'cash' ? 'gradient-primary' : ''}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote className="h-4 w-4 mr-1" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    className={paymentMethod === 'card' ? 'gradient-primary' : ''}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'online' ? 'default' : 'outline'}
                    className={paymentMethod === 'online' ? 'gradient-primary' : ''}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    Online
                  </Button>
                  <Button
                    variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                    className={paymentMethod === 'credit' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setPaymentMethod('credit')}
                    disabled={!selectedCustomer}
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    Credit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleCompleteSale} 
                className="w-full h-12 gradient-primary shadow-glow text-base font-semibold"
                disabled={billItems.length === 0}
              >
                Complete Sale
                <Receipt className="h-5 w-5 ml-2" />
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={handlePrintInvoice}
                  disabled={billItems.length === 0}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowThermalPrint(true)}
                  disabled={billItems.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Thermal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Thermal Receipt Printer */}
      <ThermalReceiptPrinter
        open={showThermalPrint}
        onClose={() => setShowThermalPrint(false)}
        billItems={billItems}
        calculations={calculations}
        customerName={selectedCustomer?.name}
        customerPhone={selectedCustomer?.phone}
        storeName={settings.storeName}
      />
    </div>
  );
};

export default Sale;
