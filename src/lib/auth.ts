import axiosInstance from './axios';

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  cin: string;
  role: string;
}

export interface AuthenticationResponse {
  accessToken: string;
  userDTO: UserDTO;
}

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export const authService = {
  login: async (credentials: AuthenticationRequest): Promise<AuthenticationResponse> => {
    try {
      const response = await axiosInstance.post<AuthenticationResponse>(
        '/auth/login',
        credentials
      );

      if (!response.data.accessToken) {
        throw new Error('No access token received');
      }

      // Store the token and user data
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.accessToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.userDTO));

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    // Clear stored data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Redirect to login page
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  getUserData: (): UserDTO | null => {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);

    // If we have a token but no user data, or vice versa, something is wrong
    // Clear both and force re-login
    if ((!token && userData) || (token && !userData)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return;
    }

    // If we have both token and user data, we're good to go
    if (token && userData) {
      return;
    }

    // If we have neither token nor user data and we're not on the login page,
    // redirect to login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  },

  // Add a method to get the full authorization header
  getAuthHeader: (): { Authorization: string } | undefined => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }
}; 