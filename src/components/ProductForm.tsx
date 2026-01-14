import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/product';
import { useBrands } from '@/hooks/useBrands';
import { useCollections } from '@/hooks/useCollections';
import { useUnits } from '@/hooks/useUnits';
import { useFabrics } from '@/hooks/useFabrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BarcodeDisplay } from './BarcodeDisplay';
import { Package, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>) => void;
  editProduct?: Product | null;
  generateCode: (category: Category) => string;
}

export const ProductForm = ({ open, onClose, onSubmit, editProduct, generateCode }: ProductFormProps) => {
  const { brands, addBrand, removeBrand } = useBrands();
  const { collections, addCollection, removeCollection } = useCollections();
  const { units, addUnit, removeUnit } = useUnits();
  const { fabrics, addFabric, removeFabric } = useFabrics();
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '3PC' as Category,
    unit: 'set',
    purchasePrice: 0,
    retailPrice: 0,
    discountPercent: 0,
    salePrice: 0,
    stockQty: 0,
    brand: 'Sapphire',
    fabric: 'Khaddar',
  });

  const [previewCode, setPreviewCode] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCollection, setNewCollection] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newFabric, setNewFabric] = useState('');
  const [showBrandManager, setShowBrandManager] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [showUnitManager, setShowUnitManager] = useState(false);
  const [showFabricManager, setShowFabricManager] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setFormData({
        productName: editProduct.productName,
        category: editProduct.category as Category,
        unit: editProduct.unit,
        purchasePrice: editProduct.purchasePrice,
        retailPrice: editProduct.salePrice || 0,
        discountPercent: 0,
        salePrice: editProduct.salePrice,
        stockQty: editProduct.stockQty,
        brand: editProduct.brand || 'Sapphire',
        fabric: editProduct.fabric || 'Khaddar',
      });
      setPreviewCode(editProduct.productCode);
    } else {
      setFormData({
        productName: '',
        category: '3PC',
        unit: 'set',
        purchasePrice: 0,
        retailPrice: 0,
        discountPercent: 0,
        salePrice: 0,
        stockQty: 0,
        brand: brands[0] || 'Sapphire',
        fabric: 'Khaddar',
      });
      setPreviewCode(generateCode('3PC'));
    }
  }, [editProduct, open, generateCode, brands]);

  useEffect(() => {
    if (!editProduct && open) {
      setPreviewCode(generateCode(formData.category));
    }
  }, [formData.category, editProduct, open, generateCode]);

  // Calculate sale price from retail and discount
  useEffect(() => {
    const discountAmount = formData.retailPrice * (formData.discountPercent / 100);
    const calculatedSalePrice = Math.round(formData.retailPrice - discountAmount);
    setFormData(prev => ({ ...prev, salePrice: calculatedSalePrice }));
  }, [formData.retailPrice, formData.discountPercent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      productName: formData.productName,
      category: formData.category,
      unit: formData.unit,
      purchasePrice: formData.purchasePrice,
      salePrice: formData.salePrice,
      stockQty: formData.stockQty,
      brand: formData.brand,
      fabric: formData.fabric,
    });
    onClose();
  };

  const handleAddBrand = () => {
    if (addBrand(newBrand)) {
      setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
      setNewBrand('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Code & Barcode */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Product Code</p>
              <p className="text-lg font-mono font-bold text-primary">{previewCode}</p>
            </div>
            <BarcodeDisplay value={previewCode} height={40} width={1.5} displayValue={false} />
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="e.g., Embroidered Khaddar Suit"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Collection</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowCollectionManager(!showCollectionManager)}
                  >
                    {showCollectionManager ? 'Done' : 'Manage'}
                  </Button>
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(value: Category) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={!!editProduct}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unit">Unit</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowUnitManager(!showUnitManager)}
                  >
                    {showUnitManager ? 'Done' : 'Manage'}
                  </Button>
                </div>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Collection Manager */}
            {showCollectionManager && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCollection}
                    onChange={(e) => setNewCollection(e.target.value)}
                    placeholder="Add new collection..."
                    className="h-8"
                  />
                  <Button type="button" size="sm" onClick={() => { addCollection(newCollection); setNewCollection(''); }} disabled={!newCollection.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {collections.map(col => (
                    <Badge key={col} variant="secondary" className="gap-1">
                      {col}
                      <button
                        type="button"
                        onClick={() => removeCollection(col)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Unit Manager */}
            {showUnitManager && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Add new unit..."
                    className="h-8"
                  />
                  <Button type="button" size="sm" onClick={() => { addUnit(newUnit); setNewUnit(''); }} disabled={!newUnit.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {units.map(unit => (
                    <Badge key={unit} variant="secondary" className="gap-1">
                      {unit}
                      <button
                        type="button"
                        onClick={() => removeUnit(unit)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brand">Brand</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowBrandManager(!showBrandManager)}
                  >
                    {showBrandManager ? 'Done' : 'Manage'}
                  </Button>
                </div>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fabric">Fabric</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowFabricManager(!showFabricManager)}
                  >
                    {showFabricManager ? 'Done' : 'Manage'}
                  </Button>
                </div>
                <Select
                  value={formData.fabric}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fabric: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fabrics.map(fabric => (
                      <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fabric Manager */}
            {showFabricManager && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newFabric}
                    onChange={(e) => setNewFabric(e.target.value)}
                    placeholder="Add new fabric..."
                    className="h-8"
                  />
                  <Button type="button" size="sm" onClick={() => { addFabric(newFabric); setNewFabric(''); }} disabled={!newFabric.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fabrics.map(fabric => (
                    <Badge key={fabric} variant="secondary" className="gap-1">
                      {fabric}
                      <button
                        type="button"
                        onClick={() => removeFabric(fabric)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Manager */}
            {showBrandManager && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Add new brand..."
                    className="h-8"
                  />
                  <Button type="button" size="sm" onClick={handleAddBrand} disabled={!newBrand.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <Badge key={brand} variant="secondary" className="gap-1">
                      {brand}
                      <button
                        type="button"
                        onClick={() => removeBrand(brand)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Section */}
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <p className="text-sm font-medium">Pricing</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Cost Price (PKR)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Retail Price (PKR)</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.retailPrice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, retailPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount %</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.discountPercent || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQty">Stock Qty</Label>
                  <Input
                    id="stockQty"
                    type="number"
                    min="0"
                    value={formData.stockQty || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQty: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              {formData.retailPrice > 0 && formData.purchasePrice > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit Margin:</span>
                  <span className={`font-medium ${formData.salePrice > formData.purchasePrice ? 'text-green-600' : 'text-destructive'}`}>
                    Rs. {(formData.salePrice - formData.purchasePrice).toLocaleString()} 
                    ({formData.salePrice > 0 ? Math.round(((formData.salePrice - formData.purchasePrice) / formData.salePrice) * 100) : 0}%)
                  </span>
                </div>
              )}
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              {editProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
