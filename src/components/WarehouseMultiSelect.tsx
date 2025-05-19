import React from 'react';
import { Button } from '@/components/ui/button';

interface WarehouseMultiSelectProps {
  warehouses: any[];
  selectedWarehouseIds: number[];
  onChange: (ids: number[]) => void;
}

const WarehouseMultiSelect: React.FC<WarehouseMultiSelectProps> = ({ 
  warehouses, 
  selectedWarehouseIds, 
  onChange 
}) => {
  // Select all warehouses
  const handleSelectAll = () => {
    if (warehouses) {
      const allIds = warehouses.map(w => w.id);
      onChange(allIds);
    }
  };

  // Clear all selections
  const handleClearAll = () => {
    onChange([]);
  };

  // Toggle selection of a warehouse
  const handleToggle = (warehouseId: number, isChecked: boolean) => {
    if (isChecked) {
      onChange([...selectedWarehouseIds, warehouseId]);
    } else {
      onChange(selectedWarehouseIds.filter(id => id !== warehouseId));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">
          Multiple Warehouses
          {selectedWarehouseIds.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedWarehouseIds.length} selected
            </span>
          )}
        </h4>
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs h-6"
          onClick={handleSelectAll}
        >
          Select All
        </Button>
        {selectedWarehouseIds.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-6"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>
      
      <div className="space-y-2 max-h-[120px] overflow-y-auto">
        {warehouses && warehouses.map((warehouse) => (
          <div key={warehouse.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`warehouse-${warehouse.id}`}
              checked={selectedWarehouseIds.includes(warehouse.id)}
              onChange={(e) => handleToggle(warehouse.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={`warehouse-${warehouse.id}`} className="text-sm text-gray-700">
              {warehouse.code} - {warehouse.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseMultiSelect;
