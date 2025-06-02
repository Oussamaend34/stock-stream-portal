import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for CORS with credentials
});

// Add a request interceptor to add the token to every request except auth
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't add token for auth endpoints
    if (config.url?.includes('/auth')) {
      return config;
    }

    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token is found and we're not on the auth endpoint, redirect to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401: // Unauthorized
          // Only clear token and redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
          }
          break;
        case 403: // Forbidden
          console.error('Access forbidden');
          break;
        case 404: // Not found
          console.error('Resource not found');
          break;
        case 500: // Server error
          console.error('Server error');
          break;
        default:
          console.error('An error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error in request configuration
      console.error('Error in request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 