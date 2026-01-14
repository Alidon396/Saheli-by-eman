import { CATEGORIES } from '@/types/product';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const categoryLabels: Record<string, { icon: string; label: string }> = {
  '1PC': { icon: '👗', label: '1 Piece' },
  '2PC': { icon: '👚', label: '2 Piece' },
  '3PC': { icon: '🎀', label: '3 Piece' },
  'SUMMER': { icon: '☀️', label: 'Summer' },
  'WINTER': { icon: '❄️', label: 'Winter' },
  'NEW': { icon: '✨', label: 'New In' },
};

export const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
        className={selected === null ? 'gradient-primary' : ''}
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        All
      </Button>
      {CATEGORIES.map(category => (
        <Button
          key={category}
          variant={selected === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(category)}
          className={selected === category ? 'gradient-primary' : ''}
        >
          <span className="mr-1">{categoryLabels[category]?.icon || '📦'}</span>
          {categoryLabels[category]?.label || category}
        </Button>
      ))}
    </div>
  );
};
