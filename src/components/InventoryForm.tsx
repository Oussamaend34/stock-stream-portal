import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Interface for the form data
interface InventoryFormData {
  InventoryDate: string;
  warehouse: string;
}

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (inventory: InventoryFormData) => void;
  isLoading?: boolean;
}

const InventoryForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false 
}: InventoryFormProps) => {
  // Initialize form data
  const [formData, setFormData] = useState<InventoryFormData>({
    InventoryDate: format(new Date(), 'yyyy-MM-dd'),
    warehouse: '',
  });

  // State for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch warehouses
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await warehouseApi.getAll();
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Set default warehouse when warehouses are loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && formData.warehouse === '') {
      setFormData(prev => ({
        ...prev,
        warehouse: warehouses[0].name
      }));
    }
  }, [warehouses]);

  // Handle form field changes
  const handleChange = (field: keyof InventoryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.InventoryDate) {
      newErrors.InventoryDate = 'Inventory date is required';
    }

    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Inventory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Inventory Date */}
          <div className="space-y-2">
            <Label htmlFor="inventoryDate">Inventory Date</Label>
            <Input
              id="inventoryDate"
              type="date"
              value={formData.InventoryDate}
              onChange={(e) => handleChange('InventoryDate', e.target.value)}
              className={errors.InventoryDate ? 'border-red-500' : ''}
            />
            {errors.InventoryDate && (
              <p className="text-xs text-red-500">{errors.InventoryDate}</p>
            )}
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse</Label>
            {isLoadingWarehouses ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading warehouses...</span>
              </div>
            ) : (
              <Select
                value={formData.warehouse}
                onValueChange={(value) => handleChange('warehouse', value)}
              >
                <SelectTrigger className={errors.warehouse ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.name}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.warehouse && (
              <p className="text-xs text-red-500">{errors.warehouse}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating and Downloading...
                </>
              ) : (
                'Create Inventory'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryForm; 