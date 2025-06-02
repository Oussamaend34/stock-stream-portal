import axios from 'axios';
import axiosInstance from './axios';

// Define the base URL for the API - this is now just for reference since it's configured in axiosInstance
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User API endpoints
export const userApi = {
  getAll: (page = 0, size = 10) => {
    // UI uses 0-based index internally, but API needs 1-based
    const apiPage = page + 1;
    console.log(`API call: users?page=${apiPage}&size=${size}`);
    return axiosInstance.get(`/users`, { 
      params: { page: apiPage, size },
      timeout: 10000
    });
  },

  // New method to get the total count of users for pagination
  getTotalCount: () => {
    return axiosInstance.get('/users/count');
  },
  getById: (id: number) => axiosInstance.get(`/users/${id}`),
  create: (userData: any) => axiosInstance.post('/users', userData),
  update: (id: number, userData: any) => axiosInstance.put(`/users/${id}`, userData),
  delete: (id: number) => axiosInstance.delete(`/users/${id}`),
};

// Warehouse API endpoints
export const warehouseApi = {
  getAll: () => axiosInstance.get('/warehouses'),
  getById: (id: number) => axiosInstance.get(`/warehouses/${id}`),
  create: (warehouseData: any) => axiosInstance.post('/warehouses', warehouseData),
  update: (id: number, warehouseData: any) => axiosInstance.put(`/warehouses/${id}`, warehouseData),
  delete: (id: number) => axiosInstance.delete(`/warehouses/${id}`),
};

// Order API types
export interface OrderItemRequest {
  productId: number;
  unitId: number;
  quantity: number;
}

export interface OrderCreationRequest {
  orderReference: string;
  orderDate: string; // ISO date string format
  clientId: number;
  orderItems: OrderItemRequest[];
}

// Order API endpoints
export const orderApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/orders?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/orders/${id}`),
  create: (orderData: OrderCreationRequest) => axiosInstance.post('/orders', orderData),
  update: (id: number, orderData: any) => axiosInstance.put(`/orders/${id}`, orderData),
  delete: (id: number) => axiosInstance.delete(`/orders/${id}`),
  // Get total count of orders
  getTotalCount: () => axiosInstance.get('/orders/count'),
};

// Purchase API types
export interface TransactionDetailsDTO {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unit: string;
  quantity: number;
  purchaseId: number;
}

export interface PurchaseDTO {
  id: number;
  purchaseReference: string;
  supplierName: string;
  purchaseDate: string; // ISO date string format
  purchaseItems: TransactionDetailsDTO[];
}

export interface PurchaseItemCreationRequest {
  productId: number;
  unitId: number;
  quantity: number;
}

export interface PurchaseCreationRequest {
  purchaseReference: string;
  purchaseDate: string; // ISO date string format
  supplierId: number;
  purchaseItems: PurchaseItemCreationRequest[];
}

export interface Container<T> {
  count: number;
  items: T[];
}

// For backward compatibility and type safety
export type PurchasesContainer = Container<PurchaseDTO>;

// Purchase API endpoints
export const purchaseApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/purchases?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/purchases/${id}`),
  create: (purchaseData: PurchaseCreationRequest) => axiosInstance.post('/purchases', purchaseData),
  update: (id: number, purchaseData: any) => axiosInstance.put(`/purchases/${id}`, purchaseData),
  delete: (id: number) => axiosInstance.delete(`/purchases/${id}`),
  // Get total count of purchases
  getTotalCount: () => axiosInstance.get('/purchases/count'),
};

// Shipment API types
export interface ShipmentDTO {
  id: number;
  shipmentDate: string; // ISO date string format
  quantity: number;
  product: string;
  unit: string;
  warehouse: string;
  remarks: string;
  orderReference: string | null;
  clientName: string | null;
}

// Shipment Creation Request type
export interface ShipmentCreationRequest {
  shipmentDate: string; // ISO date string format
  productId: number;
  unitId: number;
  warehouseId: number;
  orderId?: number | null; // Optional as per requirements
  remarks: string;
  quantity: number;
}

// For type safety
export type ShipmentsContainer = Container<ShipmentDTO>;

// Shipment API endpoints
export const shipmentApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/shipments?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/shipments/${id}`),
  create: (shipmentData: ShipmentCreationRequest) => axiosInstance.post('/shipments', shipmentData),
  update: (id: number, shipmentData: any) => axiosInstance.put(`/shipments/${id}`, shipmentData),
  delete: (id: number) => axiosInstance.delete(`/shipments/${id}`),
};

// Reception API types
export interface ReceptionDTO {
  id: number;
  receptionDate: string; // ISO date string format
  quantity: number;
  product: string;
  unit: string;
  warehouse: string;
  remarks: string;
  purchaseReference: string;
  supplierName: string;
}

// Reception Creation Request type
export interface ReceptionCreationRequest {
  receptionDate: string; // ISO date string format
  productId: number;
  unitId: number;
  warehouseId: number;
  purchaseId?: number | null; // Optional as per requirements
  remarks: string;
  quantity: number;
}

// For type safety
export type ReceptionsContainer = Container<ReceptionDTO>;

// Reception API endpoints
export const receptionApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/receptions?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/receptions/${id}`),
  create: (receptionData: ReceptionCreationRequest) => axiosInstance.post('/receptions', receptionData),
  update: (id: number, receptionData: any) => axiosInstance.put(`/receptions/${id}`, receptionData),
  delete: (id: number) => axiosInstance.delete(`/receptions/${id}`),
};

// Client API types
import { Client } from '@/components/ClientForm';

// For type safety
export type ClientsContainer = Container<Client>;

// Client API endpoints
export const clientApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/clients?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/clients/${id}`),
  create: (clientData: any) => axiosInstance.post('/clients', clientData),
  update: (id: number, clientData: any) => axiosInstance.put(`/clients/${id}`, clientData),
  delete: (id: number) => axiosInstance.delete(`/clients/${id}`),
  search: (name: string, page = 1, size = 3) => axiosInstance.get('/clients/search', {
    params: { name, page, size },
    timeout: 10000
  }),
};

// Supplier API types
import { Supplier } from '@/components/SupplierForm';

// For type safety
export type SuppliersContainer = Container<Supplier>;

// Supplier API endpoints
export const supplierApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/suppliers?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/suppliers/${id}`),
  create: (supplierData: any) => axiosInstance.post('/suppliers', supplierData),
  update: (id: number, supplierData: any) => axiosInstance.put(`/suppliers/${id}`, supplierData),
  delete: (id: number) => axiosInstance.delete(`/suppliers/${id}`),
  search: (name: string, page = 1, size = 3) => axiosInstance.get('/suppliers/search', {
    params: { name, page, size },
    timeout: 10000
  }),
};

// Unit API types
export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

// Unit API endpoints
export const unitApi = {
  getAll: async () => {
    const response = await axiosInstance.get<Unit[]>('/units');
    return response;
  },

  create: async (name: string, abbreviation: string) => {
    const params = new URLSearchParams();
    params.append('unit', name);
    params.append('abbreviation', abbreviation);
    const response = await axiosInstance.post<Unit>('/units', null, { params });
    return response;
  },

  update: async (id: number, name: string, abbreviation: string) => {
    const params = new URLSearchParams();
    params.append('unit', name);
    params.append('abbreviation', abbreviation);
    const response = await axiosInstance.put<Unit>(`/units/${id}`, null, { params });
    return response;
  }
};

// Stock API types
export interface StockFilterRequest {
  productNames: string[];
  warehouseIds: number[];
  minQuantity: number | null;
  maxQuantity: number | null;
}

// Stock API endpoints
export const stockApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/stocks?page=${page}&size=${size}`),
  getByWarehouse: (warehouseId: number, page = 1, size = 10) => axiosInstance.get('/stocks/by-warehouse', {
    params: { warehouseId, page, size },
    timeout: 10000
  }),
  getByProduct: (productId: number, page = 1, size = 10) => axiosInstance.get('/stocks/by-product', {
    params: { productId, page, size },
    timeout: 10000
  }),
  getLowStockCount: (threshold = 10) => axiosInstance.get('/stocks/low-stock/count', {
    params: { threshold },
    timeout: 5000
  }),
  getLowStockItems: (threshold = 10, page = 1, size = 10) => axiosInstance.get('/stocks/low-stock', {
    params: { threshold, page, size },
    timeout: 10000
  }),
  filter: (filter: StockFilterRequest) => axiosInstance.post('/stocks/filter', filter)
};

// Product API types
export interface Product {
  id: number;
  name: string;
  description?: string;
  // Add other product fields as needed
}

// Product API endpoints
export const productApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/products?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/products/${id}`),
  search: (query: string, page = 1, size = 3) => axiosInstance.get('/products/search', {
    params: { name: query, page, size },
    timeout: 10000
  }),
  create: (productData: { name: string, description: string }) => axiosInstance.post('/products', null, {
    params: productData
  }),
  update: (id: number, productData: { name: string, description: string }) => axiosInstance.put(`/products/${id}`, productData),
  delete: (id: number) => axiosInstance.delete(`/products/${id}`),
};

// Transfer API types
export interface TransferDTO {
  id: number;
  transferDate: string; // ISO date string format
  product: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  unit: string;
  quantity: number;
  remarks: string;
}

// Transfer Creation Request type
export interface TransferRequest {
  productId: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  unitId: number;
  quantity: number;
  transferDate: string; // ISO date string format
  remarks: string;
}

// For type safety
export type TransfersContainer = Container<TransferDTO>;

// Transfer API endpoints
export const transferApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/transfers?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/transfers/${id}`),
  create: (transferData: TransferRequest) => axiosInstance.post('/transfers', transferData),
  update: (id: number, transferData: TransferRequest) => axiosInstance.put(`/transfers/${id}`, transferData),
  delete: (id: number) => axiosInstance.delete(`/transfers/${id}`),
};

export default api;

// Add these to your existing api.ts file

export interface InventoryCreationRequest {
  InventoryDate: string;
  warehouse: string;
  file: any;
}

// Add this interface to match the backend response
export interface InventoryCreationResponse {
  inventory: {
    id: number;
    inventoryDate: string;
    warehouse: string;
    doneBy: {
      id: number;
      email: string;
      name: string;
      phone: string;
      address: string;
      cin: string;
      role: string;
    };
    validatedBy: null | any;
    createdAt: string;
    status: string;
  };
  file: any;
}

export interface InventoryDTO {
  id: number;
  inventoryDate: string;
  warehouse: string;
  doneBy: {
    id: number;
    name: string;
  };
  validatedBy: {
    id: number;
    name: string;
  } | null;
  status: 'CREATED' | 'VALIDATED' | 'CANCELLED';
  createdAt: string;
}

export interface InventoryLineDTO {
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
}

// Single definition of inventoryApi with all methods
export const inventoryApi = {
  getAll: (page = 1, size = 10) => axiosInstance.get(`/inventories?page=${page}&size=${size}`),
  getById: (id: number) => axiosInstance.get(`/inventories/${id}`),
  create: (data: InventoryCreationRequest) => axiosInstance.post('/inventories', data, {
    responseType: 'arraybuffer',
    headers: {
      'Accept': 'application/octet-stream'
    }
  }),
  processFile: (inventoryId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/inventories/uploadFile/${inventoryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  validate: (id: number) => axiosInstance.put(`/inventories/validateInventory/${id}`),
  getLines: (id: number) => axiosInstance.get(`/inventories/${id}/lines`),
  delete: (id: number) => axiosInstance.delete(`/inventories/deleteInventory/${id}`),
  uploadFile: (inventoryId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/inventories/uploadFile/${inventoryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
};

export interface LogisticDailyStat {
  date: string;
  nb_shipments: number;
  nb_transfers: number;
  nb_receptions: number;
}

export interface DailyStat {
  date: string;
  nbr_orders: number;
  nbr_purchases: number;
}

export interface StatisticsDTO {
  userCount: number;
  clientCount: number;
  supplierCount: number;
  warehouseCount: number;
}

// Dashboard API endpoints
export const dashboardApi = {
  getLogisticsStats: () => axiosInstance.get<LogisticDailyStat[]>('/dashboard/logistics'),
  getWeeklyOrdersAndPurchases: () => axiosInstance.get<DailyStat[]>('/dashboard/weekly-orders-purchases'),
  getStatistics: () => axiosInstance.get<StatisticsDTO>('/dashboard/statistics'),
};


