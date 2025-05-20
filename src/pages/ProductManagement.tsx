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
} from '@/components/ui/card';
import { 
  Package, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Loader2, 
  Download
} from 'lucide-react';
import ProductForm, { ProductFormData } from '@/components/ProductForm';
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
} from "@/components/ui/pagination";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, Product, Container } from '@/lib/api';
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
} from "@/components/ui/dialog";

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch products with pagination
  const { 
    data: productData, 
    isLoading: isLoadingProducts, 
    isError: isErrorProducts,
    error
  } = useQuery<Container<Product>>({
    queryKey: ['products', currentPage, pageSize],
    queryFn: async () => {
      const response = await productApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // If we have a selected product ID, fetch the specific product details for the dialog
  const {
    data: selectedProductDetails,
    isLoading: isLoadingSelectedProduct,
    isError: isErrorSelectedProduct
  } = useQuery<Product>({
    queryKey: ['product', selectedProductId],
    queryFn: async () => {
      const response = await productApi.getById(Number(selectedProductId));
      return response.data;
    },
    enabled: !!selectedProductId,
    refetchOnWindowFocus: false
  });

  // Handle success and error states
  useEffect(() => {
    if (productData) {
      setTotalElements(productData.count);
      setTotalPages(Math.ceil(productData.count / pageSize));
    }
  }, [productData, pageSize]);

  useEffect(() => {
    if (isErrorProducts && error) {
      toast.error(`Failed to fetch product data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isErrorProducts, error]);

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

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (productData: ProductFormData) => productApi.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, productData }: { id: number, productData: ProductFormData }) => 
      productApi.update(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!productData || !productData.items) {
      return [];
    }

    return productData.items.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [productData, searchTerm]);

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
    setCurrentProduct(undefined); // Form will use default values
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormMode('edit');
    setCurrentProduct(product);
    setFormOpen(true);
  };

  const handleDeleteIntent = (product: Product) => {
    setCurrentProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentProduct && currentProduct.id) {
      deleteProductMutation.mutate(currentProduct.id, {
        onSuccess: () => {
          toast.success(`Product has been deleted successfully`);
          setDeleteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleFormSubmit = (product: ProductFormData) => {
    if (formMode === 'create') {
      createProductMutation.mutate(product, {
        onSuccess: () => {
          toast.success(`Product has been created successfully`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } else if (currentProduct && currentProduct.id) {
      updateProductMutation.mutate({ id: currentProduct.id, productData: product }, {
        onSuccess: () => {
          toast.success(`Product has been updated successfully`);
          setFormOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
              <p className="text-muted-foreground">
                Manage all products in the system
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => {
              // Create CSV content from filteredProducts
              if (filteredProducts.length === 0) {
                toast.error("No data to export");
                return;
              }

              // Create headers
              const headers = ['ID', 'Name', 'Description'];
              const csvRows = [headers.join(',')];

              // Create rows
              filteredProducts.forEach(product => {
                const row = [
                  product.id,
                  `"${product.name.replace(/"/g, '""')}"`, // Escape quotes
                  `"${(product.description || '').replace(/"/g, '""')}"` // Escape quotes
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
              link.setAttribute('download', `product-data-${new Date().toISOString().slice(0,10)}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              toast.success("Product data exported to CSV");
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Available in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Products per Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pageSize}</div>
              <p className="text-xs text-muted-foreground">
                Showing {Math.min(pageSize, filteredProducts.length)} products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPage} of {totalPages}</div>
              <p className="text-xs text-muted-foreground">
                Navigate using pagination below
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Products</CardTitle>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or description..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading products...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isErrorProducts ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-red-500">
                        Error loading products. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{product.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {product.description || <span className="text-muted-foreground text-sm">No description</span>}
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
                                handleEdit(product);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteIntent(product);
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
                      <TableCell colSpan={4} className="h-24 text-center">
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {totalElements} products
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Products per page</p>
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

                <Pagination>
                  <PaginationContent>
                    {/* Previous page button */}
                    <PaginationItem>
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
                    </PaginationItem>

                    {/* Page number buttons */}
                    {generatePaginationItems()}

                    {/* Next page button */}
                    <PaginationItem>
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
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProductForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        product={currentProduct}
        mode={formMode}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product <strong>{currentProduct?.name}</strong>.
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

      {/* Product Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary" />
              Product Details
            </DialogTitle>
            <DialogDescription>
              {selectedProductDetails?.id ? 
                `Product ID: ${selectedProductDetails.id}` : 
                'Loading product details...'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelectedProduct ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading product details...</span>
            </div>
          ) : isErrorSelectedProduct ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-medium">Failed to load product details</h3>
              <p>There was an error loading the product information.</p>
            </div>
          ) : selectedProductDetails ? (
            <>
              <div className="grid gap-4 grid-cols-1 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Product Name</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{selectedProductDetails.name}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg">
                      {selectedProductDetails.description || <span className="text-muted-foreground text-sm">No description</span>}
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
            {selectedProductDetails && (
              <Button 
                onClick={() => {
                  setIsDialogOpen(false);
                  handleEdit(selectedProductDetails);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;