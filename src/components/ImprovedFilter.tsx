import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Loader2 } from 'lucide-react';
import WarehouseMultiSelect from './WarehouseMultiSelect';
import ProductNameMultiSelect from './ProductNameMultiSelect';
import QuantityRangeSelector from './QuantityRangeSelector';

interface ImprovedFilterProps {
  warehouses: any[];
  selectedProductNames: string[];
  selectedWarehouseIds: number[];
  minQuantity: number | undefined;
  maxQuantity: number | undefined;
  onProductNamesChange: (names: string[]) => void;
  onWarehouseIdsChange: (ids: number[]) => void;
  onMinQuantityChange: (min: number | undefined) => void;
  onMaxQuantityChange: (max: number | undefined) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
  onClearFilters?: () => void;
}

const ImprovedFilter: React.FC<ImprovedFilterProps> = ({
  warehouses,
  selectedProductNames,
  selectedWarehouseIds,
  minQuantity,
  maxQuantity,
  onProductNamesChange,
  onWarehouseIdsChange,
  onMinQuantityChange,
  onMaxQuantityChange,
  onApplyFilters,
  isLoading = false,
  onClearFilters
}) => {
  // Check if there is any validation error
  const hasError = minQuantity !== undefined && maxQuantity !== undefined && minQuantity > maxQuantity;
  
  // Check if button should be disabled (no filters or validation error)
  const isButtonDisabled = 
    (selectedProductNames.length === 0 && 
     selectedWarehouseIds.length === 0 && 
     minQuantity === undefined && 
     maxQuantity === undefined) ||
    hasError ||
    isLoading;
  
  return (
    <div className="w-full">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Warehouse Multi-Select */}
          <div className="mb-4">
            <WarehouseMultiSelect 
              warehouses={warehouses || []}
              selectedWarehouseIds={selectedWarehouseIds}
              onChange={onWarehouseIdsChange}
            />
          </div>
          
          {/* Product Names Multi-Select */}
          <div className="mb-4">
            <ProductNameMultiSelect
              selectedProductNames={selectedProductNames}
              onChange={onProductNamesChange}
            />
          </div>
          
          {/* Quantity Range Selector */}
          <div className="mb-4">
            <QuantityRangeSelector
              minQuantity={minQuantity}
              maxQuantity={maxQuantity}
              onMinChange={onMinQuantityChange}
              onMaxChange={onMaxQuantityChange}
            />
          </div>
          
          {/* Apply Filters Button */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={onApplyFilters}
              disabled={isButtonDisabled}
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
            {onClearFilters && (
              <Button 
                variant="outline" 
                onClick={onClearFilters}
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* Filter Summary */}
          {(selectedProductNames.length > 0 || selectedWarehouseIds.length > 0 || 
            minQuantity !== undefined || maxQuantity !== undefined) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProductNames.length > 0 && (
                  <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs">
                    {selectedProductNames.length} product{selectedProductNames.length !== 1 ? 's' : ''}
                  </div>
                )}
                {selectedWarehouseIds.length > 0 && (
                  <div className="bg-green-50 text-green-800 px-2 py-1 rounded-md text-xs">
                    {selectedWarehouseIds.length} warehouse{selectedWarehouseIds.length !== 1 ? 's' : ''}
                  </div>
                )}
                {minQuantity !== undefined && (
                  <div className="bg-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs">
                    Min qty: {minQuantity}
                  </div>
                )}
                {maxQuantity !== undefined && (
                  <div className="bg-orange-50 text-orange-800 px-2 py-1 rounded-md text-xs">
                    Max qty: {maxQuantity}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedFilter;
