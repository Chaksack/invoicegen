import { NextApiRequest, NextApiResponse } from 'next';
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
    await initDb();
    
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
    
    // Create new user
    const user = await User.create({
      email,
      password,
      emailVerified: true, // For simplicity, auto-verify email
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
    
    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      settings: user.settings,
      createdAt: user.createdAt
    };
    
    return handleSuccess(res, userResponse, 'User registered successfully', 201);
  } catch (error) {
    return handleError(res, error);
  }
}