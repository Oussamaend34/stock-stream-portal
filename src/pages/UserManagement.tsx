
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
import { User, UserPlus, Edit, Trash2, MoreHorizontal, Search } from 'lucide-react';
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

// Mock data
const initialUsers: UserType[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
  { id: 2, username: 'manager1', email: 'manager1@example.com', name: 'John Manager', role: 'MANAGER' },
  { id: 3, username: 'user1', email: 'user1@example.com', name: 'Sarah User', role: 'USER' },
  { id: 4, username: 'warehouse1', email: 'warehouse1@example.com', name: 'Mike Warehouse', role: 'USER' },
  { id: 5, username: 'support1', email: 'support1@example.com', name: 'Lisa Support', role: 'USER' },
];

const UserManagement = () => {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    if (currentUser) {
      setUsers(users.filter(u => u.id !== currentUser.id));
      toast.success(`User ${currentUser.name} has been deleted`);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = (user: UserType) => {
    if (formMode === 'create') {
      // Simulate backend assigning an ID
      const newUser = { ...user, id: Math.max(...users.map(u => u.id || 0)) + 1 };
      setUsers([...users, newUser]);
      toast.success(`User ${user.name} has been created`);
    } else {
      // Update existing user
      setUsers(users.map(u => u.id === user.id ? user : u));
      toast.success(`User ${user.name} has been updated`);
    }
    setFormOpen(false);
  };

  return (
    <Layout>
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
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : user.role === 'MANAGER' 
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </Layout>
  );
};

export default UserManagement;
