import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { StatsCard } from '@/components/StatsCard';
import { LowStockAlert } from '@/components/LowStockAlert';
import { ResetDataDialog } from '@/components/ResetDataDialog';
import SettingsDialog from '@/components/SettingsDialog';
import NavigationMenu from '@/components/NavigationMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Banknote,
  AlertTriangle,
  Tags,
  Receipt,
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import logo from '@/assets/logo.png';

const Dashboard = () => {
  const { products, getStats: getProductStats, resetToDefaults, clearAllProducts } = useProducts();
  const { getStats: getSalesStats, getDailyData, getCategoryData, getTopProducts, clearAllSales } = useSales();
  const { settings } = useSettings();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const productStats = getProductStats();
  const salesStats = getSalesStats();
  const dailyData = getDailyData(7);
  const categoryData = getCategoryData();
  const topProducts = getTopProducts(5);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--accent))'];

  const salesTrend = dailyData.length >= 2 
    ? ((dailyData[dailyData.length - 1]?.sales || 0) - (dailyData[0]?.sales || 0))
    : 0;

  const navigationCards = [
    {
      title: 'Products',
      description: 'Manage inventory, add products, generate barcodes',
      icon: Package,
      href: '/products',
      color: 'primary',
      stats: `${productStats.totalProducts} items`,
    },
    {
      title: 'Sale',
      description: 'Create invoices, process sales, print receipts',
      icon: Receipt,
      href: '/billing',
      color: 'success',
      stats: `${salesStats.today.count} sales today`,
    },
    {
      title: 'Reports',
      description: 'View analytics, sales history, export data',
      icon: BarChart3,
      href: '/reports',
      color: 'info',
      stats: `Rs.${salesStats.month.total.toLocaleString()} this month`,
    },
  ];

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
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Sales"
            value={`Rs.${salesStats.today.total.toLocaleString()}`}
            icon={Banknote}
            variant="success"
            trend={`${salesStats.today.count} orders`}
          />
          <StatsCard
            title="Total Products"
            value={productStats.totalProducts}
            icon={Package}
            variant="primary"
            trend={`Rs.${productStats.totalValue.toLocaleString()} value`}
          />
          <StatsCard
            title="Low Stock Items"
            value={productStats.lowStock}
            icon={AlertTriangle}
            variant="warning"
            trend="Less than 10 units"
          />
          <StatsCard
            title="This Month"
            value={`Rs.${salesStats.month.total.toLocaleString()}`}
            icon={salesTrend >= 0 ? TrendingUp : TrendingDown}
            variant={salesTrend >= 0 ? 'success' : 'warning'}
            trend={`${salesStats.month.count} orders`}
          />
        </section>

        {/* Quick Actions & Navigation */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link key={card.title} to={card.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-${card.color}/10`}>
                      <card.icon className={`h-6 w-6 text-${card.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">{card.description}</p>
                  <span className="text-xs font-medium text-primary">{card.stats}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                7-Day Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`Rs.${value.toLocaleString()}`, 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                Sales by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`Rs.${value.toLocaleString()}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sales data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Top Products & Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.code} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                        </div>
                      </div>
                      <span className="font-semibold text-success">Rs.{product.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/billing" className="block">
                <Button className="w-full justify-start gap-3 h-12" variant="outline">
                  <Receipt className="h-5 w-5 text-success" />
                  <div className="text-left">
                    <p className="font-medium">New Sale</p>
                    <p className="text-xs text-muted-foreground">Create a new invoice</p>
                  </div>
                </Button>
              </Link>
              <Link to="/products" className="block">
                <Button className="w-full justify-start gap-3 h-12" variant="outline">
                  <Plus className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Add Product</p>
                    <p className="text-xs text-muted-foreground">Add new inventory item</p>
                  </div>
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button className="w-full justify-start gap-3 h-12" variant="outline">
                  <BarChart3 className="h-5 w-5 text-info" />
                  <div className="text-left">
                    <p className="font-medium">View Reports</p>
                    <p className="text-xs text-muted-foreground">Check sales analytics</p>
                  </div>
                </Button>
              </Link>
              {productStats.lowStock > 0 && (
                <Link to="/products" className="block">
                  <Button className="w-full justify-start gap-3 h-12 border-warning/50" variant="outline">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div className="text-left">
                      <p className="font-medium">Low Stock Alert</p>
                      <p className="text-xs text-muted-foreground">{productStats.lowStock} items need restocking</p>
                    </div>
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Low Stock Alert System */}
      <LowStockAlert products={products} threshold={settings.lowStockThreshold} />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onResetData={() => {
          setShowSettings(false);
          setShowResetDialog(true);
        }}
      />

      {/* Reset Data Dialog */}
      <ResetDataDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onResetProducts={resetToDefaults}
        onClearProducts={clearAllProducts}
        onClearSales={clearAllSales}
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

export default Dashboard;
