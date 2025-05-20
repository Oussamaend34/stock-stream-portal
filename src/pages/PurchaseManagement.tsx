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
  ShoppingBag, 
  Calendar,
  User,
  Download,
  ArrowLeft,
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import PurchaseForm from '@/components/PurchaseForm';
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
import { purchaseApi, PurchaseDTO, Container, TransactionDetailsDTO, PurchaseCreationRequest } from '@/lib/api';
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

const PurchaseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // 1-based pagination
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch purchase data with pagination
  const {
    data: purchaseData,
    isLoading,
    isError,
    error
  } = useQuery<Container<PurchaseDTO>>({
    queryKey: ['purchases', currentPage, pageSize],
    queryFn: async () => {
      const response = await purchaseApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // If we have a selected purchase ID, fetch the specific purchase details for the dialog
  const {
    data: selectedPurchaseDetails,
    isLoading: isLoadingSelectedPurchase,
    isError: isErrorSelectedPurchase
  } = useQuery<PurchaseDTO>({
    queryKey: ['purchase', selectedPurchaseId],
    queryFn: async () => {
      const response = await purchaseApi.getById(Number(selectedPurchaseId));
      return response.data;
    },
    enabled: !!selectedPurchaseId,
    refetchOnWindowFocus: false
  });

  // Handle success and error states
  useEffect(() => {
    if (purchaseData) {
      setTotalElements(purchaseData.count);
      setTotalPages(Math.ceil(purchaseData.count / pageSize));
    }
  }, [purchaseData, pageSize]);

  useEffect(() => {
    if (isError && error) {
      toast.error(`Failed to fetch purchase data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Filter purchases based on search term
  const filteredPurchases = useMemo(() => {
    if (!purchaseData || !purchaseData.items) {
      return [];
    }

    return purchaseData.items.filter(purchase =>
      purchase.purchaseReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseData, searchTerm]);

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

  const getTotalItems = (purchase: PurchaseDTO) => {
    return purchase.purchaseItems ? purchase.purchaseItems.length : 0;
  };

  // Render the purchase table with current data
  const renderPurchasesTable = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Supplier</TableHead>
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
                    Loading purchases...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  Error loading purchases. Please try again.
                </TableCell>
              </TableRow>
            ) : filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <TableRow 
                  key={purchase.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedPurchaseId(purchase.id);
                    setIsDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-blue-600 hover:underline">
                      {purchase.purchaseReference}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {purchase.supplierName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(purchase.purchaseDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      {getTotalItems(purchase)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No purchases found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Handle purchase creation
  const handleCreatePurchase = async (purchaseData: PurchaseCreationRequest) => {
    setIsCreatingPurchase(true);
    try {
      await purchaseApi.create(purchaseData);
      toast.success('Purchase created successfully');
      setIsPurchaseFormOpen(false);

      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchasesCount'] });
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to create purchase. Please try again.');
    } finally {
      setIsCreatingPurchase(false);
    }
  };

  // Main purchases listing view
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Purchase Management</h1>
              <p className="text-muted-foreground">
                View and manage supplier purchases
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsPurchaseFormOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Purchase
            </Button>
            <Button variant="outline" onClick={() => {
              // Create CSV content from filteredPurchases
              if (filteredPurchases.length === 0) {
                toast.error("No data to export");
                return;
              }

              // Create headers
              const headers = ['ID', 'Purchase Reference', 'Supplier Name', 'Purchase Date', 'Items Count'];
              const csvRows = [headers.join(',')];

              // Create rows
              filteredPurchases.forEach(purchase => {
                const row = [
                  purchase.id,
                  `"${purchase.purchaseReference.replace(/"/g, '""')}"`, // Escape quotes
                  `"${purchase.supplierName.replace(/"/g, '""')}"`, // Escape quotes
                  purchase.purchaseDate,
                  getTotalItems(purchase)
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
              link.setAttribute('download', `purchase-data-${new Date().toISOString().slice(0,10)}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              toast.success("Purchase data exported to CSV");
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
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all suppliers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredPurchases.filter(purchase => {
                    // Filter purchases from the last 7 days
                    const purchaseDate = new Date(purchase.purchaseDate);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return purchaseDate >= sevenDaysAgo;
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
                {filteredPurchases.reduce((sum, purchase) => sum + getTotalItems(purchase), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Products purchased
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredPurchases.length > 0 
                  ? Math.round(filteredPurchases.reduce((sum, purchase) => sum + getTotalItems(purchase), 0) / filteredPurchases.length).toLocaleString() 
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Items per purchase
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Purchases</CardTitle>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by purchase reference or supplier..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderPurchasesTable()}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPurchases.length} of {totalElements} purchases
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Purchases per page</p>
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

      {/* Purchase Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
              Purchase Details
            </DialogTitle>
            <DialogDescription>
              {selectedPurchaseDetails?.purchaseReference ? 
                `Purchase Reference: ${selectedPurchaseDetails.purchaseReference}` : 
                'Loading purchase details...'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelectedPurchase ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading purchase details...</span>
            </div>
          ) : isErrorSelectedPurchase ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-medium">Failed to load purchase details</h3>
              <p>There was an error loading the purchase information.</p>
            </div>
          ) : selectedPurchaseDetails ? (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{selectedPurchaseDetails.supplierName}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Purchase Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{formatDate(selectedPurchaseDetails.purchaseDate)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedPurchaseDetails.purchaseItems.reduce((sum, item) => sum + item.quantity, 0)}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPurchaseDetails.purchaseItems && selectedPurchaseDetails.purchaseItems.length > 0 ? (
                      selectedPurchaseDetails.purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.productName}</div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No items found for this purchase.
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

      {/* Purchase Form Dialog */}
      <PurchaseForm
        open={isPurchaseFormOpen}
        onOpenChange={setIsPurchaseFormOpen}
        onSubmit={handleCreatePurchase}
        isLoading={isCreatingPurchase}
      />
    </>
  );
};

export default PurchaseManagement;
