import React, { useState, useEffect, useCallback } from 'react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { User, UserPlus, Edit, Trash2, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import UserForm, { User as UserType } from '@/components/UserForm';
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
import { userApi } from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const queryClient = useQueryClient();

  // Fetch total count of users first
  const { data: totalCount, isLoading: countLoading } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      try {
        console.log('Fetching total user count from /users/count endpoint');
        const countResponse = await userApi.getTotalCount();
        const count = countResponse.data;
        
        // The count endpoint might return the value directly or in a property
        const totalItems = typeof count === 'number' ? count : 
                          (count.count !== undefined ? count.count : 
                          (count.total !== undefined ? count.total : 0));
        
        console.log(`Total users from count endpoint: ${totalItems}`);
        
        // Update state with the accurate total
        setTotalElements(totalItems);
        
        // Calculate total pages based on accurate count
        const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        setTotalPages(calculatedTotalPages);
        
        return totalItems;
      } catch (error) {
        console.error('Error fetching total user count:', error);
        // Don't throw here - we want to continue with the users query even if count fails
        return 0;
      }
    },
    // This query should run whenever page size changes
    refetchOnWindowFocus: false
  });
  
  // Fetch paginated users
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', currentPage, pageSize],
    queryFn: async () => {
      try {
        // When sending to API, we convert from UI page (1-based) to API page (0-based)
        const apiPage = currentPage - 1;
        
        console.log(`Fetching users for UI page ${currentPage} (API page ${apiPage}), size ${pageSize}`);
        const response = await userApi.getAll(apiPage, pageSize);
        
        // Extract the data properly depending on the API response structure
        const responseData = response.data;
        
        console.log('API Response for paginated users:', responseData);
        
        // Return the content array from the paginated response
        return responseData.content || responseData;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    // This query depends on currentPage and pageSize
    enabled: !countLoading, // Only fetch users once we have the total count
    refetchOnWindowFocus: false
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    // Ensure we don't go beyond bounds
    const boundedPage = Math.max(1, Math.min(newPage, totalPages));
    
    console.log(`Page change request: ${newPage} → ${boundedPage} (Total: ${totalPages})`);
    
    // Only update if actually changing pages
    if (boundedPage !== currentPage) {
      console.log(`Setting page to ${boundedPage}`);
      setCurrentPage(boundedPage);
    } else {
      console.log(`Already on page ${currentPage}, no change needed`);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    // Calculate which item should stay visible after page size change
    const firstItemIndex = (currentPage - 1) * pageSize;
    
    // Calculate new page number to keep the user viewing the same data as close as possible
    // Add 1 because UI is 1-based
    const newPage = Math.floor(firstItemIndex / newSize) + 1;
    
    // Ensure we never set page below 1 (minimum page number for UI)
    const safeNewPage = Math.max(1, newPage);
    
    // Recalculate total pages with the new page size
    const newTotalPages = Math.max(1, Math.ceil(totalElements / newSize));
    
    console.log('Page size change:', {
      from: { pageSize, currentPage, firstItemIndex, totalPages },
      to: { pageSize: newSize, newPage: safeNewPage, newTotalPages }
    });
    
    // Update state in the correct order
    setPageSize(newSize);
    setTotalPages(newTotalPages);
    
    // Make sure we don't go beyond the new total pages
    const boundedPage = Math.min(safeNewPage, newTotalPages);
    setCurrentPage(boundedPage);
  };

  // Make sure users is always an array
  const users = React.useMemo(() => {
    // Check if data is already an array
    if (Array.isArray(data)) return data;
    
    // Check if data is an object with a content array
    if (data && Array.isArray(data.content)) return data.content;
    
    // Default to empty array
    return [];
  }, [data]);

  // Create user mutation with explicit config to prevent duplicate handlers/notifications
  const createUserMutation = useMutation({
    mutationFn: (userData: UserType) => userApi.create(userData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Update user mutation with explicit config to prevent duplicate handlers/notifications
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: number, userData: UserType }) => 
      userApi.update(id, userData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Delete user mutation with explicit config to prevent duplicate handlers/notifications
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentUser(undefined);
    setFormOpen(true);
  };

  const handleEdit = (user: UserType) => {
    setFormMode('edit');
    setCurrentUser(user);
    setFormOpen(true);
  };

  const handleDeleteIntent = (user: UserType) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentUser && currentUser.id) {
      deleteUserMutation.mutate(currentUser.id, {
        onSuccess: () => {
          toast.success(`User ${currentUser.name} has been deleted`);
          setDeleteDialogOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['users-count'] });
          
          // Check if we need to update pagination after deleting a user
          if (users.length === 1 && currentPage > 1) {
            // We're on the last page and deleting the last item, go to previous page
            handlePageChange(currentPage - 1);
          } else if (totalElements > 0) {
            // Recalculate total pages
            const newTotalPages = Math.max(1, Math.ceil((totalElements - 1) / pageSize));
            setTotalPages(newTotalPages);
          }
        },
        onError: (error) => {
          toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const handleFormSubmit = (user: UserType) => {
    if (formMode === 'create') {
      // For create, we need to send email, password, name, phone, cin, and address
      // Role is intentionally omitted as it's not accepted by the API
      const createData = {
        email: user.email,
        password: user.password,
        name: user.name,
        phone: user.phone,
        cin: user.cin,
        address: user.address
      };

      // Set loading state if needed
      // setCreating(true);

      createUserMutation.mutate(createData as UserType, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for user creation should be triggered
          // Do not add additional toast.success calls anywhere else to avoid duplicate notifications
          toast.success(`User ${user.name} has been created`);
          setFormOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['users-count'] });
          
          // Handle pagination update after adding a user
          if (totalPages === currentPage && (users.length + 1) > pageSize) {
            // We might need to add a new page
            setTotalPages(prev => Math.max(1, Math.ceil((totalElements + 1) / pageSize)));
          }
        },
        onError: (error) => {
          toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        // The mutation will only use the callbacks defined here
        onSettled: () => {
          // setCreating(false);
        }
      });
    } else if (user.id) {
      // For update, we can only modify name, phone, cin, and address
      // Role is intentionally omitted as it's not accepted by the API
      const updateData = {
        name: user.name,
        phone: user.phone,
        cin: user.cin,
        address: user.address
      };

      updateUserMutation.mutate({ id: user.id, userData: updateData as UserType }, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for user updates should be triggered
          // Do not add additional toast.success calls anywhere else to avoid duplicate notifications
          toast.success(`User ${user.name} has been updated`);
          setFormOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['users-count'] });
        },
        onError: (error) => {
          toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        // The mutation will only use the callbacks defined here
        onSettled: () => {
          // Any cleanup after update
        }
      });
    }
  };

  // Generate array of page numbers to display
  const generatePaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
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

  // Check if next/previous buttons should be disabled - these are separate from the render
  // to ensure we're not trying to compare stale values
  const canGoToPrevious = currentPage > 1;
  const canGoToNext = currentPage < totalPages;
  
  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Pagination state:', {
      currentPage,
      pageSize,
      totalPages,
      totalElements,
      canGoToPrevious,
      canGoToNext,
      itemCount: users.length
    });
  }, [currentPage, pageSize, totalPages, totalElements, canGoToPrevious, canGoToNext, users.length]);

  // Function to calculate total pages
  const calculateTotalPages = useCallback((totalItems: number, size: number) => {
    return Math.max(1, Math.ceil(totalItems / size));
  }, []);

  // Update effect to force totalPages recalculation when totalElements or pageSize changes
  useEffect(() => {
    const calculatedPages = calculateTotalPages(totalElements, pageSize);
    
    if (calculatedPages !== totalPages) {
      console.log(`Recalculating total pages: ${calculatedPages} (was ${totalPages})`);
      setTotalPages(calculatedPages);
      
      // If current page is now beyond the total, adjust it
      if (currentPage > calculatedPages && calculatedPages > 0) {
        console.log(`Current page ${currentPage} is beyond new total ${calculatedPages}, adjusting`);
        setCurrentPage(calculatedPages);
      }
    }
  }, [totalElements, pageSize, calculateTotalPages, currentPage, totalPages]);
  
  // Effect to force a hard-coded totalPages update if we have exactly one page worth of items
  useEffect(() => {
    if (users.length === pageSize && currentPage === 1) {
      // If we have exactly one page worth of items, assume there might be more
      console.log('Testing with forced second page because users.length === pageSize:', users.length);
      // This forces the UI to show a second page option
      setTotalPages(prev => Math.max(prev, 2));
    }
  }, [users.length, pageSize, currentPage]);

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage your application users from here
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
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
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead>CIN</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-red-500">
                        Error loading users. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">{user.address}</TableCell>
                        <TableCell>{user.cin}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'DEACTIVATED' 
                              ? 'bg-red-100 text-red-800' 
                              : user.role === 'ADMIN' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(user)}
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
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {totalElements} users
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
                  {/* First page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => currentPage > 1 ? handlePageChange(1) : null}
                    disabled={!canGoToPrevious}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">First page</span>
                    <span>«</span>
                  </Button>
                  
                  {/* Previous page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => currentPage > 1 ? handlePageChange(currentPage - 1) : null}
                    disabled={!canGoToPrevious}
                    className="h-8 w-8 p-0"
                    data-testid="pagination-prev"
                  >
                    <span className="sr-only">Previous page</span>
                    <span>‹</span>
                  </Button>
                  
                  {/* Page number buttons */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Calculate which page numbers to show
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // If near start, show 1-5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If near end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Show current and 2 on each side
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {/* Next page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Next button clicked, current:', currentPage, 'total:', totalPages);
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      } else {
                        console.log('Cannot go to next page - already at last page');
                      }
                    }}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 p-0"
                    data-testid="pagination-next"
                    aria-label="Next page"
                  >
                    <span>›</span>
                  </Button>
                  
                  {/* Last page button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Last button clicked, total:', totalPages);
                      if (currentPage < totalPages) {
                        handlePageChange(totalPages);
                      }
                    }}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Last page</span>
                    <span>»</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        user={currentUser}
        mode={formMode} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{currentUser?.name}</strong>.
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

export default UserManagement;