import { Sequelize } from 'sequelize';

// Explicitly require pg to ensure it's loaded
// This helps prevent the "Please install pg package manually" error in serverless environments
try {
  require('pg');
  console.log('Successfully loaded pg package');
} catch (error) {
  console.error('Error loading pg package:', error);
  // Try to load it again with a different approach
  try {
    const pg = require('pg');
    console.log('Successfully loaded pg package on second attempt');
  } catch (secondError) {
    console.error('Failed to load pg package after multiple attempts:', secondError);
  }
}

// Initialize Sequelize with environment variables
let sequelize: Sequelize;

// Initialize Sequelize with proper error handling
try {
  // Check if running with Neon database or Vercel Postgres
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    // Prioritize Neon database connection if available
    const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    console.log('Using Neon database connection');
    
    // Log connection string (with credentials masked)
    // We know connectionUrl is defined here because of the if condition above
    const maskedUrl = connectionUrl!.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
    console.log('Connection URL (masked):', maskedUrl);
    
    // Use the Neon database connection string
    sequelize = new Sequelize(connectionUrl!, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        // Add query timeout for Neon database (30 seconds)
        // This helps prevent long-running queries from causing issues in serverless environments
        statement_timeout: 30000
      },
      // Add retry logic for connection
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else if (process.env.NODE_ENV === 'production') {
    // In production, we should be using Vercel Postgres
    console.error('⚠️ CRITICAL: POSTGRES_URL is not set in production environment');
    console.error('Please set up Vercel Postgres for your project:');
    console.error('1. Go to the Vercel dashboard');
    console.error('2. Select your project');
    console.error('3. Go to Storage tab');
    console.error('4. Create a new Postgres database');
    console.error('5. Connect it to your project');
    
    // Still create a Sequelize instance with local parameters as fallback,
    // but this will likely fail in production without a local PostgreSQL server
    console.log('Falling back to local PostgreSQL connection (this will likely fail in production)');
    sequelize = new Sequelize(
      process.env.DB_NAME || 'invoicegen',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: true, // Always log in this error case
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          },
          // Add query timeout (30 seconds)
          statement_timeout: 30000
        },
        // Add retry logic for connection
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  } else {
    // Use traditional connection parameters for local development
    console.log('Using local PostgreSQL connection');
    sequelize = new Sequelize(
      process.env.DB_NAME || 'invoicegen',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: false,
          // Add query timeout for local development (30 seconds)
          // This helps maintain consistent behavior with production
          statement_timeout: 30000
        },
        // Add retry logic for connection
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
  
  console.log('Sequelize instance created successfully');
} catch (error) {
  console.error('Error initializing Sequelize:', error);
}

// Test the connection with retry logic and enhanced error reporting
const testConnection = async (retries = 5, delay = 5000) => {
  let currentTry = 0;
  
  // Log connection attempt with environment info
  console.log('Testing database connection with the following configuration:');
  console.log('- Environment:', process.env.NODE_ENV || 'development');
  console.log('- Using Neon Database:', !!process.env.DATABASE_URL);
  console.log('- Using Vercel Postgres:', !!process.env.POSTGRES_URL && !process.env.DATABASE_URL);
  console.log('- Dialect:', 'postgres');
  
  while (currentTry < retries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection has been established successfully.');
      return true;
    } catch (error: any) {
      currentTry++;
      
      // Enhanced error logging with more details
      console.error(`❌ Unable to connect to the database (attempt ${currentTry}/${retries}):`);
      console.error(`- Error name: ${error.name || 'Unknown'}`);
      console.error(`- Error message: ${error.message || 'No message'}`);
      
      // Log specific details for common errors
      if (error.name === 'SequelizeConnectionError') {
        console.error('- This is a connection error. Check if the database server is running and accessible.');
      } else if (error.name === 'SequelizeConnectionRefusedError') {
        console.error('- Connection refused. Check if the database server is running and the port is correct.');
      } else if (error.name === 'SequelizeHostNotFoundError') {
        console.error('- Host not found. Check if the database host is correct.');
      } else if (error.name === 'SequelizeAccessDeniedError') {
        console.error('- Access denied. Check if the database credentials are correct.');
      } else if (error.name === 'SequelizeConnectionTimedOutError') {
        console.error('- Connection timed out. Check if the database server is responding.');
      } else if (error.message && error.message.includes('please install pg')) {
        console.error('- The pg package is not properly loaded. This is likely an issue with the serverless environment.');
        console.error('- Trying to load pg package explicitly...');
        try {
          const pg = require('pg');
          console.log('- Successfully loaded pg package during error recovery');
        } catch (pgError) {
          console.error('- Failed to load pg package during error recovery:', pgError);
        }
      }
      
      if (currentTry >= retries) {
        console.error('⛔ Maximum connection attempts reached. Database connection failed.');
        
        // In production, we might want to notify administrators
        if (process.env.NODE_ENV === 'production') {
          // Here you could integrate with an error reporting service like Sentry
          console.error('⚠️ CRITICAL: Database connection failed in production environment');
        }
        
        return false;
      }
      
      // Wait before trying again
      console.log(`⏱️ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Initialize database with enhanced error handling
const initDb = async () => {
  console.log('🔄 Initializing database...');
  
  try {
    // First test the connection with retry logic
    console.log('🔄 Testing database connection...');
    const connectionSuccessful = await testConnection();
    
    // If connection failed, return false
    if (!connectionSuccessful) {
      console.error('❌ Database connection failed after multiple retries');
      return false;
    }
    
    // Import models with error handling
    console.log('🔄 Loading database models...');
    try {
      require('./models/User');
      console.log('✅ User model loaded successfully');
    } catch (userModelError) {
      console.error('❌ Error loading User model:', userModelError);
      return false;
    }
    
    try {
      require('./models/Invoice');
      console.log('✅ Invoice model loaded successfully');
    } catch (invoiceModelError) {
      console.error('❌ Error loading Invoice model:', invoiceModelError);
      return false;
    }
    
    // In production, we don't want to alter tables automatically
    // This should be done through migrations
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { alter: true }
      : { alter: false };
    
    console.log(`🔄 Synchronizing database with options: ${JSON.stringify(syncOptions)}`);
    
    try {
      await sequelize.sync(syncOptions);
      console.log('✅ Database synchronized successfully');
      return true;
    } catch (syncError: any) {
      console.error('❌ Error synchronizing database:');
      console.error(`- Error name: ${syncError.name || 'Unknown'}`);
      console.error(`- Error message: ${syncError.message || 'No message'}`);
      
      // Special handling for common sync errors
      if (syncError.name === 'SequelizeDatabaseError') {
        console.error('- This is a database error. Check if the tables can be created/altered.');
      } else if (syncError.name === 'SequelizeConnectionError') {
        console.error('- This is a connection error. The connection might have been lost during sync.');
      } else if (syncError.message && syncError.message.includes('please install pg')) {
        console.error('- The pg package is not properly loaded. This is likely an issue with the serverless environment.');
        console.error('- Trying to load pg package explicitly...');
        try {
          const pg = require('pg');
          console.log('- Successfully loaded pg package during error recovery');
        } catch (pgError) {
          console.error('- Failed to load pg package during error recovery:', pgError);
        }
      }
      
      // In production, we might want to notify administrators
      if (process.env.NODE_ENV === 'production') {
        // Here you could integrate with an error reporting service like Sentry
        console.error('⚠️ CRITICAL: Database synchronization failed in production environment');
      }
      
      return false;
    }
  } catch (error: any) {
    console.error('❌ Unexpected error during database initialization:');
    console.error(`- Error name: ${error.name || 'Unknown'}`);
    console.error(`- Error message: ${error.message || 'No message'}`);
    
    // In production, we might want to notify administrators
    if (process.env.NODE_ENV === 'production') {
      // Here you could integrate with an error reporting service like Sentry
      console.error('⚠️ CRITICAL: Unexpected error during database initialization in production environment');
    }
    
    return false;
  }
};

export { sequelize, testConnection, initDb };