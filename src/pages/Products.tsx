import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { Product, Category } from '@/types/product';
import { StatsCard } from '@/components/StatsCard';
import { ProductTable } from '@/components/ProductTable';
import { ProductForm } from '@/components/ProductForm';
import { CategoryFilter } from '@/components/CategoryFilter';
import { CSVImport } from '@/components/CSVImport';
import { DataExport } from '@/components/DataExport';
import { BulkBarcodeGenerator } from '@/components/BulkBarcodeGenerator';
import { LowStockAlert } from '@/components/LowStockAlert';
import SettingsDialog from '@/components/SettingsDialog';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Banknote, AlertTriangle, Tags, Plus, RotateCcw, Upload, Printer } from 'lucide-react';
import logo from '@/assets/logo.png';

const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct, getStats, generateProductCode, resetToDefaults, importProducts } = useProducts();
  const { settings } = useSettings();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const stats = getStats();

  const handleAddProduct = (productData: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>) => {
    const newProduct = addProduct(productData);
    toast({
      title: 'Product Added',
      description: `${newProduct.productName} (${newProduct.productCode}) has been added.`,
    });
  };

  const handleEditProduct = (productData: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>) => {
    if (editProduct) {
      updateProduct(editProduct.productCode, productData);
      toast({
        title: 'Product Updated',
        description: `${productData.productName} has been updated.`,
      });
      setEditProduct(null);
    }
  };

  const handleDeleteProduct = (productCode: string) => {
    const product = products.find(p => p.productCode === productCode);
    deleteProduct(productCode);
    toast({
      title: 'Product Deleted',
      description: `${product?.productName} has been removed.`,
      variant: 'destructive',
    });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: 'Products Reset',
      description: 'All products have been reset to defaults.',
    });
  };

  const handleImport = (newProducts: Omit<Product, 'productCode' | 'barcode' | 'createdAt'>[]) => {
    importProducts(newProducts);
    toast({
      title: 'Products Imported',
      description: `${newProducts.length} products have been imported.`,
    });
  };

  const openEditForm = (product: Product) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NavigationMenu onSettingsClick={() => setShowSettings(true)} />
              <img src={logo} alt="Saheli by Emaan logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold font-display text-foreground">{settings.storeName}</h1>
                <p className="text-xs text-muted-foreground">Product Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsBarcodeOpen(true)}>
                <Printer className="h-4 w-4 mr-1" />
                Barcodes
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <DataExport products={products} />
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button onClick={() => setIsFormOpen(true)} className="gradient-primary shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            variant="primary"
            trend="Product inventory"
          />
          <StatsCard
            title="Inventory Value"
            value={`Rs.${stats.totalValue.toLocaleString()}`}
            icon={Banknote}
            variant="success"
            trend="Based on sale prices"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStock}
            icon={AlertTriangle}
            variant="warning"
            trend={`Less than ${settings.lowStockThreshold} units`}
          />
          <StatsCard
            title="Collections"
            value={stats.categories}
            icon={Tags}
            variant="default"
            trend="Active collections"
          />
        </section>

        {/* Category Filter */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Products</h2>
          </div>
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </section>

        {/* Product Table */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ProductTable
            products={products}
            onEdit={openEditForm}
            onDelete={handleDeleteProduct}
            selectedCategory={selectedCategory}
          />
        </section>
      </main>

      {/* Product Form Modal */}
      <ProductForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        editProduct={editProduct}
        generateCode={generateProductCode}
      />

      {/* CSV Import Modal */}
      <CSVImport
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      {/* Bulk Barcode Generator Modal */}
      <BulkBarcodeGenerator
        products={products}
        open={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      {/* Low Stock Alert System */}
      <LowStockAlert products={products} threshold={settings.lowStockThreshold} />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Saheli by Emaan • AI-Ready Product Management • Offline-First Design</p>
        </div>
      </footer>
    </div>
  );
};

export default Products;
