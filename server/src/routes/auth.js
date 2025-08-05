const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  forgotPassword, 
  verifyEmail 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/profile', protect, getProfile);

module.exports = router;