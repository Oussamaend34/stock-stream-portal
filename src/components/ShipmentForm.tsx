
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

// Interface for the form data
export interface ShipmentFormData extends ShipmentCreationRequest {
  id?: number;
  // Additional fields for UI display
  productName?: string;
}

interface ShipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (shipment: ShipmentCreationRequest) => void;
  shipment?: ShipmentFormData;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

const ShipmentForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  shipment, 
  mode, 
  isLoading = false
}: ShipmentFormProps) => {
  // Initialize form data with default values
  const [formData, setFormData] = useState<ShipmentFormData>({
    shipmentDate: format(new Date(), 'yyyy-MM-dd'),
    productId: 0,
    productName: '',
    unitId: 0,
    warehouseId: 0,
    quantity: 1,
    remarks: '',
  });

  // State for product search
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch units
  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.getAll();
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Initialize form with shipment data when editing
  useEffect(() => {
    if (shipment && mode === 'edit') {
      setFormData(shipment);
    } else {
      // Reset form for create mode
      setFormData({
        shipmentDate: format(new Date(), 'yyyy-MM-dd'),
        productId: 0,
        productName: '',
        unitId: 0,
        warehouseId: 0,
        quantity: 1,
        remarks: '',
      });
    }
  }, [shipment, mode, open]);


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

  // Handle product search
  const handleProductSearch = (term: string) => {
    setSearchTerm(term);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Set a timeout to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await productApi.search(term);
        setSearchResults(response.data.items);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

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

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      productId: product.id,
      productName: product.name
    }));
    setSearchResults([]);
    setSearchTerm('');
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

    if (!formData.unitId || formData.unitId <= 0) {
      newErrors.unitId = 'Unit is required';
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
      // Create a copy of formData without UI-specific fields
      const submitData: ShipmentCreationRequest = {
        shipmentDate: formData.shipmentDate,
        productId: formData.productId,
        unitId: formData.unitId,
        warehouseId: formData.warehouseId,
        quantity: formData.quantity,
        remarks: formData.remarks,
        orderId: null // Always send null for orderId
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

          {/* Product Search */}
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <div className="relative">
              <div className="flex items-center">
                <Input
                  id="product"
                  value={searchTerm}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search for a product"
                  className={errors.productId ? 'border-red-500 pr-10' : 'pr-10'}
                />
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3" />
                ) : (
                  <Search className="h-4 w-4 absolute right-3 text-gray-400" />
                )}
              </div>

              {/* Selected product display */}
              {formData.productId > 0 && formData.productName && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">{formData.productName}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        productId: 0,
                        productName: ''
                      }));
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  <ul className="py-1">
                    {searchResults.map(product => (
                      <li 
                        key={product.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleProductSelect(product)}
                      >
                        {product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {errors.productId && (
              <p className="text-xs text-red-500">{errors.productId}</p>
            )}
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <Label htmlFor="unitId">Unit</Label>
            {isLoadingUnits ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading units...</span>
              </div>
            ) : units && units.length > 0 ? (
              <Select
                value={formData.unitId.toString()}
                onValueChange={(value) => handleChange('unitId', parseInt(value))}
              >
                <SelectTrigger className={errors.unitId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-gray-500">No units available</div>
            )}
            {errors.unitId && (
              <p className="text-xs text-red-500">{errors.unitId}</p>
            )}
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
