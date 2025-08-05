import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '../lib/context/AuthContext';

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
  
  return (
    <>
      <Head>
        <title>{id ? 'Edit Invoice' : 'Create Invoice'} | Invoice Generator</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Invoice' : 'Create Invoice'}</h1>
            
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
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="invoiceNumber" className="block text-gray-700 mb-2">Invoice Number</label>
                    <input
                      id="invoiceNumber"
                      name="invoiceNumber"
                      type="text"
                      className="input"
                      value={invoice.invoiceNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="invoiceDate" className="block text-gray-700 mb-2">Invoice Date *</label>
                    <input
                      id="invoiceDate"
                      name="invoiceDate"
                      type="date"
                      className="input"
                      value={invoice.invoiceDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="dueDate" className="block text-gray-700 mb-2">Due Date</label>
                    <input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      className="input"
                      value={invoice.dueDate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="currency" className="block text-gray-700 mb-2">Currency</label>
                    <select
                      id="currency"
                      name="currency"
                      className="input"
                      value={invoice.currency}
                      onChange={handleInputChange}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="taxRate" className="block text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={invoice.taxRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-4">Your Information</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="sender.name" className="block text-gray-700 mb-2">Name/Company *</label>
                    <input
                      id="sender.name"
                      name="sender.name"
                      type="text"
                      className="input"
                      value={invoice.sender.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="sender.address" className="block text-gray-700 mb-2">Address</label>
                    <input
                      id="sender.address"
                      name="sender.address"
                      type="text"
                      className="input"
                      value={invoice.sender.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="sender.city" className="block text-gray-700 mb-2">City</label>
                      <input
                        id="sender.city"
                        name="sender.city"
                        type="text"
                        className="input"
                        value={invoice.sender.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="sender.postalCode" className="block text-gray-700 mb-2">Postal Code</label>
                      <input
                        id="sender.postalCode"
                        name="sender.postalCode"
                        type="text"
                        className="input"
                        value={invoice.sender.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="sender.country" className="block text-gray-700 mb-2">Country</label>
                    <input
                      id="sender.country"
                      name="sender.country"
                      type="text"
                      className="input"
                      value={invoice.sender.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Client Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label htmlFor="recipient.name" className="block text-gray-700 mb-2">Name/Company *</label>
                      <input
                        id="recipient.name"
                        name="recipient.name"
                        type="text"
                        className="input"
                        value={invoice.recipient.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="recipient.address" className="block text-gray-700 mb-2">Address</label>
                      <input
                        id="recipient.address"
                        name="recipient.address"
                        type="text"
                        className="input"
                        value={invoice.recipient.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label htmlFor="recipient.city" className="block text-gray-700 mb-2">City</label>
                        <input
                          id="recipient.city"
                          name="recipient.city"
                          type="text"
                          className="input"
                          value={invoice.recipient.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="recipient.postalCode" className="block text-gray-700 mb-2">Postal Code</label>
                        <input
                          id="recipient.postalCode"
                          name="recipient.postalCode"
                          type="text"
                          className="input"
                          value={invoice.recipient.postalCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="recipient.country" className="block text-gray-700 mb-2">Country</label>
                      <input
                        id="recipient.country"
                        name="recipient.country"
                        type="text"
                        className="input"
                        value={invoice.recipient.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full mb-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Quantity</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              className="input"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              className="input text-right"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min="1"
                              step="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              className="input text-right"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {invoice.items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                            No items added yet. Click "Add Item" to add an invoice item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-semibold">Subtotal:</td>
                        <td className="px-4 py-2 text-right">{calculateSubtotal().toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-semibold">
                          Tax ({invoice.taxRate}%):
                        </td>
                        <td className="px-4 py-2 text-right">{calculateTax().toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="px-4 py-2 text-right">Total:</td>
                        <td className="px-4 py-2 text-right">{calculateTotal().toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addItem}
                >
                  Add Item
                </button>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/invoices')}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (id ? 'Update Invoice' : 'Create Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceGenerator;