import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { User } from './db/models';

// Define response types
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

// Error handler function
export const handleError = (res: NextApiResponse, error: any, statusCode = 500) => {
  console.error('API Error:', error);
  
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Server error',
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

// Success response function
export const handleSuccess = (res: NextApiResponse, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Authentication middleware
export const authenticate = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production') as { id: string };
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user to request object
    (req as any).user = user;
    
    return user;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Email verification middleware
export const requireVerifiedEmail = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = (req as any).user;
  
  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  
  return true;
};