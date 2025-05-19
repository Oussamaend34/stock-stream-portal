import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from '@tanstack/react-query';
import { clientApi, orderApi, unitApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Type definitions
interface CreateOrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
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
  abbreviation: string;
}

// Define the data structure for creating a new order
interface CreateOrderFormValues {
  orderReference: string;
  orderDate: Date;
  clientId: number;
  orderItems: {
    productId: number;
    unitId: number;
    quantity: number;
  }[];
}

// New client form values
interface CreateClientFormValues {
  name: string;
  email: string;
  phone: string;
}  // New unit form values
interface CreateUnitFormValues {
  name: string;
  abbreviation: string;
}

// Order form component
const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onClose, onSuccess }) => {
  // State for client search and selection
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientDTO | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isNewUnitDialogOpen, setIsNewUnitDialogOpen] = useState(false);
  
  // React Hook Form setup
  const form = useForm<CreateOrderFormValues>({
    defaultValues: {
      orderReference: `ORD-${new Date().getTime().toString().slice(-6)}`,
      orderDate: new Date(),
      clientId: 0,
      orderItems: [{ productId: 0, unitId: 0, quantity: 1 }]
    }
  });
  
  // Use field array for order items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "orderItems"
  });
  
  // Client form
  const clientForm = useForm<CreateClientFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });
  
  // Unit form
  const unitForm = useForm<CreateUnitFormValues>({
    defaultValues: {
      name: '',
      abbreviation: ''
    }
  });
  
  // Query to fetch clients
  const {
    data: clients,
    isLoading: isLoadingClients,
  } = useQuery<ClientDTO[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientApi.getAll();
      return response.data;
    }
  });
  
  // Query to fetch products
  const {
    data: products,
    isLoading: isLoadingProducts,
  } = useQuery<ProductDTO[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/v1/products');
      const data = await response.json();
      return data;
    }
  });
  
  // Query to fetch units
  const {
    data: units,
    isLoading: isLoadingUnits,
    refetch: refetchUnits
  } = useQuery<UnitDTO[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.getAll();
      return response.data;
    }
  });
  
  // Mutation to create a new order
  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderFormValues) => {
      // Convert the Date to ISO string for the API
      const payload = {
        ...data,
        orderDate: format(data.orderDate, 'yyyy-MM-dd')
      };
      return orderApi.create(payload);
    },
    onSuccess: () => {
      toast.success('Order created successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Mutation to create a new client
  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientFormValues) => {
      return clientApi.create(data);
    },
    onSuccess: (response) => {
      toast.success('Client created successfully');
      setSelectedClient(response.data);
      form.setValue('clientId', response.data.id);
      setIsNewClientDialogOpen(false);
      clientForm.reset();
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Mutation to create a new unit
  const createUnitMutation = useMutation({
    mutationFn: (data: CreateUnitFormValues) => {
      return unitApi.create(data);
    },
    onSuccess: (response) => {
      toast.success('Unit created successfully');
      setIsNewUnitDialogOpen(false);
      unitForm.reset();
      
      // Refetch units to update the dropdown
      refetchUnits();
    },
    onError: (error) => {
      toast.error(`Failed to create unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Filter clients based on search term
  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  ) || [];
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  ) || [];
  
  const onSubmit: SubmitHandler<CreateOrderFormValues> = (data) => {
    // Validate if a client is selected
    if (data.clientId === 0) {
      toast.error("Please select a client");
      return;
    }
    
    // Validate if order items are valid
    const invalidItems = data.orderItems.filter(item => 
      item.productId === 0 || item.unitId === 0 || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      toast.error("Please complete all order items with valid product, unit, and quantity");
      return;
    }
    
    // Submit the form
    createOrderMutation.mutate(data);
  };
  
  // Handle client selection
  const handleClientSelect = (client: ClientDTO) => {
    setSelectedClient(client);
    form.setValue('clientId', client.id);
  };
  
  // Handle new client submission
  const handleCreateClient: SubmitHandler<CreateClientFormValues> = (data) => {
    createClientMutation.mutate(data);
  };
  
  // Handle new unit submission
  const handleCreateUnit: SubmitHandler<CreateUnitFormValues> = (data) => {
    createUnitMutation.mutate(data);
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Reference */}
            <FormField
              control={form.control}
              name="orderReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ORD-12345" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this order
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Order Date */}
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Order Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Date when the order was placed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Client Selection */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <div className="flex space-x-2 items-start">
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedClient ? selectedClient.name : "Select client"}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search clients..."
                            className="h-9"
                            value={clientSearchTerm}
                            onValueChange={setClientSearchTerm}
                          />
                          {isLoadingClients ? (
                            <div className="py-6 text-center text-sm">Loading clients...</div>
                          ) : (
                            <CommandList>
                              <CommandEmpty>
                                No clients found. 
                                <Button
                                  variant="link" 
                                  className="px-2" 
                                  onClick={() => setIsNewClientDialogOpen(true)}
                                >
                                  Create a new client
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredClients.map((client) => (
                                  <CommandItem
                                    key={client.id}
                                    value={client.name}
                                    onSelect={() => handleClientSelect(client)}
                                  >
                                    <span>{client.name}</span>
                                    {client.email && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        ({client.email})
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsNewClientDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormDescription>
                  Select an existing client or create a new one
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base">Order Items</FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ productId: 0, unitId: 0, quantity: 1 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col space-y-2 p-4 border rounded-md relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      if (fields.length > 1) {
                        remove(index);
                      } else {
                        toast.error("Order must have at least one item");
                      }
                    }}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                  
                  <h4 className="font-medium">Item {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Selection */}
                    <FormField
                      control={form.control}
                      name={`orderItems.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value && products
                                    ? products.find(p => p.id === field.value)?.name || "Select product"
                                    : "Select product"}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search products..."
                                  className="h-9"
                                  value={productSearchTerm}
                                  onValueChange={setProductSearchTerm}
                                />
                                {isLoadingProducts ? (
                                  <div className="py-6 text-center text-sm">Loading products...</div>
                                ) : (
                                  <CommandList>
                                    <CommandEmpty>No products found.</CommandEmpty>
                                    <CommandGroup>
                                      {filteredProducts.map((product) => (
                                        <CommandItem
                                          key={product.id}
                                          value={product.name}
                                          onSelect={() => {
                                            form.setValue(`orderItems.${index}.productId`, product.id);
                                          }}
                                        >
                                          {product.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                )}
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Unit Selection */}
                    <FormField
                      control={form.control}
                      name={`orderItems.${index}.unitId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <div className="flex space-x-2">
                            <Select
                              value={parseInt(field.value) === 0 ? "" : field.value.toString()}
                              onValueChange={(value) => {
                                if (value === "new") {
                                  // Open the create unit dialog
                                  setIsNewUnitDialogOpen(true);
                                } else {
                                  form.setValue(`orderItems.${index}.unitId`, parseInt(value));
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingUnits ? (
                                  <div className="py-2 pl-2 text-sm">Loading...</div>
                                ) : units && units.length > 0 ? (
                                  units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                      {unit.name} ({unit.abbreviation})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="py-2 pl-2 text-sm">No units available</div>
                                )}
                                <SelectItem value="new">
                                  <span className="flex items-center">
                                    <Plus className="mr-2 h-3 w-3" />
                                    Create new unit
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsNewUnitDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Quantity Input */}
                    <FormField
                      control={form.control}
                      name={`orderItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>Create Order</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      
      {/* New Client Dialog */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleCreateClient)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* New Unit Dialog */}
      <Dialog open={isNewUnitDialogOpen} onOpenChange={setIsNewUnitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
            <DialogDescription>
              Add a new unit of measurement to the system.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...unitForm}>
            <form onSubmit={unitForm.handleSubmit(handleCreateUnit)} className="space-y-4">
              <FormField
                control={unitForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kilogram" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={unitForm.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createUnitMutation.isPending}
                >
                  {createUnitMutation.isPending ? 'Creating...' : 'Create Unit'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateOrderForm;
