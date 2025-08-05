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
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getInvoices(req, res, user.id);
      case 'POST':
        return createInvoice(req, res, user.id);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

// Get all invoices for the current user
async function getInvoices(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get invoices
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: { UserId: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return handleSuccess(res, {
      invoices,
      pagination: {
        total: count,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// Create a new invoice
async function createInvoice(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
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
    
    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate,
      dueDate,
      logoUrl,
      sender,
      recipient,
      items,
      currency: currency || 'USD',
      taxRate: taxRate || 0,
      UserId: userId
    });
    
    return handleSuccess(res, invoice, 'Invoice created successfully', 201);
  } catch (error) {
    return handleError(res, error);
  }
}