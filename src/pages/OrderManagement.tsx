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
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { 
  Package, 
  Search, 
  Loader2, 
  ShoppingCart, 
  Calendar,
  User,
  Download,
  ArrowLeft,
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';
import OrderForm from '@/components/OrderForm';
import ShipmentForm from '@/components/ShipmentForm';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { orderApi, clientApi, OrderCreationRequest, shipmentApi, ShipmentCreationRequest } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
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
import { useForm, FormProvider, useFormContext, Controller } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the order data structure based on the DTO
interface TransactionDetailsDTO {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unit: string;
  quantity: number;
}

interface OrderDTO {
  id: number;
  orderReference: string;
  clientName: string;
  orderDate: string; // ISO date string format
  orderItems: TransactionDetailsDTO[];
}


// Define Client and Product interfaces
interface ClientDTO {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface ProductDTO {
  id: number;
  name: string;
  description?: string;
}

interface UnitDTO {
  id: number;
  name: string;
  symbol: string;
}

// Define the paginated response structure
interface OrderContainer {
  TotalNumberOfElements: number;
  pageElements: OrderDTO[];
}

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // 1-based pagination
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isShipmentFormOpen, setIsShipmentFormOpen] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<TransactionDetailsDTO | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch order data with pagination
  const {
    data: orderData,
    isLoading,
    isError,
    error
  } = useQuery<OrderDTO[]>({
    queryKey: ['orders', currentPage, pageSize],
    queryFn: async () => {
      const response = await orderApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Get total count of orders for pagination
  const { 
    data: totalOrdersCount
  } = useQuery<number>({
    queryKey: ['ordersCount'],
    queryFn: async () => {
      const response = await orderApi.getTotalCount();
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // If we have a selected order ID, fetch the specific order details for the dialog
  const {
    data: selectedOrderDetails,
    isLoading: isLoadingSelectedOrder,
    isError: isErrorSelectedOrder,
    refetch: refetchSelectedOrder
  } = useQuery<OrderDTO>({
    queryKey: ['order', selectedOrderId],
    queryFn: async () => {
      const response = await orderApi.getById(Number(selectedOrderId));
      return response.data;
    },
    enabled: !!selectedOrderId,
    refetchOnWindowFocus: false
  });

  // Handle success and error states
  useEffect(() => {
    if (totalOrdersCount !== undefined) {
      setTotalElements(totalOrdersCount);
      setTotalPages(Math.ceil(totalOrdersCount / pageSize));
    }
  }, [totalOrdersCount, pageSize]);

  useEffect(() => {
    if (isError && error) {
      toast.error(`Failed to fetch order data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isError, error]);

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

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!orderData || !Array.isArray(orderData)) {
      return [];
    }

    return orderData.filter(order =>
      order.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orderData, searchTerm]);

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

  const getTotalItems = (order: OrderDTO) => {
    return order.orderItems ? order.orderItems.length : 0;
  };

  // Render the order table with current data
  const renderOrdersTable = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading orders...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  Error loading orders. Please try again.
                </TableCell>
              </TableRow>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setIsDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-blue-600 hover:underline">
                      {order.orderReference}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {order.clientName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(order.orderDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      {getTotalItems(order)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Handle order creation
  const handleCreateOrder = async (orderData: OrderCreationRequest) => {
    setIsCreatingOrder(true);
    try {
      await orderApi.create(orderData);
      toast.success('Order created successfully');
      setIsOrderFormOpen(false);

      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ordersCount'] });
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle order creation success
  const handleOrderCreationSuccess = () => {
    // Invalidate queries to refetch the latest data
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['ordersCount'] });
    toast.success('Order list has been refreshed with new data');
  };

  // Handle shipment creation
  const handleCreateShipment = async (shipmentData: ShipmentCreationRequest) => {
    setIsCreatingShipment(true);
    try {
      await shipmentApi.create(shipmentData);
      toast.success('Shipment created successfully');
      setIsShipmentFormOpen(false);
      setSelectedOrderItem(null);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment. Please try again.');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  // Handle ship item button click
  const handleShipItem = (item: TransactionDetailsDTO) => {
    setSelectedOrderItem(item);
    setIsShipmentFormOpen(true);
  };

  // Main orders listing view
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
              <p className="text-muted-foreground">
                View and manage customer orders
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsOrderFormOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
            <Button variant="outline" onClick={() => {
              // Create CSV content from filteredOrders
              if (filteredOrders.length === 0) {
                toast.error("No data to export");
                return;
              }

              // Create headers
              const headers = ['ID', 'Order Reference', 'Client Name', 'Order Date', 'Items Count'];
              const csvRows = [headers.join(',')];

              // Create rows
              filteredOrders.forEach(order => {
                const row = [
                  order.id,
                  `"${order.orderReference.replace(/"/g, '""')}"`, // Escape quotes
                  `"${order.clientName.replace(/"/g, '""')}"`, // Escape quotes
                  order.orderDate,
                  getTotalItems(order)
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
              link.setAttribute('download', `order-data-${new Date().toISOString().slice(0,10)}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              toast.success("Order data exported to CSV");
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
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredOrders.filter(order => {
                    // Filter orders from the last 7 days
                    const orderDate = new Date(order.orderDate);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return orderDate >= sevenDaysAgo;
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
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredOrders.reduce((sum, order) => sum + getTotalItems(order), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Products ordered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredOrders.length > 0 
                  ? Math.round(filteredOrders.reduce((sum, order) => sum + getTotalItems(order), 0) / filteredOrders.length).toLocaleString() 
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Items per order
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Orders</CardTitle>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by order reference or client..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderOrdersTable()}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredOrders.length} of {totalElements} orders
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Orders per page</p>
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

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrderDetails?.orderReference ? 
                `Order Reference: ${selectedOrderDetails.orderReference}` : 
                'Loading order details...'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelectedOrder ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading order details...</span>
            </div>
          ) : isErrorSelectedOrder ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-medium">Failed to load order details</h3>
              <p>There was an error loading the order information.</p>
            </div>
          ) : selectedOrderDetails ? (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{selectedOrderDetails.clientName}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Order Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{formatDate(selectedOrderDetails.orderDate)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedOrderDetails.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderDetails.orderItems && selectedOrderDetails.orderItems.length > 0 ? (
                      selectedOrderDetails.orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.productName}</div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent dialog from closing
                                handleShipItem(item);
                              }}
                            >
                              SHIP
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No items found for this order.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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

      {/* Order Form Dialog */}
      <OrderForm
        open={isOrderFormOpen}
        onOpenChange={setIsOrderFormOpen}
        onSubmit={handleCreateOrder}
        isLoading={isCreatingOrder}
      />

      {/* Shipment Form Dialog */}
      {selectedOrderItem && (
        <ShipmentForm
          open={isShipmentFormOpen}
          onOpenChange={setIsShipmentFormOpen}
          onSubmit={handleCreateShipment}
          mode="create"
          isLoading={isCreatingShipment}
          orderId={selectedOrderId}
          item={selectedOrderItem}
        />
      )}
    </>
  );
};

export default OrderManagement;

