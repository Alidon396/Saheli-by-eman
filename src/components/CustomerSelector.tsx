import { useState, useMemo } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerWithBalance } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, X } from 'lucide-react';

interface CustomerSelectorProps {
  selectedCustomer: CustomerWithBalance | null;
  onSelect: (customer: CustomerWithBalance | null) => void;
  onAddToCredit?: boolean;
  onCreditChange?: (addToCredit: boolean) => void;
}

const CustomerSelector = ({
  selectedCustomer,
  onSelect,
  onAddToCredit,
  onCreditChange,
}: CustomerSelectorProps) => {
  const { addCustomer, getCustomersWithBalance } = useCustomers();
  const [showSearch, setShowSearch] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const customers = useMemo(() => getCustomersWithBalance(), [getCustomersWithBalance]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return;
    const created = addCustomer(newCustomer);
    const customerWithBalance: CustomerWithBalance = {
      ...created,
      balance: 0,
      totalPurchases: 0,
      totalPayments: 0,
    };
    onSelect(customerWithBalance);
    setNewCustomer({ name: '', phone: '', address: '' });
    setShowAddNew(false);
    setShowSearch(false);
  };

  const handleSelectCustomer = (customer: CustomerWithBalance) => {
    onSelect(customer);
    setShowSearch(false);
    setSearchQuery('');
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <User className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">{selectedCustomer.name}</p>
            <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
          </div>
          {selectedCustomer.balance > 0 && (
            <Badge variant="destructive" className="text-xs">
              Rs.{selectedCustomer.balance.toLocaleString()} due
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {onCreditChange && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onAddToCredit}
              onChange={(e) => onCreditChange(e.target.checked)}
              className="rounded border-primary text-primary focus:ring-primary"
            />
            <span className="text-sm">Add to customer credit (Udhaar)</span>
          </label>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          onClick={() => setShowSearch(true)}
          placeholder="Search customer (Name/Phone)..."
          className="pl-9 bg-muted/50 cursor-pointer"
          readOnly
        />
      </div>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-[250px] overflow-auto space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No customers found</p>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    </div>
                    {customer.balance > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Rs.{customer.balance.toLocaleString()}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddNew} onOpenChange={setShowAddNew}>
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
            <Button onClick={handleAddCustomer} className="w-full">
              Add & Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerSelector;
