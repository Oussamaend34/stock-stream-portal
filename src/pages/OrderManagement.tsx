
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
  CardDescription
} from '@/components/ui/card';
import { Package, Edit, Trash2, MoreHorizontal, Search, Plus, FileText, Upload } from 'lucide-react';
import OrderForm, { Order } from '@/components/OrderForm';
import ExcelUploader from '@/components/ExcelUploader';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
const initialOrders: Order[] = [
  { 
    id: 1, 
    orderNumber: 'ORD-1001', 
    customerName: 'Acme Corp', 
    product: 'Laptop', 
    quantity: 5, 
    warehouse: 'Central Warehouse', 
    status: 'COMPLETED', 
    date: '2023-05-01' 
  },
  { 
    id: 2, 
    orderNumber: 'ORD-1002', 
    customerName: 'TechStart Inc', 
    product: 'Monitor', 
    quantity: 10, 
    warehouse: 'West Depot', 
    status: 'PROCESSING', 
    date: '2023-05-02' 
  },
  { 
    id: 3, 
    orderNumber: 'ORD-1003', 
    customerName: 'Global Shipping', 
    product: 'Keyboard', 
    quantity: 20, 
    warehouse: 'East Storage', 
    status: 'PENDING', 
    date: '2023-05-03' 
  },
  { 
    id: 4, 
    orderNumber: 'ORD-1004', 
    customerName: 'Quick Electronics', 
    product: 'Mouse', 
    quantity: 30, 
    warehouse: 'North Storage', 
    status: 'CANCELLED', 
    date: '2023-05-04' 
  },
  { 
    id: 5, 
    orderNumber: 'ORD-1005', 
    customerName: 'Office Supplies Inc', 
    product: 'Printer', 
    quantity: 2, 
    warehouse: 'South Facility', 
    status: 'COMPLETED', 
    date: '2023-05-05' 
  },
  { 
    id: 6, 
    orderNumber: 'ORD-1006', 
    customerName: 'Tech Solutions', 
    product: 'Hard Drive', 
    quantity: 15, 
    warehouse: 'Central Warehouse', 
    status: 'PENDING', 
    date: '2023-05-06' 
  },
  { 
    id: 7, 
    orderNumber: 'ORD-1007', 
    customerName: 'Macro Systems', 
    product: 'Camera', 
    quantity: 8, 
    warehouse: 'West Depot', 
    status: 'PROCESSING', 
    date: '2023-05-07' 
  },
];

// Mock warehouse data
const warehouseList = ['Central Warehouse', 'West Depot', 'North Storage', 'East Storage', 'South Facility'];

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('orders');
  
  const itemsPerPage = 5;
  
  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentOrder(undefined);
    setFormOpen(true);
  };

  const handleEdit = (order: Order) => {
    setFormMode('edit');
    setCurrentOrder(order);
    setFormOpen(true);
  };

  const handleDeleteIntent = (order: Order) => {
    setCurrentOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentOrder) {
      setOrders(orders.filter(o => o.id !== currentOrder.id));
      toast.success(`Order ${currentOrder.orderNumber} has been deleted`);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = (order: Order) => {
    if (formMode === 'create') {
      // Simulate backend assigning an ID
      const newOrder = { ...order, id: Math.max(...orders.map(o => o.id || 0)) + 1 };
      setOrders([...orders, newOrder]);
      toast.success(`Order ${order.orderNumber} has been created`);
    } else {
      // Update existing order
      setOrders(orders.map(o => o.id === order.id ? order : o));
      toast.success(`Order ${order.orderNumber} has been updated`);
    }
    setFormOpen(false);
  };
  
  const handleUploadSuccess = (data: any[]) => {
    const newOrders = data.map((item, index) => ({
      id: Math.max(...orders.map(o => o.id || 0)) + index + 1,
      orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
      customerName: 'Bulk Import',
      product: item.product,
      quantity: item.quantity,
      warehouse: item.warehouse,
      status: 'PENDING' as const,
      date: new Date().toISOString().split('T')[0],
    }));
    
    setOrders([...orders, ...newOrders]);
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
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
            <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Order
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="orders">
              <FileText className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="pt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Orders</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
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
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.product}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>{order.warehouse}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(order)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteIntent(order)}
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
                            No orders found.
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
          </TabsContent>
          
          <TabsContent value="upload" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Orders</CardTitle>
                <CardDescription>
                  Upload Excel files to create multiple orders at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExcelUploader onUploadSuccess={handleUploadSuccess} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <OrderForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        order={currentOrder}
        mode={formMode}
        warehouses={warehouseList}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order <strong>{currentOrder?.orderNumber}</strong>.
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

export default OrderManagement;
