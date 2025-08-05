import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  id?: string;
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
  subtotal?: number;
  total?: number;
}

interface InvoiceGeneratorProps {
  setAlertMessage: (message: string) => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ setAlertMessage }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    logoUrl: '',
    sender: {
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
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    currency: 'USD',
    taxRate: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users/settings');
        
        if (response.data.success && response.data.data) {
          const settings = response.data.data;
          setInvoice(prev => ({
            ...prev,
            sender: settings.sender || prev.sender,
            logoUrl: settings.logoUrl || prev.logoUrl,
          }));
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  // Recalculate totals whenever invoice items or tax rate changes
  useEffect(() => {
    const newSubtotal = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = newSubtotal * (invoice.taxRate / 100);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + taxAmount);
  }, [invoice.items, invoice.taxRate]);

  // Handle form field changes
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sender' | 'recipient') => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [type]: { ...prev[type], [name]: value },
    }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    const newItems = [...invoice.items];
    newItems[index] = { 
      ...newItems[index], 
      [name]: name === 'description' ? value : parseFloat(value) || 0 
    };
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Save invoice to database
  const saveInvoice = async () => {
    try {
      setLoading(true);
      
      const invoiceData = {
        ...invoice,
        subtotal,
        total
      };
      
      let response;
      
      if (invoice.id) {
        // Update existing invoice
        response = await axios.put(`/api/invoices/${invoice.id}`, invoiceData);
      } else {
        // Create new invoice
        response = await axios.post('/api/invoices', invoiceData);
      }
      
      if (response.data.success) {
        setInvoice(prev => ({ ...prev, id: response.data.data.id }));
        setAlertMessage('Invoice saved successfully!');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      setAlertMessage('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download invoice as PDF
  const downloadPdf = async () => {
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // This is a placeholder for the actual PDF generation
      // In a real app, you would use a library like html2canvas and jsPDF
      // or make a request to a server-side PDF generation service
      
      setAlertMessage('PDF download functionality would be implemented here.');
      
      // Example of how it would work with html2canvas and jsPDF:
      /*
      const invoiceElement = document.getElementById('invoice-document');
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      */
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertMessage('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Create shareable link
  const createShareLink = () => {
    if (!invoice.id) {
      setAlertMessage('Please save the invoice before sharing.');
      return;
    }
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invoices/${invoice.id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareLink('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setAlertMessage('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setAlertMessage('Failed to copy link. Please try again.');
      });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-6">Invoice Generator</h2>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <button 
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
            onClick={saveInvoice} 
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m-8-2h6m-6-4h6m-8-2v4m4-4V7" />
            </svg>
            Save Invoice
          </button>
          
          <button 
            onClick={createShareLink} 
            className="bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-800 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.364-2.684 3 3 0 00-5.364 2.684zm-6.632 6.632a3 3 0 10-5.364 2.684 3 3 0 005.364-2.684z" />
            </svg>
            Share Invoice
          </button>
        </div>
        
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
        
        {/* Invoice Document */}
        <div id="invoice-document" className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
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
              <div className="flex items-center mb-2">
                <label htmlFor="invoiceNumber" className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</label>
                <input 
                  type="text" 
                  id="invoiceNumber" 
                  name="invoiceNumber" 
                  value={invoice.invoiceNumber} 
                  onChange={handleInvoiceChange} 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="INV-001" 
                />
              </div>
              <div className="flex items-center mb-2">
                <label htmlFor="invoiceDate" className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</label>
                <input 
                  type="date" 
                  id="invoiceDate" 
                  name="invoiceDate" 
                  value={invoice.invoiceDate} 
                  onChange={handleInvoiceChange} 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="dueDate" className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</label>
                <input 
                  type="date" 
                  id="dueDate" 
                  name="dueDate" 
                  value={invoice.dueDate} 
                  onChange={handleInvoiceChange} 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
          
          {/* Sender and Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4">From:</h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  name="name" 
                  value={invoice.sender.name} 
                  onChange={(e) => handleAddressChange(e, 'sender')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Your Company Name" 
                />
                <input 
                  type="text" 
                  name="address" 
                  value={invoice.sender.address} 
                  onChange={(e) => handleAddressChange(e, 'sender')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Street Address" 
                />
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    name="city" 
                    value={invoice.sender.city} 
                    onChange={(e) => handleAddressChange(e, 'sender')} 
                    className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                    placeholder="City" 
                  />
                  <input 
                    type="text" 
                    name="postalCode" 
                    value={invoice.sender.postalCode} 
                    onChange={(e) => handleAddressChange(e, 'sender')} 
                    className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                    placeholder="Postal Code" 
                  />
                </div>
                <input 
                  type="text" 
                  name="country" 
                  value={invoice.sender.country} 
                  onChange={(e) => handleAddressChange(e, 'sender')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Country" 
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4">Bill To:</h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  name="name" 
                  value={invoice.recipient.name} 
                  onChange={(e) => handleAddressChange(e, 'recipient')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Client Name" 
                />
                <input 
                  type="text" 
                  name="address" 
                  value={invoice.recipient.address} 
                  onChange={(e) => handleAddressChange(e, 'recipient')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Street Address" 
                />
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    name="city" 
                    value={invoice.recipient.city} 
                    onChange={(e) => handleAddressChange(e, 'recipient')} 
                    className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                    placeholder="City" 
                  />
                  <input 
                    type="text" 
                    name="postalCode" 
                    value={invoice.recipient.postalCode} 
                    onChange={(e) => handleAddressChange(e, 'recipient')} 
                    className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                    placeholder="Postal Code" 
                  />
                </div>
                <input 
                  type="text" 
                  name="country" 
                  value={invoice.recipient.country} 
                  onChange={(e) => handleAddressChange(e, 'recipient')} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" 
                  placeholder="Country" 
                />
              </div>
            </div>
          </div>
          
          {/* Currency Selection */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="currency" className="font-semibold text-gray-700">Currency:</label>
              <select 
                id="currency" 
                name="currency" 
                value={invoice.currency} 
                onChange={handleInvoiceChange} 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-24 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="GHC">GHC (₵)</option>
              </select>
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
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input 
                        type="text" 
                        name="description" 
                        value={item.description} 
                        onChange={(e) => handleItemChange(e, index)} 
                        className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Item description" 
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        name="quantity" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(e, index)} 
                        className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-center focus:ring-blue-500 focus:border-blue-500" 
                        min="1" 
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        name="unitPrice" 
                        value={item.unitPrice} 
                        onChange={(e) => handleItemChange(e, index)} 
                        className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-right focus:ring-blue-500 focus:border-blue-500" 
                        min="0" 
                        step="0.01"
                      />
                    </td>
                    <td className="p-4 text-right text-sm font-semibold text-gray-800">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleRemoveItem(index)} 
                        className="text-red-500 hover:text-red-700 transition duration-300" 
                        aria-label="Remove item"
                        disabled={invoice.items.length === 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Add Item Button */}
          <button 
            onClick={handleAddItem} 
            className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>
          
          {/* Invoice Totals */}
          <div className="flex justify-end mt-10">
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="text-gray-800 font-bold">{invoice.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Tax (%):</span>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    name="taxRate" 
                    value={invoice.taxRate} 
                    onChange={handleInvoiceChange} 
                    className="w-20 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-right focus:ring-blue-500 focus:border-blue-500" 
                    min="0" 
                    step="0.1"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
                <span>Total:</span>
                <span>{invoice.currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceGenerator;