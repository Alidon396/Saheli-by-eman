import { useMemo, useState } from 'react';
import { useSales } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, Calendar, ShoppingBag, DollarSign, Package, Trash2, TrendingDown, Percent, CalendarIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfDay, endOfDay, isWithinInterval, subDays, differenceInDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import logo from '@/assets/logo.png';
import NavigationMenu from '@/components/NavigationMenu';
import SettingsDialog from '@/components/SettingsDialog';
import { cn } from '@/lib/utils';
import { Bill } from '@/types/billing';

const COLORS = ['hsl(168, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(0, 72%, 51%)', 'hsl(280, 65%, 60%)'];

const Reports = () => {
  const { sales, getStats, deleteSale } = useSales();
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    if (!startDate && !endDate) return sales;
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const start = startDate ? startOfDay(startDate) : new Date(0);
      const end = endDate ? endOfDay(endDate) : new Date();
      return isWithinInterval(saleDate, { start, end });
    });
  }, [sales, startDate, endDate]);

  // Calculate stats from filtered sales
  const filteredStats = useMemo(() => {
    const count = filteredSales.length;
    const total = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
    return { count, total };
  }, [filteredSales]);

  // Calculate profit stats from filtered sales
  const filteredProfitStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        totalRevenue += item.total;
        totalCost += (item.costPrice || 0) * item.quantity;
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalProfit, profitMargin };
  }, [filteredSales]);

  // Get daily data from filtered sales
  const filteredDailyData = useMemo(() => {
    const days = startDate && endDate ? Math.min(differenceInDays(endDate, startDate) + 1, 30) : 7;
    const baseDate = endDate || new Date();
    const data: { date: string; sales: number; orders: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(baseDate, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const daySales = filteredSales.filter(s => 
        isWithinInterval(new Date(s.createdAt), { start: dayStart, end: dayEnd })
      );

      data.push({
        date: format(date, 'MMM dd'),
        sales: daySales.reduce((sum, s) => sum + s.grandTotal, 0),
        orders: daySales.length,
      });
    }

    return data;
  }, [filteredSales, startDate, endDate]);

  // Get category data from filtered sales
  const filteredCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.category;
        categoryMap[category] = (categoryMap[category] || 0) + item.total;
      });
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Get top products from filtered sales
  const filteredTopProducts = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productMap[item.productCode]) {
          productMap[item.productCode] = { name: item.productName, quantity: 0, revenue: 0, cost: 0 };
        }
        productMap[item.productCode].quantity += item.quantity;
        productMap[item.productCode].revenue += item.total;
        productMap[item.productCode].cost += (item.costPrice || 0) * item.quantity;
      });
    });

    return Object.entries(productMap)
      .map(([code, data]) => ({ code, ...data, profit: data.revenue - data.cost }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  const stats = useMemo(() => getStats(), [getStats]);
  const formatCurrency = (value: number) => `${settings.currencySymbol}${value.toLocaleString()}`;

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const isFiltered = startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NavigationMenu onSettingsClick={() => setShowSettings(true)} />
              <img src={logo} alt="Saheli by Emaan logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold font-display text-foreground">Sales Reports</h1>
                <p className="text-xs text-muted-foreground">Analytics & insights</p>
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {isFiltered && (
                <Button variant="ghost" size="icon" onClick={clearDateFilter} className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(stats.today.total)}</p>
                  <p className="text-xs text-muted-foreground">{stats.today.count} orders</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold text-accent">{formatCurrency(stats.week.total)}</p>
                  <p className="text-xs text-muted-foreground">{stats.week.count} orders</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-info">{formatCurrency(stats.month.total)}</p>
                  <p className="text-xs text-muted-foreground">{stats.month.count} orders</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-info opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Time</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(stats.allTime.total)}</p>
                  <p className="text-xs text-muted-foreground">{stats.allTime.count} orders</p>
                </div>
                <DollarSign className="h-8 w-8 text-success opacity-60" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Profit Analysis Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isFiltered ? 'Filtered Revenue' : 'Total Revenue'}</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(filteredProfitStats.totalRevenue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isFiltered ? 'Filtered Cost' : 'Total Cost'}</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(filteredProfitStats.totalCost)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isFiltered ? 'Filtered Profit' : 'Total Profit'}</p>
                  <p className={`text-2xl font-bold ${filteredProfitStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(filteredProfitStats.totalProfit)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className={`text-2xl font-bold ${filteredProfitStats.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {filteredProfitStats.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <Percent className="h-8 w-8 text-blue-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {isFiltered ? 'Filtered Period Sales' : 'Last 7 Days Sales'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDailyData.some(d => d.sales > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={filteredDailyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(168, 76%, 36%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(168, 76%, 36%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(160, 10%, 45%)' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(160, 10%, 45%)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                      contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(160, 15%, 88%)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(168, 76%, 36%)" fill="url(#salesGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sales data {isFiltered ? 'in selected period' : 'yet'}</p>
                    <p className="text-sm">{isFiltered ? 'Try selecting a different date range' : 'Create some invoices to see trends'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Sales by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={filteredCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {filteredCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No category data {isFiltered ? 'in selected period' : 'yet'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTopProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredTopProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(160, 10%, 45%)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'hsl(160, 10%, 45%)', fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="hsl(168, 76%, 36%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No product data {isFiltered ? 'in selected period' : 'yet'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isFiltered ? 'Filtered Sales' : 'Recent Sales'}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <div className="max-h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.slice(0, 10).map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-xs">{sale.id.slice(-8)}</TableCell>
                          <TableCell className="text-sm">{format(new Date(sale.createdAt), 'MMM dd, HH:mm')}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(sale.grandTotal)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteSale(sale.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sales {isFiltered ? 'in selected period' : 'history yet'}</p>
                    {!isFiltered && (
                      <Link to="/billing">
                        <Button variant="outline" size="sm" className="mt-2">
                          Create First Invoice
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
