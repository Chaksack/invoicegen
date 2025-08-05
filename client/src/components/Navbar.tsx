import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-blue-800">Invoice App</Link>
          
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation buttons */}
              <Link 
                to="/" 
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Generator
              </Link>
              
              <Link 
                to="/invoices" 
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/invoices') 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Invoices
              </Link>
              
              <Link 
                to="/settings" 
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/settings') 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Settings
              </Link>
              
              <button 
                onClick={logout} 
                className="py-2 px-3 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition duration-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;