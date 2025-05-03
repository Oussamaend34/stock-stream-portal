
import React, { useState } from 'react';
import Layout from '@/components/Layout';
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
import { Truck, Edit, Trash2, MoreHorizontal, Search, Plus } from 'lucide-react';
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

// Mock data
const initialShipments: Shipment[] = [
  { 
    id: 1, 
    shipmentNumber: 'SHP-2001', 
    orderNumber: 'ORD-1001', 
    product: 'Laptop', 
    quantity: 5, 
    fromWarehouse: 'Central Warehouse', 
    destination: 'Acme Corp HQ, New York', 
    status: 'DELIVERED', 
    date: '2023-05-03' 
  },
  { 
    id: 2, 
    shipmentNumber: 'SHP-2002', 
    orderNumber: 'ORD-1002', 
    product: 'Monitor', 
    quantity: 10, 
    fromWarehouse: 'West Depot', 
    destination: 'TechStart Office, San Francisco', 
    status: 'IN_TRANSIT', 
    date: '2023-05-04' 
  },
  { 
    id: 3, 
    shipmentNumber: 'SHP-2003', 
    orderNumber: 'ORD-1003', 
    product: 'Keyboard', 
    quantity: 20, 
    fromWarehouse: 'East Storage', 
    destination: 'Global Shipping Center, Miami', 
    status: 'PREPARING', 
    date: '2023-05-05' 
  },
  { 
    id: 4, 
    shipmentNumber: 'SHP-2004', 
    orderNumber: 'ORD-1004', 
    product: 'Mouse', 
    quantity: 30, 
    fromWarehouse: 'North Storage', 
    destination: 'Quick Electronics Store, Chicago', 
    status: 'FAILED', 
    date: '2023-05-06' 
  },
  { 
    id: 5, 
    shipmentNumber: 'SHP-2005', 
    orderNumber: 'ORD-1005', 
    product: 'Printer', 
    quantity: 2, 
    fromWarehouse: 'South Facility', 
    destination: 'Office Supplies Inc, Houston', 
    status: 'DELIVERED', 
    date: '2023-05-07' 
  },
];

// Mock warehouse data
const warehouseList = ['Central Warehouse', 'West Depot', 'North Storage', 'East Storage', 'South Facility'];

// Mock order numbers
const orderNumbers = ['ORD-1001', 'ORD-1002', 'ORD-1003', 'ORD-1004', 'ORD-1005', 'ORD-1006', 'ORD-1007'];

const ShipmentManagement = () => {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<Shipment | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 5;
  
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
    if (currentShipment) {
      setShipments(shipments.filter(s => s.id !== currentShipment.id));
      toast.success(`Shipment ${currentShipment.shipmentNumber} has been deleted`);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = (shipment: Shipment) => {
    if (formMode === 'create') {
      // Simulate backend assigning an ID
      const newShipment = { ...shipment, id: Math.max(...shipments.map(s => s.id || 0)) + 1 };
      setShipments([...shipments, newShipment]);
      toast.success(`Shipment ${shipment.shipmentNumber} has been created`);
    } else {
      // Update existing shipment
      setShipments(shipments.map(s => s.id === shipment.id ? shipment : s));
      toast.success(`Shipment ${shipment.shipmentNumber} has been updated`);
    }
    setFormOpen(false);
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
    <Layout>
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
                  {paginatedShipments.length > 0 ? (
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
    </Layout>
  );
};

export default ShipmentManagement;
