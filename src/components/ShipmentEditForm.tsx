import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ShipmentEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, quantity: number) => void;
  shipmentId: number;
  currentQuantity: number;
  isLoading?: boolean;
}

const ShipmentEditForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  shipmentId,
  currentQuantity,
  isLoading = false 
}: ShipmentEditFormProps) => {
  const [quantity, setQuantity] = useState<number>(currentQuantity);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    onSubmit(shipmentId, quantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Shipment Quantity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setError('');
              }}
              min="1"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Quantity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentEditForm; 