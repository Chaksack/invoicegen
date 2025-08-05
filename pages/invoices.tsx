import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../lib/context/AuthContext';

// Define types
interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  recipient: {
    name: string;
  };
  total: number;
  currency: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const InvoiceList: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Load invoices
  useEffect(() => {
    if (!loading && user) {
      loadInvoices(1);
    }
  }, [loading, user]);
  
  const loadInvoices = async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.get(`/api/invoices?page=${page}&limit=10`);
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    loadInvoices(page);
  };
  
  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };
  
  const cancelDelete = () => {
    setDeleteId(null);
  };
  
  const deleteInvoice = async () => {
    if (!deleteId) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.delete(`/api/invoices/${deleteId}`);
      
      if (response.data.success) {
        setSuccess('Invoice deleted successfully');
        setDeleteId(null);
        
        // Reload invoices
        loadInvoices(pagination.page);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  return (
    <>
      <Head>
        <title>Invoices | Invoice Generator</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Your Invoices</h1>
              <Link href="/invoice-generator" className="btn btn-primary">
                Create New Invoice
              </Link>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            {deleteId && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
                <p className="mb-2">Are you sure you want to delete this invoice? This action cannot be undone.</p>
                <div className="flex space-x-2">
                  <button
                    className="btn btn-danger"
                    onClick={deleteInvoice}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={cancelDelete}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">Invoice #</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Client</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map(invoice => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {invoice.invoiceNumber || <span className="text-gray-400">No number</span>}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.recipient.name}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center space-x-2">
                            <Link 
                              href={`/invoice/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>
                            <Link 
                              href={`/invoice-generator?id=${invoice.id}`}
                              className="text-green-600 hover:text-green-800"
                            >
                              Edit
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => confirmDelete(invoice.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {isLoading ? (
                          'Loading invoices...'
                        ) : (
                          <>
                            No invoices found. 
                            <Link href="/invoice-generator" className="text-primary-600 hover:text-primary-800 ml-1">
                              Create your first invoice
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-l-md border ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border-t border-b ${
                        pagination.page === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 rounded-r-md border ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceList;