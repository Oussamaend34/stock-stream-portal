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
} from '@/components/ui/card';
import { 
  Search, 
  Loader2, 
  ClipboardList,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
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
import { inventoryApi } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import InventoryForm from '@/components/InventoryForm';
import { InventoryDetailsDialog } from '@/components/InventoryDetailsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interfaces
interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  cin: string;
  role: string;
}

interface InventoryDTO {
  id: number;
  inventoryDate: string;
  warehouse: string;
  doneBy: User;
  validatedBy: User | null;
  createdAt: string;
  status: 'CREATED' | 'VALIDATED' | 'CANCELLED';
}

interface InventoryCreationRequest {
  InventoryDate: string;
  warehouse: string;
}

interface InventoryFormData {
  InventoryDate: string;
  warehouse: string;
}

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryDTO | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch inventories with pagination
  const { 
    data: inventories, 
    isLoading, 
    isError,
    error
  } = useQuery<InventoryDTO[]>({
    queryKey: ['inventories', currentPage, pageSize],
    queryFn: async () => {
      const response = await inventoryApi.getAll(currentPage, pageSize);
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Handle success and error states
  useEffect(() => {
    if (inventories) {
      setTotalElements(inventories.length);
      setTotalPages(Math.ceil(inventories.length / pageSize));
    }
  }, [inventories, pageSize]);

  useEffect(() => {
    if (isError && error) {
      toast.error(`Failed to fetch inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isError, error]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const boundedPage = Math.max(1, Math.min(newPage, totalPages));
    if (boundedPage !== currentPage) {
      setCurrentPage(boundedPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    const firstItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(firstItemIndex / newSize) + 1;
    const safeNewPage = Math.max(1, newPage);
    const newTotalPages = Math.max(1, Math.ceil(totalElements / newSize));
    
    setPageSize(newSize);
    setTotalPages(newTotalPages);
    setCurrentPage(Math.min(safeNewPage, newTotalPages));
  };

  // Filter inventories based on search term
  const filteredInventories = useMemo(() => {
    if (!inventories) {
      return [];
    }

    return inventories.filter(inventory =>
      inventory.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.doneBy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventories, searchTerm]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Add this mutation
  const queryClient = useQueryClient();

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InventoryCreationRequest) => {
      try {
        const response = await inventoryApi.create(data);
        
        // Create a blob from the array buffer
        const blob = new Blob([response.data], { 
          type: 'application/octet-stream'  // Match backend content type
        });
        
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'inventory.xlsx';
        
        if (contentDisposition) {
          const filenameMatch = /filename=(.*\.xlsx)/.exec(contentDisposition);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);

        // Show success message
        toast.success('Inventory created successfully');
        
        // Refresh the inventory list
        queryClient.invalidateQueries({ queryKey: ['inventories'] });
        
        return response.data;
      } catch (error) {
        console.error('Error creating inventory:', error);
        toast.error('Failed to create inventory');
        throw error;
      }
    },
    onSuccess: () => {
      setIsFormOpen(false);
    }
  });

  // Add this handler
  const handleCreateInventory = (data: InventoryFormData) => {
    createInventoryMutation.mutate({
      InventoryDate: data.InventoryDate,
      warehouse: data.warehouse
    });
  };

  // Add this handler
  const handleViewDetails = (inventory: InventoryDTO) => {
    setSelectedInventory(inventory);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Management</CardTitle>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="ml-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </div>
          <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by warehouse or done by..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Inventory Date</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Done By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validated By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventories.map((inventory) => (
                      <TableRow 
                        key={inventory.id}
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleViewDetails(inventory)}
                      >
                        <TableCell>{inventory.id}</TableCell>
                        <TableCell>{inventory.warehouse}</TableCell>
                        <TableCell>{formatDate(inventory.inventoryDate)}</TableCell>
                        <TableCell>{formatDate(inventory.createdAt)}</TableCell>
                        <TableCell>{inventory.doneBy.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inventory.status === 'VALIDATED' 
                              ? 'bg-green-100 text-green-800'
                              : inventory.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inventory.status}
                          </span>
                        </TableCell>
                        <TableCell>{inventory.validatedBy?.name || '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(inventory)}>
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredInventories.length} of {totalElements} items
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">Items per page</p>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 30, 40, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                      </PaginationItem>
                    )}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <InventoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateInventory}
        isLoading={createInventoryMutation.isPending}
      />
      <InventoryDetailsDialog
        inventory={selectedInventory}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedInventory(null);
        }}
      />
    </div>
  );
};

export default InventoryManagement; 