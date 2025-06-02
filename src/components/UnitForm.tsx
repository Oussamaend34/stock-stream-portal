import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Unit } from '@/lib/api';

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (unit: { name: string; abbreviation: string }) => void;
  unit?: Unit;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

const UnitForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  unit, 
  mode, 
  isLoading = false 
}: UnitFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unit && mode === 'edit') {
      setFormData({
        name: unit.name,
        abbreviation: unit.abbreviation
      });
    } else {
      setFormData({
        name: '',
        abbreviation: ''
      });
    }
  }, [unit, mode, open]);

  const handleChange = (field: keyof typeof formData, value: string) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Unit name is required';
    }

    if (!formData.abbreviation.trim()) {
      newErrors.abbreviation = 'Abbreviation is required';
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Unit' : 'Edit Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter unit name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abbreviation</Label>
            <Input
              id="abbreviation"
              value={formData.abbreviation}
              onChange={(e) => handleChange('abbreviation', e.target.value)}
              placeholder="Enter abbreviation"
              className={errors.abbreviation ? 'border-red-500' : ''}
            />
            {errors.abbreviation && (
              <p className="text-xs text-red-500">{errors.abbreviation}</p>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                mode === 'create' ? 'Create Unit' : 'Update Unit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnitForm; 