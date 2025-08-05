import { NextApiRequest, NextApiResponse } from 'next';
import { handleError, handleSuccess, authenticate, requireVerifiedEmail } from '../../../lib/api-utils';
import { Invoice } from '../../../lib/db/models';
import { initDb } from '../../../lib/db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    await initDb();
    
    // Authenticate user
    const user = await authenticate(req, res);
    
    // If authentication failed, the authenticate middleware will handle the response
    if (!user) return;
    
    // Check if email is verified
    const isVerified = await requireVerifiedEmail(req, res);
    
    // If email is not verified, the requireVerifiedEmail middleware will handle the response
    if (!isVerified) return;
    
    // Get invoice ID from the URL
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getInvoice(req, res, id, user.id);
      case 'PUT':
        return updateInvoice(req, res, id, user.id);
      case 'DELETE':
        return deleteInvoice(req, res, id, user.id);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

// Get a specific invoice by ID
async function getInvoice(req: NextApiRequest, res: NextApiResponse, invoiceId: string, userId: string) {
  try {
    // Find invoice
    const invoice = await Invoice.findOne({
      where: {
        id: invoiceId,
        UserId: userId
      }
    });
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    return handleSuccess(res, invoice);
  } catch (error) {
    return handleError(res, error);
  }
}

// Update an invoice
async function updateInvoice(req: NextApiRequest, res: NextApiResponse, invoiceId: string, userId: string) {
  try {
    // Find invoice
    const invoice = await Invoice.findOne({
      where: {
        id: invoiceId,
        UserId: userId
      }
    });
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      logoUrl,
      sender,
      recipient,
      items,
      currency,
      taxRate
    } = req.body;
    
    // Validate required fields
    if (!invoiceDate || !sender || !recipient || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Update invoice
    await invoice.update({
      invoiceNumber,
      invoiceDate,
      dueDate,
      logoUrl,
      sender,
      recipient,
      items,
      currency,
      taxRate
    });
    
    return handleSuccess(res, invoice, 'Invoice updated successfully');
  } catch (error) {
    return handleError(res, error);
  }
}

// Delete an invoice
async function deleteInvoice(req: NextApiRequest, res: NextApiResponse, invoiceId: string, userId: string) {
  try {
    // Find invoice
    const invoice = await Invoice.findOne({
      where: {
        id: invoiceId,
        UserId: userId
      }
    });
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Delete invoice
    await invoice.destroy();
    
    return handleSuccess(res, null, 'Invoice deleted successfully');
  } catch (error) {
    return handleError(res, error);
  }
}