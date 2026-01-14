import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export const BarcodeDisplay = ({ 
  value, 
  width = 2, 
  height = 50, 
  displayValue = true,
  className = ''
}: BarcodeDisplayProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize: 12,
          margin: 5,
          background: 'transparent',
        });
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [value, width, height, displayValue]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg ref={svgRef} />
    </div>
  );
};
