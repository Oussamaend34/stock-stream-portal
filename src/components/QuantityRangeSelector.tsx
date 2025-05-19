import React from 'react';
import { Input } from '@/components/ui/input';

interface QuantityRangeSelectorProps {
  minQuantity: number | undefined;
  maxQuantity: number | undefined;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
}

const QuantityRangeSelector: React.FC<QuantityRangeSelectorProps> = ({
  minQuantity,
  maxQuantity,
  onMinChange,
  onMaxChange
}) => {
  // Check if there is a validation error
  const hasError = minQuantity !== undefined && maxQuantity !== undefined && minQuantity > maxQuantity;
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Quantity Range</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            placeholder="Min"
            min="0"
            value={minQuantity !== undefined ? minQuantity : ''}
            onChange={(e) => {
              const value = e.target.value !== '' ? parseInt(e.target.value, 10) : undefined;
              if (value === undefined || !isNaN(value)) {
                onMinChange(value);
                
                // If max is set and min is greater than max, update max
                if (maxQuantity !== undefined && value !== undefined && value > maxQuantity) {
                  onMaxChange(value);
                }
              }
            }}
            className={hasError ? 'border-red-500' : ''}
          />
          <div className="text-xs text-muted-foreground mt-1">Minimum</div>
        </div>
        
        <div>
          <Input
            type="number"
            placeholder="Max"
            min={minQuantity !== undefined ? minQuantity : 0}
            value={maxQuantity !== undefined ? maxQuantity : ''}
            onChange={(e) => {
              const value = e.target.value !== '' ? parseInt(e.target.value, 10) : undefined;
              if (value === undefined || !isNaN(value)) {
                onMaxChange(value);
              }
            }}
            className={hasError ? 'border-red-500' : ''}
          />
          <div className="text-xs text-muted-foreground mt-1">Maximum</div>
        </div>
      </div>
      
      {hasError && (
        <div className="text-xs text-red-500 mt-1">
          Minimum value cannot be greater than maximum
        </div>
      )}
    </div>
  );
};

export default QuantityRangeSelector;
