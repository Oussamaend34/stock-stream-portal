
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Shipment {
  id?: number;
  shipmentNumber: string;
  orderNumber: string;
  product: string;
  quantity: number;
  fromWarehouse: string;
  destination: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  date: string;
}

interface ShipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (shipment: Shipment) => void;
  shipment?: Shipment;
  mode: 'create' | 'edit';
  warehouses: string[];
  orderNumbers: string[];
}

const ShipmentForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  shipment, 
  mode, 
  warehouses,
  orderNumbers 
}: ShipmentFormProps) => {
  const [formData, setFormData] = useState<Shipment>({
    shipmentNumber: '',
    orderNumber: '',
    product: '',
    quantity: 0,
    fromWarehouse: '',
    destination: '',
    status: 'PREPARING',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with shipment data when editing
    if (shipment && mode === 'edit') {
      setFormData(shipment);
    } else {
      // Reset form for create mode with a randomly generated shipment number
      setFormData({
        shipmentNumber: `SHP-${Math.floor(Math.random() * 10000)}`,
        orderNumber: orderNumbers.length > 0 ? orderNumbers[0] : '',
        product: '',
        quantity: 0,
        fromWarehouse: warehouses.length > 0 ? warehouses[0] : '',
        destination: '',
        status: 'PREPARING',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [shipment, mode, open, warehouses, orderNumbers]);

  const handleChange = (field: keyof Shipment, value: string | number) => {
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
    
    if (!formData.shipmentNumber.trim()) {
      newErrors.shipmentNumber = 'Shipment number is required';
    }
    
    if (!formData.orderNumber) {
      newErrors.orderNumber = 'Order number is required';
    }
    
    if (!formData.product.trim()) {
      newErrors.product = 'Product is required';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
    }
    
    if (!formData.fromWarehouse) {
      newErrors.fromWarehouse = 'Source warehouse is required';
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
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
            {mode === 'create' ? 'Create New Shipment' : 'Edit Shipment'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shipmentNumber">Shipment Number</Label>
            <Input
              id="shipmentNumber"
              value={formData.shipmentNumber}
              onChange={(e) => handleChange('shipmentNumber', e.target.value)}
              placeholder="Enter shipment number"
              className={errors.shipmentNumber ? 'border-red-500' : ''}
              readOnly={mode === 'edit'} // Shipment number should be read-only in edit mode
            />
            {errors.shipmentNumber && (
              <p className="text-xs text-red-500">{errors.shipmentNumber}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Select
              value={formData.orderNumber}
              onValueChange={(value) => handleChange('orderNumber', value)}
            >
              <SelectTrigger className={errors.orderNumber ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                {orderNumbers.map((orderNumber) => (
                  <SelectItem key={orderNumber} value={orderNumber}>
                    {orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orderNumber && (
              <p className="text-xs text-red-500">{errors.orderNumber}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => handleChange('product', e.target.value)}
              placeholder="Enter product name"
              className={errors.product ? 'border-red-500' : ''}
            />
            {errors.product && (
              <p className="text-xs text-red-500">{errors.product}</p>
            )}
          </div>
          
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
          
          <div className="space-y-2">
            <Label htmlFor="fromWarehouse">From Warehouse</Label>
            <Select
              value={formData.fromWarehouse}
              onValueChange={(value) => handleChange('fromWarehouse', value)}
            >
              <SelectTrigger className={errors.fromWarehouse ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select source warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fromWarehouse && (
              <p className="text-xs text-red-500">{errors.fromWarehouse}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              placeholder="Enter destination"
              className={errors.destination ? 'border-red-500' : ''}
            />
            {errors.destination && (
              <p className="text-xs text-red-500">{errors.destination}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED') => 
                handleChange('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
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
            <Button type="submit" className="bg-warehouse-600 hover:bg-warehouse-700">
              {mode === 'create' ? 'Create Shipment' : 'Update Shipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentForm;
