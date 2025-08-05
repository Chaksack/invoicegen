const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { testConnection, initDb } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const userRoutes = require('./routes/users');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      // Test database connection
      await testConnection();
      
      // Initialize database
      await initDb();
      
      // Start listening
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
} else {
  // For production/serverless, initialize database connection on first request
  app.use(async (req, res, next) => {
    try {
      // Only test connection if not already tested
      if (!global.dbConnectionTested) {
        await testConnection();
        await initDb();
        global.dbConnectionTested = true;
      }
      next();
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
}

// Export the Express app for serverless environments
module.exports = app;