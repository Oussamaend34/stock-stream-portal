import React, { useState, useEffect, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { 
  PackageOpen, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Loader2, 
  Calendar,
  Package,
  Warehouse as WarehouseIcon,
  FileText,
  User,
  Download,
  AlertTriangle
} from 'lucide-react';
import ReceptionForm, { ReceptionFormData } from '@/components/ReceptionForm';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionApi, ReceptionDTO, Container, ReceptionCreationRequest } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const ReceptionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentReception, setCurrentReception] = useState<ReceptionFormData | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedReceptionId, setSelectedReceptionId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch receptions with pagination
  const { 
    data: receptionData, 
    isLoading: isLoadingReceptions, 
    isError: isErrorReceptions,
    error
  } = useQuery<Container<ReceptionDTO>>({
    queryKey: ['receptions', currentPage, pageSize],
    queryFn: async () => {
      const response = await receptionApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // If we have a selected reception ID, fetch the specific reception details for the dialog
  const {
    data: selectedReceptionDetails,
    isLoading: isLoadingSelectedReception,
    isError: isErrorSelectedReception
  } = useQuery<ReceptionDTO>({
    queryKey: ['reception', selectedReceptionId],
    queryFn: async () => {
      const response = await receptionApi.getById(Number(selectedReceptionId));
      return response.data;
    },
    enabled: !!selectedReceptionId,
    refetchOnWindowFocus: false
  });

  // Handle success and error states
  useEffect(() => {
    if (receptionData) {
      setTotalElements(receptionData.count);
      setTotalPages(Math.ceil(receptionData.count / pageSize));
    }
  }, [receptionData, pageSize]);

  useEffect(() => {
    if (isErrorReceptions && error) {
      toast.error(`Failed to fetch reception data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isErrorReceptions, error]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    // Ensure we don't go beyond bounds (keeping as 1-based for consistency)
    const boundedPage = Math.max(1, Math.min(newPage, totalPages));

    if (boundedPage !== currentPage) {
      setCurrentPage(boundedPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    // Calculate which item should stay visible after page size change
    const firstItemIndex = (currentPage - 1) * pageSize;

    // Calculate new page number to keep the user viewing the same data
    const newPage = Math.floor(firstItemIndex / newSize) + 1;

    // Ensure we never set page below 1 (since we use 1-based pagination)
    const safeNewPage = Math.max(1, newPage);

    // Recalculate total pages with the new page size
    const newTotalPages = Math.max(1, Math.ceil(totalElements / newSize));

    // Update state in the correct order
    setPageSize(newSize);
    setTotalPages(newTotalPages);

    // Make sure we don't go beyond the new total pages
    const boundedPage = Math.min(safeNewPage, newTotalPages);
    setCurrentPage(boundedPage);
  };

  // Create reception mutation
  const createReceptionMutation = useMutation({
    mutationFn: (receptionData: ReceptionCreationRequest) => receptionApi.create(receptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions'] });
    }
  });

  // Update reception mutation
  const updateReceptionMutation = useMutation({
    mutationFn: ({ id, receptionData }: { id: number, receptionData: ReceptionCreationRequest }) => 
      receptionApi.update(id, receptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions'] });
    }
  });

  // Delete reception mutation
  const deleteReceptionMutation = useMutation({
    mutationFn: (id: number) => receptionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions'] });
    }
  });

  // Filter receptions based on search term
  const filteredReceptions = useMemo(() => {
    if (!receptionData || !receptionData.items) {
      return [];
    }

    return receptionData.items.filter(reception => 
      (reception.product && reception.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reception.warehouse && reception.warehouse.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reception.purchaseReference && reception.purchaseReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reception.supplierName && reception.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [receptionData, searchTerm]);

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Add ellipsis if needed
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const handleCreate = () => {
    setFormMode('create');
    setCurrentReception(undefined); // Form will use default values
    setFormOpen(true);
  };

  const handleEdit = (reception: ReceptionDTO) => {
    setFormMode('edit');
    // Convert ReceptionDTO to ReceptionFormData
    const formData: ReceptionFormData = {
      id: reception.id,
      receptionDate: reception.receptionDate,
      productId: 0, // We'll need to fetch the actual product ID
      productName: reception.product,
      unitId: 0, // We'll need to fetch the actual unit ID
      warehouseId: 0, // We'll need to fetch the actual warehouse ID
      quantity: reception.quantity,
      remarks: reception.remarks || '',
    };
    setCurrentReception(formData);
    setFormOpen(true);
  };

  const handleDeleteIntent = (reception: ReceptionDTO) => {
    // Convert ReceptionDTO to ReceptionFormData
    const formData: ReceptionFormData = {
      id: reception.id,
      receptionDate: reception.receptionDate,
      productId: 0, // We'll need to fetch the actual product ID
      productName: reception.product,
      unitId: 0, // We'll need to fetch the actual unit ID
      warehouseId: 0, // We'll need to fetch the actual warehouse ID
      quantity: reception.quantity,
      remarks: reception.remarks || '',
    };
    setCurrentReception(formData);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentReception && currentReception.id) {
      deleteReceptionMutation.mutate(currentReception.id, {
        onSuccess: () => {
          toast.success(`Reception has been deleted successfully`);
          setDeleteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to delete reception: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleFormSubmit = (reception: ReceptionCreationRequest) => {
    if (formMode === 'create') {
      createReceptionMutation.mutate(reception, {
        onSuccess: () => {
          toast.success(`Reception has been created successfully`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to create reception: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } else if (currentReception && currentReception.id) {
      updateReceptionMutation.mutate({ id: currentReception.id, receptionData: reception }, {
        onSuccess: () => {
          toast.success(`Reception has been updated successfully`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to update reception: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  // Helper functions for formatting and counting
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PackageOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reception Management</h1>
              <p className="text-muted-foreground">
                Manage and track all receptions
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Reception
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Receptions</CardTitle>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by product, warehouse, purchase reference..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
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
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Purchase Ref</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingReceptions ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading receptions...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isErrorReceptions ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-red-500">
                        Error loading receptions. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredReceptions.length > 0 ? (
                    filteredReceptions.map((reception) => (
                      <TableRow 
                        key={reception.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedReceptionId(reception.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{reception.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(reception.receptionDate)}
                          </div>
                        </TableCell>
                        <TableCell>{reception.product}</TableCell>
                        <TableCell>{reception.quantity}</TableCell>
                        <TableCell>{reception.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <WarehouseIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {reception.warehouse}
                          </div>
                        </TableCell>
                        <TableCell>{reception.purchaseReference || '-'}</TableCell>
                        <TableCell>{reception.supplierName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(reception);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteIntent(reception);
                                }}
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
                      <TableCell colSpan={9} className="h-24 text-center">
                        No receptions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredReceptions.length} of {totalElements} receptions
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Receptions per page</p>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex items-center space-x-1">
                  {/* Previous page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Previous page</span>
                    <span>‹</span>
                  </Button>

                  {/* Page number buttons */}
                  {generatePaginationItems()}

                  {/* Next page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Next page</span>
                    <span>›</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReceptionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        reception={currentReception}
        mode={formMode}
        formType="normal"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reception with ID <strong>{currentReception?.id}</strong>.
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

export default ReceptionManagement;
