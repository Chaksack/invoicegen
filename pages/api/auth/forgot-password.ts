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
    await initDb();
    
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // For security reasons, don't reveal if the email exists or not
    if (!user) {
      return handleSuccess(res, null, 'If your email is registered, you will receive a password reset link');
    }
    
    // Create reset token
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: '1h' }
    );
    
    // In a real application, you would send an email with the reset link
    // For this example, we'll just return the token in the response
    // In production, you should NEVER return the token directly to the client
    
    // For demonstration purposes only
    const resetLink = `${process.env.NEXT_PUBLIC_API_URL}/reset-password?token=${resetToken}`;
    
    // In a real application, you would use an email service to send the reset link
    // Example: await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}`);
    
    return handleSuccess(res, { resetLink }, 'If your email is registered, you will receive a password reset link');
  } catch (error) {
    return handleError(res, error);
  }
}