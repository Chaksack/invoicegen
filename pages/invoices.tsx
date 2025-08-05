import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../lib/context/AuthContext';

// Read-only invoice view component
const ReadOnlyInvoice = ({ invoice, onEdit, onDelete }) => {
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b pb-6">
        <div className="flex items-center mb-4 md:mb-0">
          {invoice.logoUrl ? (
            <img src={invoice.logoUrl} alt="Company Logo" className="max-h-16 h-auto object-contain mr-4 rounded-lg shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg mr-4">
              <span className="text-xs text-gray-500 text-center">No Logo</span>
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">INVOICE</h2>
        </div>
        <div className="flex flex-col items-end text-sm">
          <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</span> {invoice.invoiceNumber || 'N/A'}</p>
          <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</span> {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</p>
          <p><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</span> {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">From:</h3>
          <p>{invoice.sender.name}</p>
          <p>{invoice.sender.address}</p>
          <p>{invoice.sender.city}, {invoice.sender.postalCode}</p>
          <p>{invoice.sender.country}</p>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Bill To:</h3>
          <p>{invoice.recipient.name}</p>
          <p>{invoice.recipient.address}</p>
          <p>{invoice.recipient.city}, {invoice.recipient.postalCode}</p>
          <p>{invoice.recipient.country}</p>
        </div>
      </div>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left font-bold">Description</th>
              <th className="py-3 px-4 text-center font-bold w-24">Qty</th>
              <th className="py-3 px-4 text-right font-bold w-32">Unit Price</th>
              <th className="py-3 px-4 text-right font-bold w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-4 text-sm">{item.description}</td>
                <td className="p-4 text-sm text-center">{item.quantity}</td>
                <td className="p-4 text-sm text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="p-4 text-sm font-semibold text-gray-800 text-right">
                  {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-10">
        <div className="w-full md:w-1/2 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700">Subtotal:</span>
            <span className="text-gray-800 font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700">Tax (%):</span>
            <span className="text-gray-800 font-bold">{invoice.taxRate}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => onEdit(invoice.id)}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Invoice
        </button>
        <button
          onClick={() => onDelete(invoice.id)}
          className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-600 transition duration-300 flex items-center justify-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

// Define types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  logoUrl?: string;
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  taxRate: number;
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
        
        // If there was a selected invoice, update it with the latest data
        if (selectedInvoice) {
          const updatedInvoice = response.data.data.invoices.find(
            (invoice: Invoice) => invoice.id === selectedInvoice.id
          );
          if (updatedInvoice) {
            setSelectedInvoice(updatedInvoice);
          }
        }
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
  
  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get the full invoice details if needed
      const response = await axios.get(`/api/invoices/${invoice.id}`);
      
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const editInvoice = (id: string) => {
    router.push(`/invoice-generator?id=${id}`);
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800">My Saved Invoices</h2>
              
              <div className="overflow-x-auto">
                {invoices.length > 0 ? (
                  <ul className="space-y-2">
                    {invoices.map(invoice => (
                      <li 
                        key={invoice.id} 
                        className={`flex items-center justify-between p-3 ${
                          selectedInvoice && selectedInvoice.id === invoice.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        } rounded-lg transition duration-200 cursor-pointer border`}
                        onClick={() => viewInvoiceDetails(invoice)}
                      >
                        <span className="text-sm font-medium text-gray-700">
                          Invoice #<span className="font-semibold">{invoice.invoiceNumber || 'N/A'}</span>
                          <span className="ml-4 text-xs text-gray-500">({formatDate(invoice.invoiceDate)})</span>
                        </span>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            confirmDelete(invoice.id); 
                          }} 
                          className="text-red-500 hover:text-red-700 transition duration-300 font-semibold text-sm"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-8">
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
                  </p>
                )}
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
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Invoice Details</h2>
              
              {selectedInvoice ? (
                <ReadOnlyInvoice 
                  invoice={selectedInvoice} 
                  onEdit={editInvoice} 
                  onDelete={confirmDelete} 
                />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select an invoice from the list to view its details.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceList;