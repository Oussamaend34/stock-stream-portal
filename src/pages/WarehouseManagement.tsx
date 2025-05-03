
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Warehouse as WarehouseIcon, Edit, Trash2, MoreHorizontal, Search, Plus } from 'lucide-react';
import WarehouseForm, { Warehouse } from '@/components/WarehouseForm';
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

// Mock data
const initialWarehouses: Warehouse[] = [
  { id: 1, name: 'Central Warehouse', location: 'New York', capacity: 10000, description: 'Main distribution center for the East coast' },
  { id: 2, name: 'West Depot', location: 'Los Angeles', capacity: 8500, description: 'Distribution center for West coast operations' },
  { id: 3, name: 'North Storage', location: 'Chicago', capacity: 5000, description: 'Storage facility for overflow inventory' },
  { id: 4, name: 'South Facility', location: 'Miami', capacity: 6500, description: 'Import/export facility for international shipments' },
];

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const filteredWarehouses = warehouses.filter(warehouse => 
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormMode('create');
    setCurrentWarehouse(undefined);
    setFormOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormMode('edit');
    setCurrentWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDeleteIntent = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (currentWarehouse) {
      setWarehouses(warehouses.filter(w => w.id !== currentWarehouse.id));
      toast.success(`Warehouse ${currentWarehouse.name} has been deleted`);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = (warehouse: Warehouse) => {
    if (formMode === 'create') {
      // Simulate backend assigning an ID
      const newWarehouse = { ...warehouse, id: Math.max(...warehouses.map(w => w.id || 0)) + 1 };
      setWarehouses([...warehouses, newWarehouse]);
      toast.success(`Warehouse ${warehouse.name} has been created`);
    } else {
      // Update existing warehouse
      setWarehouses(warehouses.map(w => w.id === warehouse.id ? warehouse : w));
      toast.success(`Warehouse ${warehouse.name} has been updated`);
    }
    setFormOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
            <p className="text-muted-foreground">
              Manage all your warehouse facilities
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-warehouse-600 hover:bg-warehouse-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Warehouses</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search warehouses..."
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
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.length > 0 ? (
                    filteredWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WarehouseIcon size={16} className="text-warehouse-600" />
                            <span>{warehouse.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{warehouse.location}</TableCell>
                        <TableCell>{warehouse.capacity.toLocaleString()} units</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {warehouse.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntent(warehouse)}
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
                        No warehouses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <WarehouseForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleFormSubmit} 
        warehouse={currentWarehouse}
        mode={formMode} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the warehouse <strong>{currentWarehouse?.name}</strong>.
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

export default WarehouseManagement;
