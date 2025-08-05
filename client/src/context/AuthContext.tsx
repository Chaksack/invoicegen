import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  settings: {
    sender: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
    logoUrl: string;
  };
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Set auth token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
          
          // Verify token is still valid by making a request to the profile endpoint
          const response = await axios.get('/api/auth/profile');
          
          if (response.data.success) {
            setUser(userData);
          } else {
            // If token is invalid, clear localStorage
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register user
  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', {
        email,
        password
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Set auth token for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Set auth token for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    
    // Remove auth token from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send password reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;