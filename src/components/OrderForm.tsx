
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Order {
  id?: number;
  orderNumber: string;
  customerName: string;
  product: string;
  quantity: number;
  warehouse: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  date: string;
}

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Order) => void;
  order?: Order;
  mode: 'create' | 'edit';
  warehouses: string[];
}

const OrderForm = ({ open, onOpenChange, onSubmit, order, mode, warehouses }: OrderFormProps) => {
  const [formData, setFormData] = useState<Order>({
    orderNumber: '',
    customerName: '',
    product: '',
    quantity: 0,
    warehouse: '',
    status: 'PENDING',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with order data when editing
    if (order && mode === 'edit') {
      setFormData(order);
    } else {
      // Reset form for create mode with a randomly generated order number
      setFormData({
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        customerName: '',
        product: '',
        quantity: 0,
        warehouse: warehouses.length > 0 ? warehouses[0] : '',
        status: 'PENDING',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [order, mode, open, warehouses]);

  const handleChange = (field: keyof Order, value: string | number) => {
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
    
    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required';
    }
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!formData.product.trim()) {
      newErrors.product = 'Product is required';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
    }
    
    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse is required';
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
            {mode === 'create' ? 'Create New Order' : 'Edit Order'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              value={formData.orderNumber}
              onChange={(e) => handleChange('orderNumber', e.target.value)}
              placeholder="Enter order number"
              className={errors.orderNumber ? 'border-red-500' : ''}
              readOnly={mode === 'edit'} // Order number should be read-only in edit mode
            />
            {errors.orderNumber && (
              <p className="text-xs text-red-500">{errors.orderNumber}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              placeholder="Enter customer name"
              className={errors.customerName ? 'border-red-500' : ''}
            />
            {errors.customerName && (
              <p className="text-xs text-red-500">{errors.customerName}</p>
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
            <Label htmlFor="warehouse">Warehouse</Label>
            <Select
              value={formData.warehouse}
              onValueChange={(value) => handleChange('warehouse', value)}
            >
              <SelectTrigger className={errors.warehouse ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse && (
              <p className="text-xs text-red-500">{errors.warehouse}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => 
                handleChange('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              {mode === 'create' ? 'Create Order' : 'Update Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
