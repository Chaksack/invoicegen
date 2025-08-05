import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  recipient: {
    name: string;
  };
  total: number;
  currency: string;
  createdAt: string;
}

interface InvoiceListProps {
  setAlertMessage: (message: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ setAlertMessage }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/invoices');
        
        if (response.data.success) {
          setInvoices(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setAlertMessage('Failed to load invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchInvoices();
    }
  }, [user, setAlertMessage]);

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await axios.delete(`/api/invoices/${id}`);
        
        if (response.data.success) {
          setInvoices(invoices.filter(invoice => invoice.id !== id));
          setAlertMessage('Invoice deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setAlertMessage('Failed to delete invoice. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-blue-800">My Invoices</h2>
          <Link 
            to="/" 
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Invoice
          </Link>
        </div>
        
        {invoices.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link to={`/invoices/${invoice.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Invoice #{invoice.invoiceNumber || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.recipient.name || 'No recipient'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-8 flex flex-col items-end">
                            <div className="text-sm font-semibold text-gray-900">
                              {invoice.currency} {invoice.total.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(invoice.invoiceDate)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteInvoice(invoice.id, e)}
                            className="text-red-500 hover:text-red-700 transition duration-300"
                            aria-label="Delete invoice"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Invoices Found</h3>
            <p className="text-gray-600 mb-4">You haven't created any invoices yet.</p>
            <Link 
              to="/" 
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
            >
              Create Your First Invoice
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoiceList;