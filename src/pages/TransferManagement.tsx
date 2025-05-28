import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Edit, Trash2, MoreHorizontal, Search, Plus, Loader2, Calendar, Package, Warehouse, MoveHorizontal } from 'lucide-react';
import TransferForm, { Transfer } from '@/components/TransferForm';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi, TransfersContainer, TransferDTO } from '@/lib/api';
import { format } from 'date-fns';

const TransferManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const queryClient = useQueryClient();

  // Fetch transfers
  const { data: transfersData, isLoading, isError } = useQuery({
    queryKey: ['transfers', page, size],
    queryFn: async () => {
      const response = await transferApi.getAll(page, size);
      return response.data as TransfersContainer;
    }
  });

  // Extract transfers from the container
  const transfers = transfersData?.items || [];

  // Update totalCount when transfersData changes
  useEffect(() => {
    if (transfersData) {
      setTotalCount(transfersData.count);
    }
  }, [transfersData]);

  // Create transfer mutation - without global success handlers to avoid duplicate notifications
  const createTransferMutation = useMutation({
    mutationFn: (transferData: Transfer) => {
      // Convert Date to ISO string for API
      const apiTransferData = {
        ...transferData,
        transferDate: transferData.transferDate.toISOString().split('T')[0]
      };
      return transferApi.create(apiTransferData);
    },
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Update transfer mutation - without global success handlers to avoid duplicate notifications
  const updateTransferMutation = useMutation({
    mutationFn: ({ id, transferData }: { id: number, transferData: Transfer }) => {
      // Convert Date to ISO string for API
      const apiTransferData = {
        ...transferData,
        transferDate: transferData.transferDate.toISOString().split('T')[0]
      };
      return transferApi.update(id, apiTransferData);
    },
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Delete transfer mutation - without global success handlers to avoid duplicate notifications
  const deleteTransferMutation = useMutation({
    mutationFn: (id: number) => transferApi.delete(id),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  const filteredTransfers = transfers.filter(transfer => 
    transfer.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.sourceWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.destinationWarehouse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentTransfer(undefined);
    setFormOpen(true);
  };

  const handleEdit = (transferDTO: TransferDTO) => {
    // Convert TransferDTO to Transfer for the form
    const transfer: Transfer = {
      id: transferDTO.id,
      productId: 0, // These will be populated when fetching the transfer by ID in a real implementation
      sourceWarehouseId: 0,
      destinationWarehouseId: 0,
      unitId: 0,
      quantity: transferDTO.quantity,
      transferDate: new Date(transferDTO.transferDate),
      remarks: transferDTO.remarks || ''
    };
    
    setFormMode('edit');
    setCurrentTransfer(transfer);
    setFormOpen(true);
  };

  const handleDeleteIntent = (transferDTO: TransferDTO) => {
    // Convert TransferDTO to Transfer for the form
    const transfer: Transfer = {
      id: transferDTO.id,
      productId: 0,
      sourceWarehouseId: 0,
      destinationWarehouseId: 0,
      unitId: 0,
      quantity: transferDTO.quantity,
      transferDate: new Date(transferDTO.transferDate),
      remarks: transferDTO.remarks || ''
    };
    
    setCurrentTransfer(transfer);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentTransfer && currentTransfer.id) {
      deleteTransferMutation.mutate(currentTransfer.id, {
        onSuccess: () => {
          toast.success(`Transfer has been deleted`);
          setDeleteDialogOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['transfers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to delete transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after deletion
        }
      });
    }
  };

  const handleFormSubmit = (transfer: Transfer) => {
    if (formMode === 'create') {
      createTransferMutation.mutate(transfer, {
        onSuccess: () => {
          toast.success(`Transfer has been created`);
          setFormOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['transfers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after creation
        }
      });
    } else if (transfer.id) {
      updateTransferMutation.mutate({ id: transfer.id, transferData: transfer }, {
        onSuccess: () => {
          toast.success(`Transfer has been updated`);
          setFormOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['transfers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to update transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after update
        }
      });
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transfer Management</h1>
            <p className="text-muted-foreground">
              Manage product transfers between warehouses
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Transfer
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Transfers</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by product, source or destination warehouse..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading transfers...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-red-500">
                        Error loading transfers. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredTransfers.length > 0 ? (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">{transfer.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span>{format(new Date(transfer.transferDate), 'dd/MM/yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-gray-500" />
                            <span>{transfer.product}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Warehouse size={14} className="text-gray-500" />
                            <span>{transfer.sourceWarehouse}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Warehouse size={14} className="text-gray-500" />
                            <span>{transfer.destinationWarehouse}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MoveHorizontal size={14} className="text-gray-500" />
                            <span>{transfer.quantity} {transfer.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="truncate max-w-[150px] block">{transfer.remarks}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(transfer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(transfer)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No transfers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination controls */}
            {!isLoading && !isError && totalCount > 0 && (
              <div className="flex items-center justify-between space-x-6 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {transfers.length} of {totalCount} transfers
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1} 
                      />
                    </PaginationItem>

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive>{page}</PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(prev => (prev * size < totalCount) ? prev + 1 : prev)}
                        disabled={page * size >= totalCount} 
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransferForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        transfer={currentTransfer}
        mode={formMode} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transfer.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransferManagement;