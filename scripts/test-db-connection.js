/**
 * Database Connection Test Script
 * 
 * This script tests the database connection with different environment configurations
 * to verify that the connection logic works correctly.
 * 
 * Usage:
 * - Test local development: node test-db-connection.js
 * - Test production without Vercel Postgres: NODE_ENV=production node test-db-connection.js
 * - Test with Vercel Postgres: POSTGRES_URL=your_postgres_url node test-db-connection.js
 */

// Load environment variables from .env file
require('dotenv').config();

// Import the database module
const { testConnection } = require('../lib/db/db');

// Log the current environment configuration
console.log('=== Database Connection Test ===');
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set (masked)' : 'Not set');
console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set (masked)' : 'Not set');
console.log('- DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('- DB_PORT:', process.env.DB_PORT || '5432');
console.log('- DB_NAME:', process.env.DB_NAME || 'invoicegen');
console.log('- DB_USER:', process.env.DB_USER || 'postgres');
console.log('=== Testing Connection ===');

// Test the database connection
(async () => {
  try {
    const result = await testConnection();
    
    if (result) {
      console.log('✅ Connection test successful!');
      
      // Provide guidance based on the environment
      if (process.env.DATABASE_URL) {
        console.log('✅ Neon database connection is working correctly.');
      } else if (process.env.POSTGRES_URL) {
        console.log('✅ Vercel Postgres connection is working correctly.');
      } else if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Warning: Connected to local database in production environment.');
        console.log('   For production deployments, you should use Neon database or Vercel Postgres.');
        console.log('   See NEON_DATABASE_SETUP.md for instructions.');
      } else {
        console.log('✅ Local database connection is working correctly.');
      }
    } else {
      console.log('❌ Connection test failed.');
      
      // Provide guidance based on the environment
      if (process.env.DATABASE_URL) {
        console.log('⚠️ Neon database connection failed. Check your connection string and database status.');
      } else if (process.env.POSTGRES_URL) {
        console.log('⚠️ Vercel Postgres connection failed. Check your connection string and database status.');
      } else if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Production environment detected without Neon database or Vercel Postgres.');
        console.log('   For production deployments, you should use Neon database or Vercel Postgres.');
        console.log('   See NEON_DATABASE_SETUP.md for instructions.');
      } else {
        console.log('⚠️ Local database connection failed. Make sure PostgreSQL is running and accessible.');
        console.log('   Check your .env file for correct database configuration.');
      }
    }
  } catch (error) {
    console.error('❌ Error during connection test:', error);
  } finally {
    // Exit the process to avoid hanging
    process.exit(0);
  }
})();