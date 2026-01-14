import { useState, useMemo } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Search, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2, Eye, Download } from 'lucide-react';
import logo from '@/assets/logo.png';
import NavigationMenu from '@/components/NavigationMenu';
import SettingsDialog from '@/components/SettingsDialog';
import { CustomerWithBalance, LedgerEntry } from '@/types/customer';
import { DetailedLedgerEntry } from '@/types/ledger';
import { exportLedgerToCSV } from '@/utils/ledgerExport';
import { format } from 'date-fns';

const Ledger = () => {
  const { settings } = useSettings();
  const { toast } = useToast();
  const {
    addCustomer,
    deleteCustomer,
    addLedgerEntry,
    getCustomerLedger,
    getCustomersWithBalance,
    searchCustomers,
    getTotalReceivables,
  } = useCustomers();

  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBalance | null>(null);
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const customersWithBalance = useMemo(() => getCustomersWithBalance(), [getCustomersWithBalance]);
  
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customersWithBalance;
    const q = searchQuery.toLowerCase();
    return customersWithBalance.filter(c => 
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customersWithBalance, searchQuery]);

  const totalReceivables = useMemo(() => getTotalReceivables(), [getTotalReceivables]);

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast({ title: 'Error', description: 'Name and phone are required', variant: 'destructive' });
      return;
    }
    addCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '', address: '' });
    setShowAddCustomer(false);
    toast({ title: 'Customer Added', description: `${newCustomer.name} has been added` });
  };

  const handleAddPayment = () => {
    if (!selectedCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    addLedgerEntry({
      customerId: selectedCustomer.id,
      type: 'payment',
      amount,
      description: paymentNote || 'Payment received',
    });
    setPaymentAmount('');
    setPaymentNote('');
    setShowAddPayment(false);
    toast({ title: 'Payment Recorded', description: `Rs.${amount.toLocaleString()} payment added` });
  };

  const handleDeleteCustomer = (customer: CustomerWithBalance) => {
    if (customer.balance > 0) {
      toast({ title: 'Cannot Delete', description: 'Clear outstanding balance first', variant: 'destructive' });
      return;
    }
    deleteCustomer(customer.id);
    toast({ title: 'Customer Deleted', description: `${customer.name} has been removed` });
  };

  const customerLedger = useMemo(() => {
    if (!selectedCustomer) return [];
    const entries = getCustomerLedger(selectedCustomer.id);
    let runningBalance = 0;
    return entries.reverse().map(entry => {
      const debit = entry.type === 'sale' || entry.type === 'credit' ? entry.amount : 0;
      const credit = entry.type === 'payment' ? entry.amount : 0;
      runningBalance += debit - credit;
      return {
        ...entry,
        customerName: selectedCustomer.name,
        debit,
        credit,
        balance: runningBalance,
        products: entry.products,
      } as DetailedLedgerEntry;
    }).reverse();
  }, [selectedCustomer, getCustomerLedger]);

  const handleExportCSV = () => {
    if (!selectedCustomer || customerLedger.length === 0) return;
    exportLedgerToCSV(customerLedger, selectedCustomer.name);
    toast({ title: 'Exported', description: 'Ledger exported to CSV' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NavigationMenu onSettingsClick={() => setShowSettings(true)} />
              <img src={logo} alt="Logo" className="h-9 w-auto" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Customer Ledger</h1>
                <p className="text-xs text-muted-foreground">{settings.storeName} • Accounts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{customersWithBalance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Wallet className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Receivables</p>
                  <p className="text-2xl font-bold text-destructive">Rs.{totalReceivables.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ArrowDownCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Accounts</p>
                  <p className="text-2xl font-bold">{customersWithBalance.filter(c => c.balance > 0).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Address (optional)"
                  />
                </div>
                <Button onClick={handleAddCustomer} className="w-full">Add Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer Ledger Table - Combined View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No customers found. Add your first customer to start tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right text-destructive">Rs.{customer.totalPurchases.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs.{customer.totalPayments.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={customer.balance > 0 ? 'destructive' : 'secondary'}>
                          Rs.{customer.balance.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowLedger(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowAddPayment(true);
                            }}
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold text-destructive">Rs.{selectedCustomer?.balance.toLocaleString()}</p>
            </div>
            <div>
              <Label>Payment Amount *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment note (optional)"
              />
            </div>
            <Button onClick={handleAddPayment} className="w-full">Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Ledger Dialog */}
      <Dialog open={showLedger} onOpenChange={setShowLedger}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ledger - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted text-center">
                <p className="text-xs text-muted-foreground">Purchases</p>
                <p className="font-bold">Rs.{selectedCustomer?.totalPurchases.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="font-bold text-green-600">Rs.{selectedCustomer?.totalPayments.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-bold text-destructive">Rs.{selectedCustomer?.balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerLedger.map((entry) => (
                      entry.products && entry.products.length > 0 ? (
                        // Show each product as a separate row for sale entries
                        entry.products.map((product, idx) => (
                          <TableRow key={`${entry.id}-${idx}`}>
                            <TableCell className="text-sm">{idx === 0 ? format(new Date(entry.createdAt), 'MMM dd, yyyy') : ''}</TableCell>
                            <TableCell className="text-sm font-medium">{product.productName}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">Rs.{product.rate.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-destructive">
                              {idx === entry.products!.length - 1 ? `Rs.${entry.debit.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-right text-green-600">-</TableCell>
                            <TableCell className="text-right font-medium">
                              {idx === entry.products!.length - 1 ? `Rs.${entry.balance.toLocaleString()}` : ''}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        // Payment or entries without products
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground" colSpan={3}>{entry.description}</TableCell>
                          <TableCell className="text-right text-destructive">{entry.debit > 0 ? `Rs.${entry.debit.toLocaleString()}` : '-'}</TableCell>
                          <TableCell className="text-right text-green-600">{entry.credit > 0 ? `Rs.${entry.credit.toLocaleString()}` : '-'}</TableCell>
                          <TableCell className="text-right font-medium">Rs.{entry.balance.toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="w-full" disabled={customerLedger.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Ledger;
