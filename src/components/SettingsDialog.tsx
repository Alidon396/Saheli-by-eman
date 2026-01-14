import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings, StoreSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { Store, Settings, DollarSign, AlertTriangle, RotateCcw } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onResetData?: () => void;
}

const SettingsDialog = ({ open, onClose, onResetData }: SettingsDialogProps) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [formData, setFormData] = useState<StoreSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings, open]);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleResetSettings = () => {
    resetSettings();
    setFormData({
      storeName: 'Saheli by Emaan',
      storeAddress: '',
      storePhone: '',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      lowStockThreshold: 10,
      taxRate: 0,
      receiptFooter: 'Thank you for shopping with us!',
    });
    toast.success('Settings reset to defaults');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your store settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="store" className="flex items-center gap-1">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={formData.storeName}
                onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="Enter store name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Textarea
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, storeAddress: e.target.value }))}
                placeholder="Enter store address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone">Phone Number</Label>
              <Input
                id="storePhone"
                value={formData.storePhone}
                onChange={(e) => setFormData(prev => ({ ...prev, storePhone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
              <Textarea
                id="receiptFooter"
                value={formData.receiptFooter}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptFooter: e.target.value }))}
                placeholder="Thank you message for receipts"
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  placeholder="PKR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                  placeholder="Rs."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Set to 0 for no tax</p>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 10 }))}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Products with stock below this number will trigger alerts
              </p>
            </div>

            {onResetData && (
              <div className="pt-4 border-t space-y-3">
                <Label className="text-destructive">Danger Zone</Label>
                <Button
                  variant="destructive"
                  onClick={onResetData}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Data
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will clear all products and sales data. This action cannot be undone.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleResetSettings}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
