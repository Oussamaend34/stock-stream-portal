
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export interface Warehouse {
  id?: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
}

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (warehouse: Warehouse) => void;
  warehouse?: Warehouse;
  mode: 'create' | 'edit';
}

const WarehouseForm = ({ open, onOpenChange, onSubmit, warehouse, mode }: WarehouseFormProps) => {
  const [formData, setFormData] = useState<Warehouse>({
    name: '',
    location: '',
    capacity: 0,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with warehouse data when editing
    if (warehouse && mode === 'edit') {
      setFormData(warehouse);
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        location: '',
        capacity: 0,
        description: '',
      });
    }
  }, [warehouse, mode, open]);

  const handleChange = (field: keyof Warehouse, value: string | number) => {
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than zero';
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
            {mode === 'create' ? 'Create New Warehouse' : 'Edit Warehouse'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter warehouse name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter location"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-xs text-red-500">{errors.location}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (in units)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
              placeholder="Enter capacity"
              min="0"
              className={errors.capacity ? 'border-red-500' : ''}
            />
            {errors.capacity && (
              <p className="text-xs text-red-500">{errors.capacity}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter warehouse description"
              className="resize-none"
              rows={3}
            />
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
              {mode === 'create' ? 'Create Warehouse' : 'Update Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WarehouseForm;
