import axios from 'axios';

// Define the base URL for the API
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
    return api.get(`/users`, { 
      params: { page: apiPage, size },
      // Add timeout to prevent hanging requests
      timeout: 10000
    });
  },
  
  // New method to get the total count of users for pagination
  getTotalCount: () => {
    return api.get('/users/count');
  },
  getById: (id: number) => api.get(`/users/${id}`),
  create: (userData: any) => api.post('/users', userData),
  update: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Warehouse API endpoints
export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id: number) => api.get(`/warehouses/${id}`),
  create: (warehouseData: any) => api.post('/warehouses', warehouseData),
  update: (id: number, warehouseData: any) => api.put(`/warehouses/${id}`, warehouseData),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

// Order API endpoints
export const orderApi = {
  getAll: (page = 1, size = 10) => {
    return api.get('/orders', {
      params: { page, size },
      timeout: 10000
    });
  },
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (orderData: any) => api.post('/orders', orderData),
  update: (id: number, orderData: any) => api.put(`/orders/${id}`, orderData),
  delete: (id: number) => api.delete(`/orders/${id}`),
  // Get total count of orders
  getTotalCount: () => api.get('/orders/count'),
};

// Shipment API endpoints
export const shipmentApi = {
  getAll: () => api.get('/shipments'),
  getById: (id: number) => api.get(`/shipments/${id}`),
  create: (shipmentData: any) => api.post('/shipments', shipmentData),
  update: (id: number, shipmentData: any) => api.put(`/shipments/${id}`, shipmentData),
  delete: (id: number) => api.delete(`/shipments/${id}`),
};

// Client API endpoints
export const clientApi = {
  getAll: () => api.get('/clients'),
  getById: (id: number) => api.get(`/clients/${id}`),
  create: (clientData: any) => api.post('/clients', clientData),
  update: (id: number, clientData: any) => api.put(`/clients/${id}`, clientData),
  delete: (id: number) => api.delete(`/clients/${id}`),
};

// Unit API endpoints
export const unitApi = {
  getAll: () => api.get('/units'),
  getById: (id: number) => api.get(`/units/${id}`),
  create: (unitData: { name: string, abbreviation: string }) => api.post('/units', unitData),
  update: (id: number, unitData: { name: string, abbreviation: string }) => api.put(`/units/${id}`, unitData),
  delete: (id: number) => api.delete(`/units/${id}`),
};

// Stock API endpoints
export const stockApi = {
  // Get all stocks with pagination
  getAll: (page = 1, size = 10) => {
    // API already expects 1-based pagination
    return api.get('/stocks', {
      params: { page, size },
      timeout: 10000
    });
  },
  // Get stocks by warehouse ID with pagination
  getByWarehouse: (warehouseId: number, page = 1, size = 10) => {
    // API already expects 1-based pagination
    return api.get('/stocks/by-warehouse', {
      params: { warehouseId, page, size },
      timeout: 10000
    });
  },
  // Get stocks by product ID with pagination
  getByProduct: (productId: number, page = 1, size = 10) => {
    // API already expects 1-based pagination
    return api.get('/stocks/by-product', {
      params: { productId, page, size },
      timeout: 10000
    });
  },
  // Get low stock count with a threshold
  getLowStockCount: (threshold = 10) => {
    return api.get('/stocks/low-stock/count', {
      params: { threshold },
      timeout: 5000
    });
  },
  // Get low stock items with pagination and threshold
  getLowStockItems: (threshold = 10, page = 1, size = 10) => {
    return api.get('/stocks/low-stock', {
      params: { threshold, page, size },
      timeout: 10000
    });
  },
// Advanced filtering with multiple criteria
  filter: (filterOptions: {
    productNames?: string[];
    warehouseIds?: number[];
    minQuantity?: number;
    maxQuantity?: number;
  }, page = 1, size = 10) => {
    // Clean up filter options to ensure only valid data is sent
    const cleanFilterOptions = {
      productNames: filterOptions.productNames?.filter(name => name.trim().length > 0),
      warehouseIds: filterOptions.warehouseIds?.filter(id => !isNaN(id)),
      minQuantity: filterOptions.minQuantity !== undefined && !isNaN(filterOptions.minQuantity) ? filterOptions.minQuantity : undefined,
      maxQuantity: filterOptions.maxQuantity !== undefined && !isNaN(filterOptions.maxQuantity) ? filterOptions.maxQuantity : undefined
    };
    
    // Remove undefined values and empty arrays before sending
    const finalFilterOptions = Object.fromEntries(
      Object.entries(cleanFilterOptions).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined;
      })
    );
    
    console.log('Sending filter request with options:', finalFilterOptions);
    
    return api.post('/stocks/filter', finalFilterOptions, {
      params: { page, size },
      timeout: 15000  // Increased timeout for complex queries
    });
  }
};

export default api;