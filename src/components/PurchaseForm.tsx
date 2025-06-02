import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { unitApi, productApi, supplierApi, Product, PurchaseCreationRequest, PurchaseItemCreationRequest } from '@/lib/api';
import { Loader2, Search, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';

// Interface for the form data
export interface PurchaseFormData extends Omit<PurchaseCreationRequest, 'purchaseItems'> {
  id?: number;
  // Use array instead of Set for easier state management
  purchaseItems: Array<PurchaseItemCreationRequest & { productName?: string }>;
}

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (purchase: PurchaseCreationRequest) => void;
  isLoading?: boolean;
}

interface Supplier {
  id: number;
  name: string;
}

const PurchaseForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false
}: PurchaseFormProps) => {
  // Initialize form data with default values
  const [formData, setFormData] = useState<PurchaseFormData>({
    purchaseReference: `PUR-${Math.floor(Math.random() * 10000)}`,
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    supplierId: 0,
    purchaseItems: []
  });

  // State for supplier search
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [isSupplierSearching, setIsSupplierSearching] = useState(false);
  const [supplierSearchResults, setSupplierSearchResults] = useState<Supplier[]>([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const supplierSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for product search
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const productSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for current item being added
  const [currentItem, setCurrentItem] = useState<{
    productId: number;
    productName: string;
    unitId: number;
    quantity: number;
  }>({
    productId: 0,
    productName: '',
    unitId: 0,
    quantity: 1
  });

  // State for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch units
  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.getAll();
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        purchaseReference: `PUR-${Math.floor(Math.random() * 10000)}`,
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        supplierId: 0,
        purchaseItems: []
      });
      setSelectedSupplierName('');
      setCurrentItem({
        productId: 0,
        productName: '',
        unitId: 0,
        quantity: 1
      });
      setErrors({});
    }
  }, [open]);

  // Set default unitId when units are loaded
  useEffect(() => {
    if (units && units.length > 0 && currentItem.unitId === 0) {
      setCurrentItem(prev => ({
        ...prev,
        unitId: units[0].id
      }));
    }
  }, [units, currentItem.unitId]);

  // Handle supplier search
  const handleSupplierSearch = (term: string) => {
    setSupplierSearchTerm(term);

    // Clear previous timeout
    if (supplierSearchTimeoutRef.current) {
      clearTimeout(supplierSearchTimeoutRef.current);
    }

    if (term.trim().length < 2) {
      setSupplierSearchResults([]);
      return;
    }

    // Set a timeout to avoid too many API calls
    supplierSearchTimeoutRef.current = setTimeout(async () => {
      setIsSupplierSearching(true);
      try {
        const response = await supplierApi.search(term);
        setSupplierSearchResults(response.data.items);
      } catch (error) {
        console.error('Error searching suppliers:', error);
        setSupplierSearchResults([]);
      } finally {
        setIsSupplierSearching(false);
      }
    }, 300);
  };

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

  // Handle form field changes
  const handleChange = (field: keyof PurchaseFormData, value: string | number) => {
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

  // Handle current item field changes
  const handleItemChange = (field: keyof typeof currentItem, value: string | number) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[`item_${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`item_${field}`];
        return newErrors;
      });
    }
  };

  // Handle supplier selection
  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData((prev) => ({
      ...prev,
      supplierId: supplier.id
    }));
    setSelectedSupplierName(supplier.name);
    setSupplierSearchResults([]);
    setSupplierSearchTerm('');
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setCurrentItem((prev) => ({
      ...prev,
      productId: product.id,
      productName: product.name
    }));
    setProductSearchResults([]);
    setProductSearchTerm('');
  };

  // Add current item to purchase items
  const handleAddItem = () => {
    // Validate current item
    const itemErrors: Record<string, string> = {};

    if (!currentItem.productId || currentItem.productId <= 0) {
      itemErrors.item_productId = 'Product is required';
    }

    if (!currentItem.unitId || currentItem.unitId <= 0) {
      itemErrors.item_unitId = 'Unit is required';
    }

    if (!currentItem.quantity || currentItem.quantity <= 0) {
      itemErrors.item_quantity = 'Quantity must be greater than zero';
    }

    if (Object.keys(itemErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...itemErrors }));
      return;
    }

    // Add item to purchase items
    setFormData(prev => ({
      ...prev,
      purchaseItems: [
        ...prev.purchaseItems,
        {
          productId: currentItem.productId,
          productName: currentItem.productName,
          unitId: currentItem.unitId,
          quantity: currentItem.quantity
        }
      ]
    }));

    // Reset current item
    setCurrentItem({
      productId: 0,
      productName: '',
      unitId: units && units.length > 0 ? units[0].id : 0,
      quantity: 1
    });
  };

  // Remove item from purchase items
  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      purchaseItems: prev.purchaseItems.filter((_, i) => i !== index)
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchaseReference) {
      newErrors.purchaseReference = 'Purchase reference is required';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    if (!formData.supplierId || formData.supplierId <= 0) {
      newErrors.supplierId = 'Supplier is required';
    }

    if (formData.purchaseItems.length === 0) {
      newErrors.purchaseItems = 'At least one purchase item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Create an array of purchase items without UI-specific fields
      const purchaseItemsArray = formData.purchaseItems.map(item => ({
        productId: item.productId,
        unitId: item.unitId,
        quantity: item.quantity
      }));

      // Create a copy of formData without UI-specific fields
      const submitData: PurchaseCreationRequest = {
        purchaseReference: formData.purchaseReference,
        purchaseDate: formData.purchaseDate,
        supplierId: formData.supplierId,
        purchaseItems: purchaseItemsArray
      };

      onSubmit(submitData);
    }
  };

  // Get unit name by ID
  const getUnitName = (unitId: number) => {
    if (!units) return 'Loading...';
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Purchase</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Purchase Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Reference */}
            <div className="space-y-2">
              <Label htmlFor="purchaseReference">Purchase Reference</Label>
              <Input
                id="purchaseReference"
                value={formData.purchaseReference}
                onChange={(e) => handleChange('purchaseReference', e.target.value)}
                className={errors.purchaseReference ? 'border-red-500' : ''}
              />
              {errors.purchaseReference && (
                <p className="text-xs text-red-500">{errors.purchaseReference}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
                className={errors.purchaseDate ? 'border-red-500' : ''}
              />
              {errors.purchaseDate && (
                <p className="text-xs text-red-500">{errors.purchaseDate}</p>
              )}
            </div>
          </div>

          {/* Supplier Search */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <div className="relative">
              <div className="flex items-center">
                <Input
                  id="supplier"
                  value={supplierSearchTerm}
                  onChange={(e) => handleSupplierSearch(e.target.value)}
                  placeholder="Search for a supplier"
                  className={errors.supplierId ? 'border-red-500 pr-10' : 'pr-10'}
                />
                {isSupplierSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3" />
                ) : (
                  <Search className="h-4 w-4 absolute right-3 text-gray-400" />
                )}
              </div>

              {/* Selected supplier display */}
              {formData.supplierId > 0 && selectedSupplierName && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">{selectedSupplierName}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        supplierId: 0
                      }));
                      setSelectedSupplierName('');
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Search results dropdown */}
              {supplierSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  <ul className="py-1">
                    {supplierSearchResults.map(supplier => (
                      <li 
                        key={supplier.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSupplierSelect(supplier)}
                      >
                        {supplier.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {errors.supplierId && (
              <p className="text-xs text-red-500">{errors.supplierId}</p>
            )}
          </div>

          {/* Purchase Items Section */}
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium">Purchase Items</h3>

            {/* Add new item form */}
            <div className="grid grid-cols-1 gap-4">
              {/* Product Search */}
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <div className="relative">
                  <div className="flex items-center">
                    <Input
                      id="product"
                      value={productSearchTerm}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      placeholder="Search for a product"
                      className={errors.item_productId ? 'border-red-500 pr-10' : 'pr-10'}
                      autoComplete="off"
                      readOnly={currentItem.productId > 0}
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
                  {currentItem.productId > 0 && currentItem.productName && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                      <span className="text-sm font-medium">{currentItem.productName}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setCurrentItem(prev => ({
                            ...prev,
                            productId: 0,
                            productName: ''
                          }));
                          setProductSearchTerm('');
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}

                  {/* Search results dropdown */}
                  {!currentItem.productId && productSearchTerm && productSearchResults.length > 0 && (
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
                  {!currentItem.productId && productSearchTerm && !isProductSearching && productSearchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border border-gray-200 bg-white p-2 text-center text-sm text-gray-500 shadow-lg">
                      No products found
                    </div>
                  )}
                </div>
                {errors.item_productId && (
                  <p className="text-xs text-red-500">{errors.item_productId}</p>
                )}
              </div>

              {/* Unit and Quantity in a row for smaller screens, stacked for very small screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={currentItem.unitId.toString()}
                      onValueChange={(value) => handleItemChange('unitId', parseInt(value))}
                      disabled={!currentItem.productId}
                    >
                      <SelectTrigger className={errors.item_unitId ? 'border-red-500' : ''}>
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
                  {errors.item_unitId && (
                    <p className="text-xs text-red-500">{errors.item_unitId}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={currentItem.quantity}
                    onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    min="1"
                    className={errors.item_quantity ? 'border-red-500' : ''}
                    disabled={!currentItem.productId}
                  />
                  {errors.item_quantity && (
                    <p className="text-xs text-red-500">{errors.item_quantity}</p>
                  )}
                </div>
              </div>

              {/* Add Item Button */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Purchase Items List */}
            {formData.purchaseItems.length > 0 ? (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Items in this purchase:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {formData.purchaseItems.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.productName}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.quantity} {getUnitName(item.unitId)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No items added to this purchase yet
              </div>
            )}

            {errors.purchaseItems && (
              <p className="text-xs text-red-500">{errors.purchaseItems}</p>
            )}
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
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Purchase'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseForm;