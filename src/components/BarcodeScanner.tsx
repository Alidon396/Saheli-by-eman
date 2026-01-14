import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { Input } from '@/components/ui/input';
import { Scan, Check, X, Keyboard } from 'lucide-react';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  products: Product[];
  onProductScanned: (product: Product) => void;
  className?: string;
  inputRef?: RefObject<HTMLInputElement>;
}

const BarcodeScanner = ({ products, onProductScanned, className, inputRef: externalRef }: BarcodeScannerProps) => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout>();

  // Scanner inputs chars very fast (<50ms), manual typing is slower
  const SCANNER_SPEED_THRESHOLD = 80;
  // Auto-submit after this delay of no input (for scanners that don't send Enter)
  const AUTO_SUBMIT_DELAY = 150;

  const findProductByBarcode = useCallback((barcode: string): Product | undefined => {
    const normalizedBarcode = barcode.trim().toUpperCase();
    return products.find(
      p => p.barcode?.toUpperCase() === normalizedBarcode || 
           p.productCode?.toUpperCase() === normalizedBarcode
    );
  }, [products]);

  const handleScan = useCallback((barcode: string) => {
    if (!barcode || barcode.length < 2) return;
    
    const product = findProductByBarcode(barcode);
    
    if (product) {
      if (product.stockQty <= 0) {
        setScanStatus('error');
        setStatusMessage(`${product.productName} is out of stock`);
      } else {
        onProductScanned(product);
        setScanStatus('success');
        setStatusMessage(`Added: ${product.productName}`);
      }
    } else {
      setScanStatus('error');
      setStatusMessage(`Product not found: ${barcode}`);
    }

    // Clear input immediately
    setScanBuffer('');

    // Reset status after 2 seconds
    setTimeout(() => {
      setScanStatus('idle');
      setStatusMessage('');
    }, 2000);
  }, [findProductByBarcode, onProductScanned]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    const currentTime = Date.now();
    const timeSinceLastKey = currentTime - lastKeyTime;
    
    setScanBuffer(value);
    setLastKeyTime(currentTime);

    // Clear any existing auto-submit timeout
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }

    // If input is coming in fast (barcode scanner), set auto-submit
    if (value.length >= 3 && timeSinceLastKey < SCANNER_SPEED_THRESHOLD) {
      autoSubmitTimeoutRef.current = setTimeout(() => {
        if (value.length >= 3) {
          handleScan(value);
        }
      }, AUTO_SUBMIT_DELAY);
    }
  }, [lastKeyTime, handleScan]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
      if (scanBuffer.length > 0) {
        handleScan(scanBuffer);
      }
    }
  }, [scanBuffer, handleScan]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (scanBuffer.length > 0) {
      handleScan(scanBuffer);
    }
  }, [scanBuffer, handleScan]);

  // Focus input on mount and refocus after status change
  useEffect(() => {
    inputRef.current?.focus();
  }, [scanStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <div className="relative">
        <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input
          ref={inputRef}
          type="text"
          value={scanBuffer}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or enter SKU..."
          className={cn(
            "pl-12 pr-12 h-14 text-lg font-mono bg-muted/50 border-2 transition-all duration-200",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            scanStatus === 'success' && "border-green-500 bg-green-500/10",
            scanStatus === 'error' && "border-destructive bg-destructive/10"
          )}
          autoComplete="off"
          autoFocus
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {scanStatus === 'success' && (
            <Check className="h-5 w-5 text-green-500 animate-in zoom-in duration-200" />
          )}
          {scanStatus === 'error' && (
            <X className="h-5 w-5 text-destructive animate-in zoom-in duration-200" />
          )}
          {scanStatus === 'idle' && (
            <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded border bg-muted text-[10px] font-medium text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              Enter
            </kbd>
          )}
        </div>
      </div>
      
      {statusMessage && (
        <p className={cn(
          "text-sm font-medium animate-in slide-in-from-top-2 duration-200",
          scanStatus === 'success' && "text-green-600",
          scanStatus === 'error' && "text-destructive"
        )}>
          {statusMessage}
        </p>
      )}
    </form>
  );
};

export default BarcodeScanner;
