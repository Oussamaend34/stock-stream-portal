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
import { UserCircle, Edit, Trash2, MoreHorizontal, Search, Plus, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import SupplierForm, { Supplier } from '@/components/SupplierForm';
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
import { supplierApi, SuppliersContainer } from '@/lib/api';

const SupplierManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const queryClient = useQueryClient();

  // Fetch suppliers
  const { data: suppliersData, isLoading, isError } = useQuery({
    queryKey: ['suppliers', page, size],
    queryFn: async () => {
      const response = await supplierApi.getAll(page, size);
      return response.data as SuppliersContainer;
    }
  });

  // Extract suppliers from the container
  const suppliers = suppliersData?.items || [];

  // Update totalCount when suppliersData changes
  useEffect(() => {
    if (suppliersData) {
      setTotalCount(suppliersData.count);
    }
  }, [suppliersData]);

  // Create supplier mutation - without global success handlers to avoid duplicate notifications
  const createSupplierMutation = useMutation({
    mutationFn: (supplierData: Supplier) => supplierApi.create(supplierData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Update supplier mutation - without global success handlers to avoid duplicate notifications
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, supplierData }: { id: number, supplierData: Supplier }) => 
      supplierApi.update(id, supplierData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Delete supplier mutation - without global success handlers to avoid duplicate notifications
  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => supplierApi.delete(id),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentSupplier(undefined);
    setFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormMode('edit');
    setCurrentSupplier(supplier);
    setFormOpen(true);
  };

  const handleDeleteIntent = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentSupplier && currentSupplier.id) {
      deleteSupplierMutation.mutate(currentSupplier.id, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for supplier deletion should be triggered
          toast.success(`Supplier ${currentSupplier.name} has been deleted`);
          setDeleteDialogOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['suppliers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after deletion
        }
      });
    }
  };

  const handleFormSubmit = (supplier: Supplier) => {
    if (formMode === 'create') {
      createSupplierMutation.mutate(supplier, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for supplier creation should be triggered
          toast.success(`Supplier ${supplier.name} has been created`);
          setFormOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['suppliers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to create supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after creation
        }
      });
    } else if (supplier.id) {
      updateSupplierMutation.mutate({ id: supplier.id, supplierData: supplier }, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for supplier updates should be triggered
          toast.success(`Supplier ${supplier.name} has been updated`);
          setFormOpen(false);

          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['suppliers', page, size] });
        },
        onError: (error) => {
          toast.error(`Failed to update supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
            <p className="text-muted-foreground">
              Manage your supplier base and supplier information
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Suppliers</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email, phone or address..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading suppliers...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-red-500">
                        Error loading suppliers. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle size={16} className="text-blue-600" />
                            <span>{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            <span>{supplier.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            <span>{supplier.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span className="truncate max-w-[200px]">{supplier.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(supplier)}
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        No suppliers found.
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
                  Showing {suppliers.length} of {totalCount} suppliers
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

      <SupplierForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        supplier={currentSupplier}
        mode={formMode} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier <strong>{currentSupplier?.name}</strong>.
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

export default SupplierManagement;