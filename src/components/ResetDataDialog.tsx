import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResetDataDialogProps {
  open: boolean;
  onClose: () => void;
  onResetProducts: () => void;
  onClearProducts: () => void;
  onClearSales: () => void;
}

export const ResetDataDialog = ({
  open,
  onClose,
  onResetProducts,
  onClearProducts,
  onClearSales,
}: ResetDataDialogProps) => {
  const { toast } = useToast();
  const [resetProducts, setResetProducts] = useState(false);
  const [clearProducts, setClearProducts] = useState(false);
  const [clearSales, setClearSales] = useState(false);

  const handleReset = () => {
    if (resetProducts) {
      onResetProducts();
    }
    if (clearProducts) {
      onClearProducts();
    }
    if (clearSales) {
      onClearSales();
    }

    const actions: string[] = [];
    if (resetProducts) actions.push('Products reset to defaults');
    if (clearProducts) actions.push('All products cleared');
    if (clearSales) actions.push('Sales history cleared');

    if (actions.length > 0) {
      toast({
        title: 'Data Reset Complete',
        description: actions.join('. '),
      });
    }

    // Reset checkboxes and close
    setResetProducts(false);
    setClearProducts(false);
    setClearSales(false);
    onClose();
  };

  const handleClearAll = () => {
    onClearProducts();
    onClearSales();
    toast({
      title: 'All Data Cleared',
      description: 'Products and sales history have been cleared.',
      variant: 'destructive',
    });
    setResetProducts(false);
    setClearProducts(false);
    setClearSales(false);
    onClose();
  };

  const isAnySelected = resetProducts || clearProducts || clearSales;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Reset Data
          </DialogTitle>
          <DialogDescription>
            Choose what data to reset or clear. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reset Products to Defaults */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
            <Checkbox
              id="reset-products"
              checked={resetProducts}
              onCheckedChange={(checked) => {
                setResetProducts(checked as boolean);
                if (checked) setClearProducts(false);
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="reset-products" className="font-medium cursor-pointer">
                Reset Products to Defaults
              </Label>
              <p className="text-xs text-muted-foreground">
                Replace current products with sample data
              </p>
            </div>
          </div>

          {/* Clear All Products */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
            <Checkbox
              id="clear-products"
              checked={clearProducts}
              onCheckedChange={(checked) => {
                setClearProducts(checked as boolean);
                if (checked) setResetProducts(false);
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="clear-products" className="font-medium cursor-pointer">
                Clear All Products
              </Label>
              <p className="text-xs text-muted-foreground">
                Remove all products from inventory
              </p>
            </div>
          </div>

          {/* Clear Sales History */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
            <Checkbox
              id="clear-sales"
              checked={clearSales}
              onCheckedChange={(checked) => setClearSales(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="clear-sales" className="font-medium cursor-pointer">
                Clear Sales History
              </Label>
              <p className="text-xs text-muted-foreground">
                Remove all sales records and reports data
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-muted-foreground">
              Data stored in browser's localStorage will be permanently deleted.
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleClearAll}
            className="sm:mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Everything
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            disabled={!isAnySelected}
            className="gradient-primary"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Apply Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
