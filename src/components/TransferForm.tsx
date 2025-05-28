import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { productApi, warehouseApi, unitApi } from '@/lib/api';

export interface Transfer {
  id?: number;
  productId: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  unitId: number;
  quantity: number;
  transferDate: Date;
  remarks: string;
}

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transfer: Transfer) => void;
  transfer?: Transfer;
  mode: 'create' | 'edit';
}

const TransferForm = ({ open, onOpenChange, onSubmit, transfer, mode }: TransferFormProps) => {
  const [formData, setFormData] = useState<Transfer>({
    productId: 0,
    sourceWarehouseId: 0,
    destinationWarehouseId: 0,
    unitId: 0,
    quantity: 0,
    transferDate: new Date(),
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch products, warehouses, and units for dropdowns
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await productApi.getAll(1, 100);
      return response.data.items;
    },
    enabled: open,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await warehouseApi.getAll();
      return response.data;
    },
    enabled: open,
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.getAll();
      return response.data;
    },
    enabled: open,
  });

  useEffect(() => {
    // Initialize form with transfer data when editing
    if (transfer && mode === 'edit') {
      setFormData({
        ...transfer,
        transferDate: new Date(transfer.transferDate),
      });
    } else {
      // Reset form for create mode
      setFormData({
        productId: 0,
        sourceWarehouseId: 0,
        destinationWarehouseId: 0,
        unitId: 0,
        quantity: 0,
        transferDate: new Date(),
        remarks: '',
      });
    }
  }, [transfer, mode, open]);

  const handleChange = (field: keyof Transfer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }
    
    if (!formData.sourceWarehouseId) {
      newErrors.sourceWarehouseId = 'Source warehouse is required';
    }
    
    if (!formData.destinationWarehouseId) {
      newErrors.destinationWarehouseId = 'Destination warehouse is required';
    }

    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      newErrors.destinationWarehouseId = 'Source and destination warehouses must be different';
    }
    
    if (!formData.unitId) {
      newErrors.unitId = 'Unit is required';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.transferDate) {
      newErrors.transferDate = 'Transfer date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
          <DialogTitle>
            {mode === 'create' ? 'Create New Transfer' : 'Edit Transfer'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.productId.toString()}
              onValueChange={(value) => handleChange('productId', parseInt(value))}
            >
              <SelectTrigger className={errors.productId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && (
              <p className="text-xs text-red-500">{errors.productId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sourceWarehouse">Source Warehouse</Label>
            <Select
              value={formData.sourceWarehouseId.toString()}
              onValueChange={(value) => handleChange('sourceWarehouseId', parseInt(value))}
            >
              <SelectTrigger className={errors.sourceWarehouseId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select source warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sourceWarehouseId && (
              <p className="text-xs text-red-500">{errors.sourceWarehouseId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destinationWarehouse">Destination Warehouse</Label>
            <Select
              value={formData.destinationWarehouseId.toString()}
              onValueChange={(value) => handleChange('destinationWarehouseId', parseInt(value))}
            >
              <SelectTrigger className={errors.destinationWarehouseId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select destination warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destinationWarehouseId && (
              <p className="text-xs text-red-500">{errors.destinationWarehouseId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={formData.unitId.toString()}
              onValueChange={(value) => handleChange('unitId', parseInt(value))}
            >
              <SelectTrigger className={errors.unitId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.unit} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitId && (
              <p className="text-xs text-red-500">{errors.unitId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
              placeholder="Enter quantity"
              min="1"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transferDate">Transfer Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.transferDate && "text-muted-foreground",
                    errors.transferDate && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.transferDate ? format(formData.transferDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.transferDate}
                  onSelect={(date) => handleChange('transferDate', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.transferDate && (
              <p className="text-xs text-red-500">{errors.transferDate}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Enter any additional notes"
              className={errors.remarks ? 'border-red-500' : ''}
            />
            {errors.remarks && (
              <p className="text-xs text-red-500">{errors.remarks}</p>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {mode === 'create' ? 'Create Transfer' : 'Update Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm;