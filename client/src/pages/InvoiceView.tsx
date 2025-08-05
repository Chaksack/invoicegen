import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  logoUrl: string;
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
  currency: string;
  taxRate: number;
  subtotal: number;
  total: number;
}

interface InvoiceViewProps {
  setAlertMessage: (message: string) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ setAlertMessage }) => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/invoices/${id}`);
        
        if (response.data.success) {
          setInvoice(response.data.data);
        } else {
          setAlertMessage('Invoice not found.');
          navigate('/invoices');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setAlertMessage('Failed to load invoice. Please try again.');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && id) {
      fetchInvoice();
    }
  }, [user, id, navigate, setAlertMessage]);

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await axios.delete(`/api/invoices/${invoice.id}`);
        
        if (response.data.success) {
          setAlertMessage('Invoice deleted successfully!');
          navigate('/invoices');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setAlertMessage('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleEditInvoice = () => {
    navigate('/', { state: { invoice } });
  };

  const downloadPdf = async () => {
    setAlertMessage('PDF download functionality would be implemented here.');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!invoice) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoice Not Found</h3>
            <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
            <Link 
              to="/invoices" 
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
            >
              Back to Invoices
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-blue-800">Invoice #{invoice.invoiceNumber || 'N/A'}</h2>
          <div className="flex space-x-4">
            <button 
              onClick={downloadPdf} 
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button 
              onClick={handleEditInvoice} 
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Invoice
            </button>
            <button 
              onClick={handleDeleteInvoice} 
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" />
              </svg>
              Delete Invoice
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b pb-6">
            <div className="flex items-center mb-4 md:mb-0">
              {invoice.logoUrl && !logoLoadError ? (
                <img 
                  src={invoice.logoUrl} 
                  alt="Company Logo" 
                  className="max-h-16 h-auto object-contain mr-4 rounded-lg shadow-sm" 
                  onError={() => setLogoLoadError(true)} 
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg mr-4">
                  <span className="text-xs text-gray-500 text-center">No Logo</span>
                </div>
              )}
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">INVOICE</h2>
            </div>
            
            <div className="flex flex-col items-end text-sm">
              <p className="mb-2">
                <span className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</span> 
                {invoice.invoiceNumber || 'N/A'}
              </p>
              <p className="mb-2">
                <span className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</span> 
                {formatDate(invoice.invoiceDate)}
              </p>
              <p>
                <span className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</span> 
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          
          {/* Sender and Recipient */}
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
          
          {/* Invoice Items */}
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
                    <td className="p-4 text-sm text-right">{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                    <td className="p-4 text-sm font-semibold text-gray-800 text-right">
                      {invoice.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Invoice Totals */}
          <div className="flex justify-end mt-10">
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="text-gray-800 font-bold">{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Tax (%):</span>
                <span className="text-gray-800 font-bold">{invoice.taxRate}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
                <span>Total:</span>
                <span>{invoice.currency} {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceView;