import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import CustomAlert from './components/CustomAlert';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoiceList from './pages/InvoiceList';
import InvoiceView from './pages/InvoiceView';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Set default base URL for axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [alertMessage, setAlertMessage] = useState('');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage('')} />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/verify-email" element={user && !user.emailVerified ? <VerifyEmail /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <InvoiceGenerator setAlertMessage={setAlertMessage} />
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <InvoiceList setAlertMessage={setAlertMessage} />
          </ProtectedRoute>
        } />
        <Route path="/invoices/:id" element={
          <ProtectedRoute>
            <InvoiceView setAlertMessage={setAlertMessage} />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings setAlertMessage={setAlertMessage} />
          </ProtectedRoute>
        } />
        
        {/* Fallback Routes */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;