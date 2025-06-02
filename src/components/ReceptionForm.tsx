import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi, unitApi, productApi, purchaseApi, Product, ReceptionCreationRequest, PurchaseDTO, TransactionDetailsDTO } from '@/lib/api';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

// Interface for the form data
interface ReceptionFormData extends ReceptionCreationRequest {
  id?: number;
  // Additional fields for UI display
  productName?: string;
  unitName?: string;
  purchaseId?: number | null;
  purchaseReference?: string;
  supplierName?: string;
}

interface ReceptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reception: ReceptionCreationRequest) => void;
  reception?: ReceptionFormData;
  mode: 'create' | 'edit' | 'fromPurchase';
  isLoading?: boolean;
  purchaseId?: number | null;
  item?: TransactionDetailsDTO | null;
  purchaseReference?: string;
  supplierName?: string;
}

const ReceptionForm = ({
  open,
  onOpenChange,
  onSubmit,
  reception,
  mode,
  isLoading = false,
  purchaseId = null,
  item = null,
  purchaseReference = '',
  supplierName = ''
}: ReceptionFormProps) => {
  const [formData, setFormData] = useState<ReceptionFormData>(() => ({
    receptionDate: format(new Date(), 'yyyy-MM-dd'),
    productId: item?.productId || 0,
    productName: item?.productName || '',
    unitId: item?.unitId || 0,
    unitName: item?.unit || '',
    warehouseId: 0,
    quantity: item?.quantity || 1,
    remarks: '',
    purchaseId: purchaseId,
    purchaseReference: purchaseReference,
    supplierName: supplierName
  }));

  // State for product search
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const productSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Purchase search removed as per requirements

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

  // Initialize form with reception data when editing
  useEffect(() => {
    if (reception && mode === 'edit') {
      setFormData({
        receptionDate: reception.receptionDate || format(new Date(), 'yyyy-MM-dd'),
        productId: reception.productId || 0,
        productName: reception.productName || '',
        unitId: reception.unitId || 0,
        unitName: reception.unitName || '',
        warehouseId: reception.warehouseId || 0,
        quantity: reception.quantity || 1,
        remarks: reception.remarks || '',
        purchaseId: reception.purchaseId || null,
        purchaseReference: reception.purchaseReference || '',
        supplierName: reception.supplierName || ''
      });
    } else if (mode === 'fromPurchase' && item) {
      // Set form data from purchase item
      setFormData({
        receptionDate: format(new Date(), 'yyyy-MM-dd'),
        productId: item.productId,
        productName: item.productName,
        unitId: item.unitId,
        unitName: item.unit,
        quantity: item.quantity,
        warehouseId: 0, // Will be set by warehouse useEffect
        remarks: '',
        purchaseId: purchaseId,
        purchaseReference: purchaseReference,
        supplierName: supplierName
      });
    } else {
      // Reset form for create mode
      setFormData({
        receptionDate: format(new Date(), 'yyyy-MM-dd'),
        productId: 0,
        productName: '',
        unitId: 0,
        unitName: '',
        warehouseId: 0,
        quantity: 1,
        remarks: '',
        purchaseId: null,
        purchaseReference: '',
        supplierName: ''
      });
    }
  }, [reception, mode, open, item, purchaseId, purchaseReference, supplierName]);

  // Remove the useEffect for setting default unitId since we handle it in form initialization
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && formData.warehouseId === 0 && mode !== 'edit') {
      // Set the first warehouse as default only in create mode
      setFormData(prev => ({
        ...prev,
        warehouseId: warehouses[0].id
      }));
    }
  }, [warehouses, formData.warehouseId, mode]);

  // Handle product search
  const handleProductSearch = (term: string) => {
    setProductSearchTerm(term);
    setIsProductSearching(true);

    // Clear previous timeout
    if (productSearchTimeoutRef.current) {
      clearTimeout(productSearchTimeoutRef.current);
    }

    // Set new timeout for search
    productSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await productApi.search(term);
        console.log('Search results:', response.data); // Debug log
        setProductSearchResults(response.data.items || []); // Assuming the API returns items array
      } catch (error) {
        console.error('Error searching products:', error);
        setProductSearchResults([]);
      } finally {
        setIsProductSearching(false);
      }
    }, 300);
  };

  // Purchase search removed as per requirements

  // Handle form field changes
  const handleChange = (field: keyof ReceptionFormData, value: string | number) => {
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
    setProductSearchResults([]);
    setProductSearchTerm('');
  };

  // Purchase selection removed as per requirements

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'edit') {
      if (!formData.quantity || formData.quantity <= 0) {
        newErrors.quantity = 'Quantity must be greater than zero';
      }
    } else {
      if (!formData.receptionDate) {
        newErrors.receptionDate = 'Reception date is required';
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update the handleSubmit function to only send quantity when editing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    if (validateForm()) {
      const submitData: ReceptionCreationRequest = mode === 'edit' ? {
        quantity: formData.quantity
      } : {
        receptionDate: formData.receptionDate,
        productId: formData.productId,
        unitId: formData.unitId,
        warehouseId: formData.warehouseId,
        quantity: formData.quantity,
        remarks: formData.remarks,
        purchaseId: mode === 'fromPurchase' ? purchaseId : undefined
      };

      onSubmit(submitData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Reception' : mode === 'fromPurchase' ? 'Create Reception from Purchase' : 'Edit Reception'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reception Date */}
          <div className="space-y-2">
            <Label htmlFor="receptionDate">Reception Date</Label>
            <Input
              id="receptionDate"
              type="date"
              value={formData.receptionDate}
              onChange={(e) => handleChange('receptionDate', e.target.value)}
              className={errors.receptionDate ? 'border-red-500' : ''}
              disabled={mode === 'edit'}
            />
            {errors.receptionDate && (
              <p className="text-xs text-red-500">{errors.receptionDate}</p>
            )}
          </div>

          {/* Purchase Reference - Show only in fromPurchase mode */}
          {mode === 'fromPurchase' && (
            <div className="space-y-2">
              <Label htmlFor="purchaseReference">Purchase Reference</Label>
              <Input
                id="purchaseReference"
                value={purchaseReference}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* Supplier Name - Show only in fromPurchase mode */}
          {mode === 'fromPurchase' && (
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier</Label>
              <Input
                id="supplierName"
                value={supplierName}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* Product Search */}
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <div className="relative">
              <div className="flex items-center">
                <Input
                  id="product"
                  value={mode === 'edit' ? formData.productName : productSearchTerm}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search for a product"
                  className={errors.productId ? 'border-red-500 pr-10' : 'pr-10'}
                  autoComplete="off"
                  readOnly={mode === 'edit'}
                  disabled={mode === 'edit'}
                />
                {isProductSearching ? (
                  <div className="absolute right-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <Search className="h-4 w-4 absolute right-3 text-gray-400" />
                )}
              </div>

              {/* Selected product display */}
              {formData.productId > 0 && formData.productName && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">{formData.productName}</span>
                  {mode !== 'edit' && (
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
                        setProductSearchTerm('');
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              )}

              {/* Search results dropdown */}
              {!formData.productId && productSearchTerm && productSearchResults.length > 0 && mode !== 'edit' && (
                <div 
                  className="absolute z-50 w-full mt-1 bg-white rounded-md border border-gray-200 shadow-lg max-h-[200px] overflow-y-auto"
                >
                  {productSearchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between"
                      onClick={() => handleProductSelect(product)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <span className="text-sm font-medium">{product.name}</span>
                      {product.description && (
                        <span className="text-xs text-gray-500 truncate ml-2">{product.description}</span>
                      )}
                    </button>
                  ))}
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
                value={formData.unitId?.toString()}
                onValueChange={(value) => handleChange('unitId', parseInt(value))}
                disabled={mode === 'edit'}
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
                disabled={mode === 'edit'}
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
              value={formData.quantity || ''}
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
              disabled={mode === 'edit'}
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
                mode === 'create' ? 'Create Reception' : 'Update Reception'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReceptionForm;
