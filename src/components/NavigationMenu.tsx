import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Home, Package, Receipt, BarChart3, Settings, Moon, Sun, BookOpen } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import logo from '@/assets/logo.png';

interface NavigationMenuProps {
  onSettingsClick?: () => void;
}

const NavigationMenu = ({ onSettingsClick }: NavigationMenuProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { title: 'Dashboard', href: '/', icon: Home },
    { title: 'Products', href: '/products', icon: Package },
    { title: 'Sale', href: '/billing', icon: Receipt },
    { title: 'Ledger', href: '/ledger', icon: BookOpen },
    { title: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Saheli by Emaan logo" className="h-10 w-auto" />
            <SheetTitle className="text-lg font-display">Saheli by Emaan</SheetTitle>
          </div>
        </SheetHeader>
        <nav className="mt-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
          {onSettingsClick && (
            <button
              onClick={() => {
                setOpen(false);
                onSettingsClick();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted w-full text-left"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          )}
        </nav>
        
        {/* Dark Mode Toggle */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-warning" />
              )}
              <Label htmlFor="dark-mode" className="font-medium cursor-pointer">
                Dark Mode
              </Label>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationMenu;
