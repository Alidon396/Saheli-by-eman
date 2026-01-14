import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, X } from 'lucide-react';

interface LowStockAlertProps {
  products: Product[];
  threshold?: number;
}

export const LowStockAlert = ({ products, threshold = 10 }: LowStockAlertProps) => {
  const { toast } = useToast();
  const [showPanel, setShowPanel] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const lowStockProducts = products.filter(p => p.stockQty <= threshold && p.stockQty > 0);
  const outOfStockProducts = products.filter(p => p.stockQty === 0);
  const allAlertProducts = [...outOfStockProducts, ...lowStockProducts];
  const activeAlerts = allAlertProducts.filter(p => !dismissedAlerts.has(p.productCode));

  // Show toast for new low stock items
  useEffect(() => {
    const shownAlertsKey = 'saheli_shown_alerts';
    const shownAlerts = new Set(JSON.parse(localStorage.getItem(shownAlertsKey) || '[]'));
    
    const newLowStock = lowStockProducts.filter(p => !shownAlerts.has(p.productCode));
    const newOutOfStock = outOfStockProducts.filter(p => !shownAlerts.has(`oos_${p.productCode}`));

    if (newOutOfStock.length > 0) {
      toast({
        title: '⚠️ Out of Stock Alert',
        description: `${newOutOfStock.length} product${newOutOfStock.length > 1 ? 's are' : ' is'} out of stock!`,
        variant: 'destructive',
      });
      newOutOfStock.forEach(p => shownAlerts.add(`oos_${p.productCode}`));
    }

    if (newLowStock.length > 0) {
      toast({
        title: '📦 Low Stock Warning',
        description: `${newLowStock.length} product${newLowStock.length > 1 ? 's have' : ' has'} low stock (≤${threshold} units)`,
      });
      newLowStock.forEach(p => shownAlerts.add(p.productCode));
    }

    localStorage.setItem(shownAlertsKey, JSON.stringify([...shownAlerts]));
  }, [products.map(p => `${p.productCode}:${p.stockQty}`).join(',')]);

  const dismissAlert = (productCode: string) => {
    setDismissedAlerts(prev => new Set([...prev, productCode]));
  };

  const dismissAll = () => {
    setDismissedAlerts(new Set(allAlertProducts.map(p => p.productCode)));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <>
      {/* Floating Alert Button */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-105 transition-transform animate-pulse"
      >
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{activeAlerts.length} Stock Alert{activeAlerts.length > 1 ? 's' : ''}</span>
      </button>

      {/* Alert Panel */}
      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts ({activeAlerts.length})
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center pb-2 border-b">
            <div className="text-sm text-muted-foreground">
              {outOfStockProducts.length} out of stock • {lowStockProducts.length} low stock
            </div>
            <Button variant="ghost" size="sm" onClick={dismissAll} className="text-xs">
              Dismiss All
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {outOfStockProducts.filter(p => !dismissedAlerts.has(p.productCode)).map(product => (
                <div 
                  key={product.productCode}
                  className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <div className="p-2 rounded-full bg-destructive/20">
                    <Package className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.productName}</p>
                    <p className="text-xs text-muted-foreground">{product.productCode}</p>
                  </div>
                  <Badge variant="destructive">OUT OF STOCK</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => dismissAlert(product.productCode)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {lowStockProducts.filter(p => !dismissedAlerts.has(p.productCode)).map(product => (
                <div 
                  key={product.productCode}
                  className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30"
                >
                  <div className="p-2 rounded-full bg-warning/20">
                    <Package className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.productName}</p>
                    <p className="text-xs text-muted-foreground">{product.productCode}</p>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning bg-warning/10">
                    {product.stockQty} left
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => dismissAlert(product.productCode)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-3 border-t">
            <Button variant="outline" className="w-full" onClick={() => setShowPanel(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
