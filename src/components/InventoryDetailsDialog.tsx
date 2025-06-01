import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InventoryDetailsDialogProps {
  inventory: InventoryDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryDetailsDialog({ inventory, isOpen, onClose }: InventoryDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch inventory lines
  const { data: inventoryLines, isLoading: isLoadingLines } = useQuery({
    queryKey: ['inventory-lines', inventory?.id],
    queryFn: async () => {
      if (!inventory) return [];
      const response = await inventoryApi.getLines(inventory.id);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!inventory
  });

  // Process file mutation
  const processFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!inventory) throw new Error('No inventory selected');
      try {
        const response = await inventoryApi.processFile(inventory.id, file);
        console.log('Upload response:', response);
        return response;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Upload success:', data);
      toast.success('File processed successfully');
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lines', inventory?.id] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      console.error('Detailed error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process file';
      toast.error(errorMessage);
    }
  });

  // Add validation mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!inventory) throw new Error('No inventory selected');
      return await inventoryApi.validate(inventory.id);
    },
    onSuccess: () => {
      toast.success('Inventory validated successfully');
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lines', inventory?.id] });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to validate inventory';
      toast.error(errorMessage);
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !inventory) {
      toast.error('Please select a file and ensure inventory is selected');
      return;
    }

    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting file upload for inventory:', inventory.id);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      await inventoryApi.uploadFile(inventory.id, file);
      toast.success('File uploaded successfully');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      window.location.reload();
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.message || 
                         'Upload failed. Please ensure the file is in the correct format.';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = () => {
    setShowValidationDialog(true);
  };

  const handleConfirmValidation = () => {
    if (inventory) {
      validateMutation.mutate();
      setShowValidationDialog(false);
    }
  };

  if (!inventory) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Inventory Details</DialogTitle>
            <DialogDescription>
              View and manage inventory details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">ID</Label>
                  <div className="col-span-3">{inventory.id}</div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Date</Label>
                  <div className="col-span-3">
                    {new Date(inventory.inventoryDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Warehouse</Label>
                  <div className="col-span-3">{inventory.warehouse}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inventory.status === 'VALIDATED' 
                        ? 'bg-green-100 text-green-800'
                        : inventory.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inventory.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Done By</Label>
                  <div className="col-span-3">{inventory.doneBy.name}</div>
                </div>
              </div>
            </div>

            <div className="border rounded-md">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected Qty</TableHead>
                      <TableHead>Actual Qty</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLines ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : inventoryLines?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No inventory lines found</TableCell>
                      </TableRow>
                    ) : (
                      inventoryLines?.map((line) => (
                        <TableRow key={`${line.productId}-${line.unitId}`}>
                          <TableCell>{line.productName}</TableCell>
                          <TableCell>{line.expectedQuantity}</TableCell>
                          <TableCell>{line.actualQuantity}</TableCell>
                          <TableCell className={
                            line.difference < 0 ? 'text-red-600' : 
                            line.difference > 0 ? 'text-green-600' : ''
                          }>
                            {line.difference}
                          </TableCell>
                          <TableCell>{line.unit}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !inventory}
              >
                {isUploading ? 'Uploading...' : 'Choose Excel File'}
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="default"
                onClick={handleValidate}
                disabled={validateMutation.isPending || inventory?.status === 'VALIDATED'}
              >
                {validateMutation.isPending ? 'Validating...' : 'Validate'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Validate Inventory</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span>Are you sure you want to validate this inventory? This action cannot be undone.</span>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium block">Inventory ID</span>
                      <span className="text-sm text-muted-foreground block">{inventory.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium block">Warehouse</span>
                      <span className="text-sm text-muted-foreground block">{inventory.warehouse}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium block">Date</span>
                      <span className="text-sm text-muted-foreground block">
                        {new Date(inventory.inventoryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium block">Done By</span>
                      <span className="text-sm text-muted-foreground block">{inventory.doneBy.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmValidation}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {validateMutation.isPending ? "Validating..." : "Validate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 