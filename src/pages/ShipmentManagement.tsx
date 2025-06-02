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
  Truck, 
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
import ShipmentForm, { ShipmentFormData } from '@/components/ShipmentForm';
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
import { shipmentApi, ShipmentDTO, Container, ShipmentCreationRequest } from '@/lib/api';
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
import ShipmentEditForm from '@/components/ShipmentEditForm';

const ShipmentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<ShipmentFormData | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch shipments with pagination
  const { 
    data: shipmentData, 
    isLoading: isLoadingShipments, 
    isError: isErrorShipments,
    error
  } = useQuery<Container<ShipmentDTO>>({
    queryKey: ['shipments', currentPage, pageSize],
    queryFn: async () => {
      const response = await shipmentApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // If we have a selected shipment ID, fetch the specific shipment details for the dialog
  const {
    data: selectedShipmentDetails,
    isLoading: isLoadingSelectedShipment,
    isError: isErrorSelectedShipment
  } = useQuery<ShipmentDTO>({
    queryKey: ['shipment', selectedShipmentId],
    queryFn: async () => {
      const response = await shipmentApi.getById(Number(selectedShipmentId));
      return response.data;
    },
    enabled: !!selectedShipmentId,
    refetchOnWindowFocus: false
  });


  // Handle success and error states
  useEffect(() => {
    if (shipmentData) {
      setTotalElements(shipmentData.count);
      setTotalPages(Math.ceil(shipmentData.count / pageSize));
    }
  }, [shipmentData, pageSize]);

  useEffect(() => {
    if (isErrorShipments && error) {
      toast.error(`Failed to fetch shipment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isErrorShipments, error]);

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

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: (shipmentData: ShipmentCreationRequest) => shipmentApi.create(shipmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  // Update shipment mutation
  const updateShipmentMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await shipmentApi.update(id, quantity);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  // Delete shipment mutation
  const deleteShipmentMutation = useMutation({
    mutationFn: (id: number) => shipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  // Filter shipments based on search term
  const filteredShipments = useMemo(() => {
    if (!shipmentData || !shipmentData.items) {
      return [];
    }

    return shipmentData.items.filter(shipment => 
      (shipment.product && shipment.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipment.warehouse && shipment.warehouse.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipment.orderReference && shipment.orderReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipment.clientName && shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [shipmentData, searchTerm]);

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
    setCurrentShipment(undefined); // Form will use default values
    setFormOpen(true);
  };

  const handleEdit = (shipment: ShipmentDTO) => {
    setFormMode('edit');
    setCurrentShipment(shipment);
    setFormOpen(true);
  };

  const handleDeleteIntent = (shipment: ShipmentDTO) => {
    // Convert ShipmentDTO to ShipmentFormData
    const formData: ShipmentFormData = {
      id: shipment.id,
      shipmentDate: shipment.shipmentDate,
      productId: 0, // We'll need to fetch the actual product ID
      productName: shipment.product,
      unitId: 0, // We'll need to fetch the actual unit ID
      warehouseId: 0, // We'll need to fetch the actual warehouse ID
      quantity: shipment.quantity,
      remarks: shipment.remarks || '',
    };
    setCurrentShipment(formData);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentShipment && currentShipment.id) {
      deleteShipmentMutation.mutate(currentShipment.id, {
        onSuccess: () => {
          toast.success(`Shipment has been deleted successfully`);
          setDeleteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to delete shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleFormSubmit = (shipment: ShipmentCreationRequest) => {
    if (formMode === 'create') {
      createShipmentMutation.mutate(shipment, {
        onSuccess: () => {
          toast.success(`Shipment has been created successfully`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to create shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleQuantityUpdate = (id: number, quantity: number) => {
    updateShipmentMutation.mutate({ id, quantity }, {
      onSuccess: () => {
        toast.success(`Shipment quantity has been updated successfully`);
        setFormOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to update shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shipment Management</h1>
              <p className="text-muted-foreground">
                Manage and track all shipments
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Shipment
            </Button>
            <Button variant="outline" onClick={() => {
              // Create CSV content from filteredShipments
              if (filteredShipments.length === 0) {
                toast.error("No data to export");
                return;
              }

              // Create headers
              const headers = ['ID', 'Date', 'Product', 'Quantity', 'Unit', 'Warehouse', 'Order Ref', 'Client'];
              const csvRows = [headers.join(',')];

              // Create rows
              filteredShipments.forEach(shipment => {
                const row = [
                  shipment.id,
                  shipment.shipmentDate,
                  `"${shipment.product.replace(/"/g, '""')}"`, // Escape quotes
                  shipment.quantity,
                  shipment.unit,
                  `"${shipment.warehouse.replace(/"/g, '""')}"`, // Escape quotes
                  shipment.orderReference ? `"${shipment.orderReference.replace(/"/g, '""')}"` : '""',
                  shipment.clientName ? `"${shipment.clientName.replace(/"/g, '""')}"` : '""'
                ];
                csvRows.push(row.join(','));
              });

              // Generate CSV
              const csvContent = csvRows.join('\n');

              // Create download
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `shipment-data-${new Date().toISOString().slice(0,10)}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              toast.success("Shipment data exported to CSV");
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all warehouses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredShipments.filter(shipment => {
                    // Filter shipments from the last 7 days
                    const shipmentDate = new Date(shipment.shipmentDate);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return shipmentDate >= sevenDaysAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the last 7 days
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredShipments.reduce((sum, shipment) => sum + shipment.quantity, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Products shipped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredShipments.length > 0 
                  ? Math.round(filteredShipments.reduce((sum, shipment) => sum + shipment.quantity, 0) / filteredShipments.length).toLocaleString() 
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per shipment
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Shipments</CardTitle>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by product, warehouse, order reference..."
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
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingShipments ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading shipments...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isErrorShipments ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-red-500">
                        Error loading shipments. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment) => (
                      <TableRow 
                        key={shipment.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedShipmentId(shipment.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{shipment.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(shipment.shipmentDate)}
                          </div>
                        </TableCell>
                        <TableCell>{shipment.product}</TableCell>
                        <TableCell>{shipment.quantity}</TableCell>
                        <TableCell>{shipment.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <WarehouseIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {shipment.warehouse}
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.orderReference ? (
                            <div className="font-medium text-blue-600 hover:underline">
                              {shipment.orderReference}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.clientName ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              {shipment.clientName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
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
                                // Pass the ShipmentDTO directly to handleEdit
                                handleEdit(shipment);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Pass the ShipmentDTO directly to handleDeleteIntent
                                  handleDeleteIntent(shipment);
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
                        No shipments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredShipments.length} of {totalElements} shipments
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Shipments per page</p>
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

      {formMode === 'create' ? (
        <ShipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          mode="create"
          isLoading={createShipmentMutation.isPending}
        />
      ) : (
        <ShipmentEditForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleQuantityUpdate}
          shipmentId={currentShipment?.id || 0}
          currentQuantity={currentShipment?.quantity || 0}
          isLoading={updateShipmentMutation.isPending}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the shipment with ID <strong>{currentShipment?.id}</strong>.
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

      {/* Shipment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              Shipment Details
            </DialogTitle>
            <DialogDescription>
              {selectedShipmentDetails?.id ? 
                `Shipment ID: ${selectedShipmentDetails.id}` : 
                'Loading shipment details...'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelectedShipment ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading shipment details...</span>
            </div>
          ) : isErrorSelectedShipment ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-medium">Failed to load shipment details</h3>
              <p>There was an error loading the shipment information.</p>
            </div>
          ) : selectedShipmentDetails ? (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{formatDate(selectedShipmentDetails.shipmentDate)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Warehouse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{selectedShipmentDetails.warehouse}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedShipmentDetails.quantity} {selectedShipmentDetails.unit}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{selectedShipmentDetails.product}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg">
                      {selectedShipmentDetails.remarks || <span className="text-muted-foreground text-sm">No remarks</span>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Order Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedShipmentDetails.orderReference ? (
                        <span className="text-blue-600">{selectedShipmentDetails.orderReference}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not associated with an order</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedShipmentDetails.clientName ? (
                        selectedShipmentDetails.clientName
                      ) : (
                        <span className="text-muted-foreground text-sm">No client information</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentManagement;
