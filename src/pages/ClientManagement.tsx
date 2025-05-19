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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { UserCircle, Edit, Trash2, MoreHorizontal, Search, Plus, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import ClientForm, { Client } from '@/components/ClientForm';
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
import { clientApi } from '@/lib/api';

const ClientManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientApi.getAll();
      return response.data;
    }
  });

  // Create client mutation - without global success handlers to avoid duplicate notifications
  const createClientMutation = useMutation({
    mutationFn: (clientData: Client) => clientApi.create(clientData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Update client mutation - without global success handlers to avoid duplicate notifications
  const updateClientMutation = useMutation({
    mutationFn: ({ id, clientData }: { id: number, clientData: Client }) => 
      clientApi.update(id, clientData),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  // Delete client mutation - without global success handlers to avoid duplicate notifications
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => clientApi.delete(id),
    meta: {
      // Add a meta tag to indicate this mutation should only show notifications in its specific handler
      notificationsHandledInCallback: true
    }
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentClient(undefined);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setFormMode('edit');
    setCurrentClient(client);
    setFormOpen(true);
  };

  const handleDeleteIntent = (client: Client) => {
    setCurrentClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentClient && currentClient.id) {
      deleteClientMutation.mutate(currentClient.id, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for client deletion should be triggered
          toast.success(`Client ${currentClient.name} has been deleted`);
          setDeleteDialogOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (error) => {
          toast.error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after deletion
        }
      });
    }
  };

  const handleFormSubmit = (client: Client) => {
    if (formMode === 'create') {
      createClientMutation.mutate(client, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for client creation should be triggered
          toast.success(`Client ${client.name} has been created`);
          setFormOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (error) => {
          toast.error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after creation
        }
      });
    } else if (client.id) {
      updateClientMutation.mutate({ id: client.id, clientData: client }, {
        onSuccess: () => {
          // IMPORTANT: This is the ONLY place where toast notifications for client updates should be triggered
          toast.success(`Client ${client.name} has been updated`);
          setFormOpen(false);
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (error) => {
          toast.error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        // This is crucial - it ensures no other handlers will run
        onSettled: () => {
          // Any cleanup after update
        }
      });
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
            <p className="text-muted-foreground">
              Manage your customer base and client information
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Clients</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email, phone or address..."
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
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading clients...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-red-500">
                        Error loading clients. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle size={16} className="text-blue-600" />
                            <span>{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            <span>{client.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            <span>{client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span className="truncate max-w-[200px]">{client.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(client)}
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        No clients found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        client={currentClient}
        mode={formMode} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client <strong>{currentClient?.name}</strong>.
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

export default ClientManagement;
