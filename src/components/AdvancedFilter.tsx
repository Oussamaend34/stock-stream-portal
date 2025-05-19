import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, SlidersHorizontal, BarChart3 } from 'lucide-react';
import WarehouseMultiSelect from './WarehouseMultiSelect';
import ProductNameMultiSelect from './ProductNameMultiSelect';
import QuantityRangeSelector from './QuantityRangeSelector';

interface AdvancedFilterProps {
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
  lowStockThreshold?: number;
  onLowStockThresholdChange?: (threshold: number) => void;
  onShowLowStock?: () => void;
  onClearFilters?: () => void;
  lowStockCount?: number;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
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
  lowStockThreshold = 10,
  onLowStockThresholdChange,
  onShowLowStock,
  onClearFilters,
  lowStockCount = 0
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
      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Custom Filters</span>
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Quick Filters</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="filters">
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
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
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
        </TabsContent>
        
        <TabsContent value="presets">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Low Stock Filter */}
              {onLowStockThresholdChange && onShowLowStock && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Low Stock Threshold
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={lowStockThreshold}
                      onChange={(e) => onLowStockThresholdChange(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center">
                      {lowStockThreshold}
                    </span>
                  </div>
                  <Button 
                    onClick={onShowLowStock}
                    className="w-full mt-2"
                    variant="default"
                  >
                    Show Low Stock Items
                    {lowStockCount > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {lowStockCount}
                      </span>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Other Presets Can Go Here */}
              <div className="space-y-2 pt-4 mt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium">Other Quick Views</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      if (onClearFilters) onClearFilters();
                    }}
                  >
                    View All Stock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFilter;
