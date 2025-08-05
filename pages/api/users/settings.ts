import { NextApiRequest, NextApiResponse } from 'next';
import { handleError, handleSuccess, authenticate } from '../../../lib/api-utils';
import { User } from '../../../lib/db/models';
import { initDb } from '../../../lib/db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    await initDb();
    
    // Authenticate user
    const user = await authenticate(req, res);
    
    // If authentication failed, the authenticate middleware will handle the response
    if (!user) return;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getSettings(req, res, user);
      case 'PUT':
        return updateSettings(req, res, user);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

// Get user settings
async function getSettings(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    return handleSuccess(res, user.settings);
  } catch (error) {
    return handleError(res, error);
  }
}

// Update user settings
async function updateSettings(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { settings } = req.body;
    
    // Validate input
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }
    
    // Validate sender information if provided
    if (settings.sender) {
      const { name, address, city, postalCode, country } = settings.sender;
      
      // Ensure all sender fields are strings if provided
      if (
        (name !== undefined && typeof name !== 'string') ||
        (address !== undefined && typeof address !== 'string') ||
        (city !== undefined && typeof city !== 'string') ||
        (postalCode !== undefined && typeof postalCode !== 'string') ||
        (country !== undefined && typeof country !== 'string')
      ) {
        return res.status(400).json({
          success: false,
          message: 'Sender information must be strings'
        });
      }
    }
    
    // Validate logoUrl if provided
    if (settings.logoUrl !== undefined && typeof settings.logoUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Logo URL must be a string'
      });
    }
    
    // Merge existing settings with new settings
    const updatedSettings = {
      ...user.settings,
      ...settings,
      // Merge sender information if provided
      sender: settings.sender ? {
        ...user.settings.sender,
        ...settings.sender
      } : user.settings.sender
    };
    
    // Update user
    user.settings = updatedSettings;
    await user.save();
    
    return handleSuccess(res, updatedSettings, 'Settings updated successfully');
  } catch (error) {
    return handleError(res, error);
  }
}