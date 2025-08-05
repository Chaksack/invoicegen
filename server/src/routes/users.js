const express = require('express');
const router = express.Router();
const { 
  updateSettings, 
  getSettings 
} = require('../controllers/userController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Settings routes
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;