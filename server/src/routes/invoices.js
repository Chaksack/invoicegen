const express = require('express');
const router = express.Router();
const { 
  getInvoices, 
  getInvoice, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} = require('../controllers/invoiceController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes that require email verification
router.use(verifiedOnly);

// Invoice routes
router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

module.exports = router;