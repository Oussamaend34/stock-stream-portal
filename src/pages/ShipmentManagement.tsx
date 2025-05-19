import React, { useState } from 'react';
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
} from '@/components/ui/card';
import { Truck, Edit, Trash2, MoreHorizontal, Search, Plus, Loader2 } from 'lucide-react';
import ShipmentForm, { Shipment } from '@/components/ShipmentForm';
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
import { shipmentApi, warehouseApi, orderApi } from '@/lib/api';

const ShipmentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [warehouseList, setWarehouseList] = useState<string[]>([]);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const itemsPerPage = 5;

  // Fetch shipments
  const { 
    data: shipments = [], 
    isLoading: isLoadingShipments, 
    isError: isErrorShipments 
  } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const response = await shipmentApi.getAll();
      return response.data;
    }
  });

  // Fetch warehouses for the dropdown
  const { 
    data: warehouses = [], 
    isLoading: isLoadingWarehouses 
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await warehouseApi.getAll();
      return response.data;
    },
    onSuccess: (data) => {
      // Extract warehouse names for the dropdown
      setWarehouseList(data.map((warehouse: any) => warehouse.name));
    }
  });

  // Fetch orders for the dropdown
  const { 
    data: orders = [], 
    isLoading: isLoadingOrders 
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await orderApi.getAll();
      return response.data;
    },
    onSuccess: (data) => {
      // Extract order numbers for the dropdown
      setOrderNumbers(data.map((order: any) => order.orderNumber));
    }
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: (shipmentData: Shipment) => shipmentApi.create(shipmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  // Update shipment mutation
  const updateShipmentMutation = useMutation({
    mutationFn: ({ id, shipmentData }: { id: number, shipmentData: Shipment }) => 
      shipmentApi.update(id, shipmentData),
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
  const filteredShipments = shipments.filter(shipment => 
    shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate shipments
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentShipment(undefined);
    setFormOpen(true);
  };

  const handleEdit = (shipment: Shipment) => {
    setFormMode('edit');
    setCurrentShipment(shipment);
    setFormOpen(true);
  };

  const handleDeleteIntent = (shipment: Shipment) => {
    setCurrentShipment(shipment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentShipment && currentShipment.id) {
      deleteShipmentMutation.mutate(currentShipment.id, {
        onSuccess: () => {
          toast.success(`Shipment ${currentShipment.shipmentNumber} has been deleted`);
          setDeleteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to delete shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleFormSubmit = (shipment: Shipment) => {
    if (formMode === 'create') {
      createShipmentMutation.mutate(shipment, {
        onSuccess: () => {
          toast.success(`Shipment ${shipment.shipmentNumber} has been created`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to create shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } else if (shipment.id) {
      updateShipmentMutation.mutate({ id: shipment.id, shipmentData: shipment }, {
        onSuccess: () => {
          toast.success(`Shipment ${shipment.shipmentNumber} has been updated`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to update shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const getStatusBadgeClass = (status: Shipment['status']) => {
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

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shipment Management</h1>
            <p className="text-muted-foreground">
              Manage and track all shipments
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Shipment
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Shipments</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search shipments..."
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
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="hidden md:table-cell">From</TableHead>
                    <TableHead className="hidden md:table-cell">Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
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
                  ) : paginatedShipments.length > 0 ? (
                    paginatedShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.shipmentNumber}</TableCell>
                        <TableCell>{shipment.orderNumber}</TableCell>
                        <TableCell>{shipment.product}</TableCell>
                        <TableCell>{shipment.quantity}</TableCell>
                        <TableCell className="hidden md:table-cell">{shipment.fromWarehouse}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {shipment.destination}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(shipment.status)}`}>
                            {shipment.status}
                          </span>
                        </TableCell>
                        <TableCell>{shipment.date}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(shipment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(shipment)}
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

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>

      <ShipmentForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        shipment={currentShipment}
        mode={formMode}
        warehouses={warehouseList}
        orderNumbers={orderNumbers}
        isLoading={isLoadingWarehouses || isLoadingOrders}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the shipment <strong>{currentShipment?.shipmentNumber}</strong>.
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

export default ShipmentManagement;
