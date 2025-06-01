import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi, unitApi, productApi, Product, ShipmentCreationRequest } from '@/lib/api';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { TransactionDetailsDTO } from '@/types/transactionDetailsDTO';

// Interface for the form data
export interface ShipmentFormData extends ShipmentCreationRequest {
  id?: number;
  // Additional fields for UI display
  productName?: string;
  unitName?: string;
  orderId?: number | null;
}

interface ShipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (shipment: ShipmentCreationRequest) => void;
  shipment?: ShipmentFormData;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  orderId?: number | null;
  item?: TransactionDetailsDTO | null;
}

const ShipmentForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  shipment, 
  mode, 
  isLoading = false,
  orderId = null,
  item = null
}: ShipmentFormProps) => {
  // Initialize form data with both product and unit details
  const [formData, setFormData] = useState<ShipmentFormData>({
    shipmentDate: format(new Date(), 'yyyy-MM-dd'),
    productId: item?.productId || 0,
    productName: item?.productName || '',
    unitId: item?.unitId || 0,
    unitName: item?.unit || '',
    warehouseId: 0,
    quantity: 1,
    remarks: '',
    orderId: orderId,
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

  // Initialize form with shipment data when editing
  useEffect(() => {
    if (shipment && mode === 'edit') {
      setFormData(shipment);
    } else {
      setFormData({
        shipmentDate: format(new Date(), 'yyyy-MM-dd'),
        productId: item?.productId || 0,
        productName: item?.productName || '',
        unitId: item?.unitId || 0,
        unitName: item?.unit || '',
        warehouseId: 0,
        quantity: 1,
        remarks: '',
        orderId: orderId,
      });
    }
  }, [shipment, mode, open, orderId, item]);

  // Set default warehouseId when warehouses are loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && formData.warehouseId === 0) {
      // Set the first warehouse as default
      setFormData(prev => ({
        ...prev,
        warehouseId: warehouses[0].id
      }));
    }
  }, [warehouses, formData.warehouseId]);

  // Handle form field changes
  const handleChange = (field: keyof ShipmentFormData, value: string | number) => {
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

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shipmentDate) {
      newErrors.shipmentDate = 'Shipment date is required';
    }

    if (!formData.productId || formData.productId <= 0) {
      newErrors.productId = 'Product is required';
    }

    if (!formData.warehouseId || formData.warehouseId <= 0) {
      newErrors.warehouseId = 'Warehouse is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const submitData: ShipmentCreationRequest = {
        shipmentDate: formData.shipmentDate,
        productId: item?.productId || 0,  // Use correct product ID
        unitId: item?.unitId || 0,        // Use correct unit ID
        warehouseId: formData.warehouseId,
        quantity: formData.quantity,
        remarks: formData.remarks,
        orderId: formData.orderId
      };

      onSubmit(submitData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Shipment' : 'Edit Shipment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipment Date */}
          <div className="space-y-2">
            <Label htmlFor="shipmentDate">Shipment Date</Label>
            <Input
              id="shipmentDate"
              type="date"
              value={formData.shipmentDate}
              onChange={(e) => handleChange('shipmentDate', e.target.value)}
              className={errors.shipmentDate ? 'border-red-500' : ''}
            />
            {errors.shipmentDate && (
              <p className="text-xs text-red-500">{errors.shipmentDate}</p>
            )}
          </div>

          {/* Product Name - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.productName}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Unit - Read Only - Replace the existing unit select with this */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={formData.unitName}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouseId">Warehouse</Label>
            {isLoadingWarehouses ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading warehouses...</span>
              </div>
            ) : warehouses && warehouses.length > 0 ? (
              <Select
                value={formData.warehouseId.toString()}
                onValueChange={(value) => handleChange('warehouseId', parseInt(value))}
              >
                <SelectTrigger className={errors.warehouseId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-gray-500">No warehouses available</div>
            )}
            {errors.warehouseId && (
              <p className="text-xs text-red-500">{errors.warehouseId}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              min="1"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Enter any additional notes"
              className="resize-none"
            />
          </div>

          <DialogFooter className="sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-warehouse-600 hover:bg-warehouse-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Shipment' : 'Update Shipment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentForm;
