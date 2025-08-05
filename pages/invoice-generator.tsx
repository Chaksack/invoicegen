import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '../lib/context/AuthContext';
import Script from 'next/script';

// Add TypeScript declarations for the external libraries
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (orientation?: string, unit?: string, format?: string) => any;
    };
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

// Define types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id?: string;
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
  currency: string;
  taxRate: number;
  subtotal?: number;
  total?: number;
}

const InvoiceGenerator: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    sender: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    recipient: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    items: [],
    currency: 'USD',
    taxRate: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [logoLoadError, setLogoLoadError] = useState(false);
  
  // Load invoice if editing
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadInvoice(id);
    } else if (user?.settings) {
      // Pre-fill sender information from user settings
      // Using non-null assertion since we've already checked that settings exists
      setInvoice(prev => ({
        ...prev,
        sender: user.settings!.sender || {
          name: '',
          address: '',
          city: '',
          postalCode: '',
          country: ''
        },
        logoUrl: user.settings!.logoUrl || ''
      }));
    }
  }, [id, user]);
  
  const loadInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      
      if (response.data.success) {
        const loadedInvoice = response.data.data;
        
        // Format dates for input fields
        if (loadedInvoice.invoiceDate) {
          loadedInvoice.invoiceDate = new Date(loadedInvoice.invoiceDate).toISOString().split('T')[0];
        }
        
        if (loadedInvoice.dueDate) {
          loadedInvoice.dueDate = new Date(loadedInvoice.dueDate).toISOString().split('T')[0];
        }
        
        setInvoice(loadedInvoice);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setInvoice(prev => {
        // Create a safe copy of the parent object or an empty object if it doesn't exist
        const parentObj = typeof prev[parent as keyof Invoice] === 'object' && prev[parent as keyof Invoice] !== null
          ? { ...prev[parent as keyof Invoice] as Record<string, any> }
          : {};
          
        // Return the updated invoice
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setInvoice(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0
    };
    
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };
  
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };
  
  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };
  
  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };
  
  const calculateTax = () => {
    return calculateSubtotal() * (invoice.taxRate / 100);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Validate form
      if (!invoice.invoiceDate || !invoice.sender.name || !invoice.recipient.name || invoice.items.length === 0) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      // Calculate totals
      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      
      const invoiceData = {
        ...invoice,
        subtotal,
        total
      };
      
      let response;
      
      if (id) {
        // Update existing invoice
        response = await axios.put(`/api/invoices/${id}`, invoiceData);
      } else {
        // Create new invoice
        response = await axios.post('/api/invoices', invoiceData);
      }
      
      if (response.data.success) {
        setSuccess(id ? 'Invoice updated successfully' : 'Invoice created successfully');
        
        // Redirect to invoice list after a short delay
        setTimeout(() => {
          router.push('/invoices');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  // PDF download functionality
  
  // Create a new invoice with default values
  const createNewInvoice = () => {
    setInvoice({
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      logoUrl: user?.settings?.logoUrl || '',
      sender: user?.settings?.sender || {
        name: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
      },
      recipient: {
        name: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
      },
      items: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
      currency: 'USD',
      taxRate: 0,
    });
    
    // Clear the ID from the URL
    router.replace('/invoice-generator', undefined, { shallow: true });
    
    setSuccess('New invoice created!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadPdf = async () => {
    if (!invoiceRef.current) return;
    
    setDownloading(true);
    try {
      const { jsPDF } = window.jspdf;
      const element = invoiceRef.current;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scale = 2;
      
      const canvas = await window.html2canvas(element, {
        scale: scale,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber || 'new'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const createShareLink = () => {
    if (!id) {
      setError('Please save the invoice before sharing.');
      return;
    }
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invoice/${id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch(() => {
        setError('Failed to copy link. Please try again.');
      });
  };

  return (
    <>
      <Head>
        <title>{id ? 'Edit Invoice' : 'Create Invoice'} | Invoice Generator</title>
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="beforeInteractive" />
      
      <div className="min-h-screen bg-gray-100 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="card p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{id ? 'Edit Invoice' : 'Create Invoice'}</h1>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
                {success}
              </div>
            )}
            
            {/* Share Modal */}
            {showShareModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                <div className="relative bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
                  <button
                    onClick={handleCloseShareModal}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Share Invoice</h3>
                  <p className="text-gray-700 mb-4 text-sm md:text-base">
                    Copy the link below and share it with your client.
                  </p>
                  <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-grow bg-gray-100 border border-gray-300 rounded-lg py-2 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-sm md:text-base"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V8" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons section removed */}

            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section - Left Side */}
              <div className="order-2 lg:order-1">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Invoice Details</h2>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="invoiceNumber" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Invoice Number</label>
                        <input
                          id="invoiceNumber"
                          name="invoiceNumber"
                          type="text"
                          className="input text-sm sm:text-base"
                          value={invoice.invoiceNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="invoiceDate" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Invoice Date *</label>
                        <input
                          id="invoiceDate"
                          name="invoiceDate"
                          type="date"
                          className="input text-sm sm:text-base"
                          value={invoice.invoiceDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="dueDate" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Due Date</label>
                        <input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          className="input text-sm sm:text-base"
                          value={invoice.dueDate || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="currency" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Currency</label>
                        <select
                          id="currency"
                          name="currency"
                          className="input text-sm sm:text-base"
                          value={invoice.currency}
                          onChange={handleInputChange}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                          <option value="GHC">GHC - Ghanaian Cedi</option>
                        </select>
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="taxRate" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Tax Rate (%)</label>
                        <input
                          id="taxRate"
                          name="taxRate"
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-sm sm:text-base"
                          value={invoice.taxRate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your Information</h2>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="sender.name" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Name/Company *</label>
                        <input
                          id="sender.name"
                          name="sender.name"
                          type="text"
                          className="input text-sm sm:text-base"
                          value={invoice.sender.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="sender.address" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Address</label>
                        <input
                          id="sender.address"
                          name="sender.address"
                          type="text"
                          className="input text-sm sm:text-base"
                          value={invoice.sender.address}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                        <div className="mb-3 sm:mb-4">
                          <label htmlFor="sender.city" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">City</label>
                          <input
                            id="sender.city"
                            name="sender.city"
                            type="text"
                            className="input text-sm sm:text-base"
                            value={invoice.sender.city}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="mb-3 sm:mb-4">
                          <label htmlFor="sender.postalCode" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Postal Code</label>
                          <input
                            id="sender.postalCode"
                            name="sender.postalCode"
                            type="text"
                            className="input text-sm sm:text-base"
                            value={invoice.sender.postalCode}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <label htmlFor="sender.country" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Country</label>
                        <input
                          id="sender.country"
                          name="sender.country"
                          type="text"
                          className="input text-sm sm:text-base"
                          value={invoice.sender.country}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Client Information</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <div className="mb-3 sm:mb-4">
                          <label htmlFor="recipient.name" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Name/Company *</label>
                          <input
                            id="recipient.name"
                            name="recipient.name"
                            type="text"
                            className="input text-sm sm:text-base"
                            value={invoice.recipient.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3 sm:mb-4">
                          <label htmlFor="recipient.address" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Address</label>
                          <input
                            id="recipient.address"
                            name="recipient.address"
                            type="text"
                            className="input text-sm sm:text-base"
                            value={invoice.recipient.address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div className="mb-3 sm:mb-4">
                            <label htmlFor="recipient.city" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">City</label>
                            <input
                              id="recipient.city"
                              name="recipient.city"
                              type="text"
                              className="input text-sm sm:text-base"
                              value={invoice.recipient.city}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="mb-3 sm:mb-4">
                            <label htmlFor="recipient.postalCode" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Postal Code</label>
                            <input
                              id="recipient.postalCode"
                              name="recipient.postalCode"
                              type="text"
                              className="input text-sm sm:text-base"
                              value={invoice.recipient.postalCode}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="mb-3 sm:mb-4">
                          <label htmlFor="recipient.country" className="block text-gray-700 text-sm sm:text-base mb-1 sm:mb-2">Country</label>
                          <input
                            id="recipient.country"
                            name="recipient.country"
                            type="text"
                            className="input text-sm sm:text-base"
                            value={invoice.recipient.country}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Invoice Items</h2>
                    
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <table className="w-full mb-3 sm:mb-4 text-sm sm:text-base">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="px-2 sm:px-4 py-1 sm:py-2 text-left">Description</th>
                            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Qty</th>
                            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Price</th>
                            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Amount</th>
                            <th className="px-2 sm:px-4 py-1 sm:py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map(item => (
                            <tr key={item.id} className="border-b">
                              <td className="px-2 sm:px-4 py-1 sm:py-2">
                                <input
                                  type="text"
                                  className="input text-sm sm:text-base py-1 sm:py-2"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder="Item description"
                                />
                              </td>
                              <td className="px-2 sm:px-4 py-1 sm:py-2">
                                <input
                                  type="number"
                                  className="input text-right text-sm sm:text-base py-1 sm:py-2 w-16 sm:w-20"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  min="1"
                                  step="1"
                                />
                              </td>
                              <td className="px-2 sm:px-4 py-1 sm:py-2">
                                <input
                                  type="number"
                                  className="input text-right text-sm sm:text-base py-1 sm:py-2 w-20 sm:w-24"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap">
                                {(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                              <td className="px-2 sm:px-4 py-1 sm:py-2 text-center">
                                <button
                                  type="button"
                                  className="text-red-600 hover:text-red-800 text-sm sm:text-base"
                                  onClick={() => removeItem(item.id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                          
                          {invoice.items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-2 sm:px-4 py-1 sm:py-2 text-center text-gray-500 text-sm sm:text-base">
                                No items added yet. Click "Add Item" to add an invoice item.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold">Subtotal:</td>
                            <td className="px-2 sm:px-4 py-1 sm:py-2 text-right">{calculateSubtotal().toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold">
                              Tax ({invoice.taxRate}%):
                            </td>
                            <td className="px-2 sm:px-4 py-1 sm:py-2 text-right">{calculateTax().toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr className="font-bold">
                            <td colSpan={3} className="px-2 sm:px-4 py-1 sm:py-2 text-right">Total:</td>
                            <td className="px-2 sm:px-4 py-1 sm:py-2 text-right">{calculateTotal().toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-secondary text-sm sm:text-base py-1 sm:py-2 w-full sm:w-auto"
                      onClick={addItem}
                    >
                      Add Item
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      className="btn btn-secondary text-sm sm:text-base py-2 w-full sm:w-auto order-2 sm:order-1"
                      onClick={() => router.push('/invoices')}
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="btn btn-primary text-sm sm:text-base py-2 w-full sm:w-auto order-1 sm:order-2"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : (id ? 'Update Invoice' : 'Create Invoice')}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Preview Section - Right Side */}
              <div className="order-1 lg:order-2">
                <div id="invoice-document" ref={invoiceRef} className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
                  {/* This div will be captured for PDF generation */}
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
                      <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</span> {invoice.invoiceNumber || 'N/A'}</p>
                      <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</span> {invoice.invoiceDate}</p>
                      <p><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</span> {invoice.dueDate || 'N/A'}</p>
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
                            <td className="p-4 text-sm text-right">{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                            <td className="p-4 text-sm font-semibold text-gray-800 text-right">
                              {invoice.currency} {(item.quantity * item.unitPrice).toFixed(2)}
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
                        <span className="text-gray-800 font-bold">{invoice.currency} {calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-700">Tax (%):</span>
                        <span className="text-gray-800 font-bold">{invoice.taxRate}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
                        <span>Total:</span>
                        <span>{invoice.currency} {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Download and Share Buttons */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
                  <button 
                    type="button" 
                    onClick={downloadPdf} 
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg"
                    disabled={downloading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={createShareLink} 
                    className="bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-800 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.364-2.684 3 3 0 00-5.364 2.684zm-6.632 6.632a3 3 0 10-5.364 2.684 3 3 0 005.364-2.684z" />
                    </svg>
                    Share Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceGenerator;