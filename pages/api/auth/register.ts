import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { handleError, handleSuccess } from '../../../lib/api-utils';
import { User } from '../../../lib/db/models';
import { initDb } from '../../../lib/db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Initialize database connection
    const dbInitialized = await initDb();
    
    // Check if database initialization was successful
    if (!dbInitialized) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed. Please try again later.'
      });
    }
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if password is strong enough
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user with email verification required
    const user = await User.create({
      email,
      password,
      emailVerified: false, // Email verification required
      settings: {
        sender: {
          name: '',
          address: '',
          city: '',
          postalCode: '',
          country: ''
        },
        logoUrl: ''
      }
    });
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: '24h' } // Token expires in 24 hours
    );
    
    // In a production environment, you would send an email with the verification link
    // For development, we'll just log the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${verificationToken}`;
    console.log('Verification URL:', verificationUrl);
    
    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    return handleSuccess(res, userResponse, 'User registered successfully. Please check your email to verify your account.', 201);
  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    // Check for specific error types
    if (error && typeof error === 'object' && 'name' in error) {
      // Handle Sequelize connection errors
      if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
        return res.status(503).json({
          success: false,
          message: 'Database service unavailable. Please try again later.'
        });
      }
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError' && 'errors' in error && Array.isArray(error.errors)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e: any) => e.message)
        });
      }
      
      // Handle Sequelize unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // For other errors, use the general error handler
    return handleError(res, error);
  }
}