import { Sequelize } from 'sequelize';

// Initialize Sequelize with environment variables
let sequelize: Sequelize;

// Check if running on Vercel with Vercel Postgres
if (process.env.POSTGRES_URL) {
  console.log('Using Vercel Postgres connection');
  // Use the Vercel Postgres connection string
  sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
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
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    }
  );
}

// Test the connection with retry logic
const testConnection = async (retries = 5, delay = 5000) => {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return true;
    } catch (error) {
      currentTry++;
      console.error(`Unable to connect to the database (attempt ${currentTry}/${retries}):`, error);
      
      if (currentTry >= retries) {
        console.error('Maximum connection attempts reached. Database connection failed.');
        
        // In production, we might want to notify administrators
        if (process.env.NODE_ENV === 'production') {
          // Here you could integrate with an error reporting service like Sentry
          console.error('CRITICAL: Database connection failed in production environment');
        }
        
        return false;
      }
      
      // Wait before trying again
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Initialize database
const initDb = async () => {
  try {
    // First test the connection with retry logic
    const connectionSuccessful = await testConnection();
    
    // If connection failed, return false
    if (!connectionSuccessful) {
      console.error('Database connection failed after multiple retries');
      return false;
    }
    
    // Import models
    require('./models/User');
    require('./models/Invoice');
    
    // In production, we don't want to alter tables automatically
    // This should be done through migrations
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { alter: true }
      : { alter: false };
    
    await sequelize.sync(syncOptions);
    console.log('Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('Error synchronizing database:', error);
    
    // In production, we might want to notify administrators
    if (process.env.NODE_ENV === 'production') {
      // Here you could integrate with an error reporting service like Sentry
      console.error('CRITICAL: Database synchronization failed in production environment');
    }
    
    return false;
  }
};

export { sequelize, testConnection, initDb };