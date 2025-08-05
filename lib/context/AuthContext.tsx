import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';

// Define user type
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
  googleId?: string;
  settings?: {
    sender?: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
    logoUrl?: string;
  };
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if user is logged in with NextAuth
        if (session && session.user) {
          // If we have a NextAuth session, use that
          if (session.customToken) {
            // Set the token in localStorage for compatibility with existing system
            localStorage.setItem('token', session.customToken as string);
            axios.defaults.headers.common['Authorization'] = `Bearer ${session.customToken}`;
          }
          
          // Get user profile from our API to ensure we have all user data
          const response = await axios.get('/api/auth/profile');
          setUser(response.data);
          setLoading(false);
          return;
        }
        
        // If no NextAuth session, check for JWT token
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user profile
        const response = await axios.get('/api/auth/profile');
        setUser(response.data);
      } catch (err) {
        // Clear token if invalid
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    // Only run checkAuth if session status is not loading
    if (status !== 'loading') {
      checkAuth();
    }
  }, [session, status]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post('/api/auth/register', { email, password });
      
      // Automatically login after registration
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  // Login with Google function
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use NextAuth signIn method with Google provider
      const result = await signIn('google', { callbackUrl: '/' });
      
      // Note: We don't need to manually set the user or token here
      // as the useEffect hook will handle that when the session changes
      
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    // Sign out from NextAuth
    signOut({ callbackUrl: '/login' });
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithGoogle, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};