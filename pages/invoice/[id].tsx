import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../../lib/context/AuthContext';

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
  currency: string;
  taxRate: number;
  subtotal: number;
  total: number;
  createdAt: string;
}

const InvoiceView: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Load invoice
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadInvoice(id);
    }
  }, [id]);
  
  // Generate share URL
  useEffect(() => {
    if (typeof window !== 'undefined' && invoice) {
      const url = `${window.location.origin}/invoice/${invoice.id}`;
      setShareUrl(url);
    }
  }, [invoice]);
  
  const loadInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      
      if (response.data.success) {
        setInvoice(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD'
    }).format(amount);
  };
  
  const downloadAsPdf = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = invoice?.invoiceNumber 
        ? `Invoice-${invoice.invoiceNumber}.pdf` 
        : `Invoice-${invoice?.id}.pdf`;
      
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowShareLink(true);
        setTimeout(() => setShowShareLink(false), 3000);
      })
      .catch(() => {
        setError('Failed to copy link to clipboard');
      });
  };
  
  if (loading || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <Link href="/invoices" className="btn btn-primary">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">Invoice Not Found</h1>
            <p className="mb-4">The invoice you are looking for does not exist or you do not have permission to view it.</p>
            <Link href="/invoices" className="btn btn-primary">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Invoice {invoice.invoiceNumber || invoice.id} | Invoice Generator</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <Link href="/invoices" className="btn btn-secondary">
              Back to Invoices
            </Link>
            
            <div className="flex space-x-2">
              <button
                onClick={copyShareLink}
                className="btn btn-secondary"
              >
                Share
              </button>
              
              <button
                onClick={downloadAsPdf}
                className="btn btn-primary"
              >
                Download PDF
              </button>
              
              <Link
                href={`/invoice-generator?id=${invoice.id}`}
                className="btn btn-secondary"
              >
                Edit
              </Link>
            </div>
          </div>
          
          {showShareLink && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Link copied to clipboard!
            </div>
          )}
          
          <div className="card bg-white p-8" ref={invoiceRef}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                {invoice.invoiceNumber && (
                  <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                )}
              </div>
              
              {invoice.logoUrl && (
                <img 
                  src={invoice.logoUrl} 
                  alt="Company Logo" 
                  className="h-16 object-contain"
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-gray-700">From</h2>
                <p className="font-bold">{invoice.sender.name}</p>
                {invoice.sender.address && <p>{invoice.sender.address}</p>}
                {(invoice.sender.city || invoice.sender.postalCode) && (
                  <p>
                    {invoice.sender.city}{invoice.sender.city && invoice.sender.postalCode ? ', ' : ''}
                    {invoice.sender.postalCode}
                  </p>
                )}
                {invoice.sender.country && <p>{invoice.sender.country}</p>}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2 text-gray-700">Bill To</h2>
                <p className="font-bold">{invoice.recipient.name}</p>
                {invoice.recipient.address && <p>{invoice.recipient.address}</p>}
                {(invoice.recipient.city || invoice.recipient.postalCode) && (
                  <p>
                    {invoice.recipient.city}{invoice.recipient.city && invoice.recipient.postalCode ? ', ' : ''}
                    {invoice.recipient.postalCode}
                  </p>
                )}
                {invoice.recipient.country && <p>{invoice.recipient.country}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-gray-700">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-gray-600">Invoice Date:</p>
                  <p>{formatDate(invoice.invoiceDate)}</p>
                  
                  {invoice.dueDate && (
                    <>
                      <p className="text-gray-600">Due Date:</p>
                      <p>{formatDate(invoice.dueDate)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-200">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-3 text-right font-semibold">Subtotal:</td>
                    <td className="py-3 text-right">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  
                  {invoice.taxRate > 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-right font-semibold">
                        Tax ({invoice.taxRate}%):
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(invoice.total - invoice.subtotal)}
                      </td>
                    </tr>
                  )}
                  
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={3} className="py-3 text-right font-bold text-lg">Total:</td>
                    <td className="py-3 text-right font-bold text-lg">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="text-center text-gray-500 text-sm mt-16">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceView;