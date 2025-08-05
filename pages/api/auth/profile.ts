import { NextApiRequest, NextApiResponse } from 'next';
import { handleError, handleSuccess, authenticate } from '../../../lib/api-utils';
import { initDb } from '../../../lib/db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Initialize database connection
    await initDb();
    
    // Authenticate user
    const user = await authenticate(req, res);
    
    // If authentication failed, the authenticate middleware will handle the response
    if (!user) return;
    
    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    return handleSuccess(res, userResponse, 'User profile retrieved successfully');
  } catch (error) {
    return handleError(res, error);
  }
}