import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import SequelizeAdapter from '@auth/sequelize-adapter';
import { sequelize, initDb } from '../../../lib/db/db';
import { User } from '../../../lib/db/models';
import jwt from 'jsonwebtoken';

// Extend the Session type to include our custom properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    customToken?: string;
  }
}

// Extend the JWT type to include our custom properties
declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    customToken?: string;
  }
}

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'NEXTAUTH_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  // Warn about using default JWT secret in production
  if (process.env.NODE_ENV === 'production' && 
      process.env.JWT_SECRET === 'your_jwt_secret_key_change_this_in_production') {
    console.error('WARNING: Using default JWT_SECRET in production environment!');
  }
};

// Track database initialization state
let dbInitialized = false;
let dbInitializationPromise: Promise<boolean> | null = null;

// Initialize database and adapter
const initializeAuth = async () => {
  // Only initialize once
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  // Validate environment variables first
  validateEnvVars();

  // Initialize database with a promise we can track
  dbInitializationPromise = initDb().then(success => {
    dbInitialized = success;
    if (!success) {
      console.error('Failed to initialize database for NextAuth');
    } else {
      console.log('Database initialized successfully for NextAuth');
    }
    return success;
  }).catch(error => {
    console.error('Error initializing database for NextAuth:', error);
    return false;
  });

  return dbInitializationPromise;
};

// Create auth options function that ensures DB is initialized
const getAuthOptions = async (): Promise<NextAuthOptions> => {
  // Wait for database initialization
  const dbInitSuccess = await initializeAuth();
  
  let adapter;
  try {
    // Only initialize adapter after DB is ready
    console.log('Initializing SequelizeAdapter...');
    adapter = SequelizeAdapter(sequelize);
    console.log('SequelizeAdapter initialized successfully');
  } catch (adapterError) {
    console.error('Error initializing SequelizeAdapter:', adapterError);
    // Continue without adapter if it fails to initialize
    // This will fall back to JWT-only mode
    console.warn('Falling back to JWT-only mode (no database adapter)');
  }
  
  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
    ],
    // Only include adapter if it was successfully initialized
    ...(adapter ? { adapter } : {}),
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
      signIn: '/login',
      signOut: '/login',
      error: '/login',
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        try {
          // Only allow Google sign-in
          if (account?.provider !== 'google') {
            return false;
          }
          
          // Check if database is initialized
          if (!dbInitialized) {
            console.error('Database not initialized during sign-in attempt');
            return false;
          }
          
          // Check if user exists in our database
          if (user.email) {
            try {
              const existingUser = await User.findOne({ where: { email: user.email } });
              
              if (existingUser) {
                // Update user with Google info if not already set
                if (!existingUser.googleId && profile) {
                  await existingUser.update({
                    googleId: profile.sub as string,
                    name: user.name || undefined,
                    image: user.image || undefined,
                    emailVerified: true,
                  });
                }
              } else {
                // Create new user
                await User.create({
                  email: user.email,
                  name: user.name || undefined,
                  image: user.image || undefined,
                  googleId: profile ? (profile.sub as string) : undefined,
                  emailVerified: true,
                });
              }
            } catch (dbError) {
              console.error('Database error during sign-in:', dbError);
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      },
      async jwt({ token, user }) {
        try {
          // Add custom claims to the JWT token
          if (user) {
            token.userId = user.id;
            
            // Get JWT secret with validation
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
              console.error('JWT_SECRET is not defined');
              throw new Error('JWT_SECRET is not defined');
            }
            
            // Create a JWT token compatible with our existing auth system
            const customToken = jwt.sign(
              { id: user.id },
              jwtSecret,
              { expiresIn: '7d' }
            );
            
            token.customToken = customToken;
          }
          
          return token;
        } catch (error) {
          console.error('Error in jwt callback:', error);
          return token;
        }
      },
      async session({ session, token }) {
        try {
          console.log('Session callback called with token:', { 
            hasToken: !!token,
            tokenKeys: token ? Object.keys(token) : [],
            hasUserId: !!token?.userId
          });
          
          // Create a safe copy of the session to avoid mutation issues
          const safeSession = { ...session };
          
          // Ensure user object exists
          if (!safeSession.user) {
            console.warn('Session callback: session.user is undefined, creating empty user object');
            safeSession.user = { id: '', name: null, email: null, image: null };
          }
          
          // Add user ID to the session if available in token
          if (token?.userId) {
            safeSession.user.id = token.userId as string;
            
            // Add custom token to the session if available
            if (token.customToken) {
              safeSession.customToken = token.customToken;
            }
          } else {
            // Log warning if token is missing expected properties
            console.warn('Session callback: token is missing userId', { 
              hasToken: !!token,
              tokenKeys: token ? Object.keys(token) : []
            });
            
            // Ensure user has an ID even if token doesn't provide one
            if (!safeSession.user.id) {
              safeSession.user.id = '';
            }
          }
          
          // Ensure expires field exists
          if (!safeSession.expires) {
            console.warn('Session callback: session.expires is undefined, setting default expiry');
            safeSession.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
          }
          
          console.log('Session callback returning session with user ID:', safeSession.user.id);
          return safeSession;
        } catch (error) {
          console.error('Error in session callback:', error);
          
          // Return a basic session object to prevent complete failure
          // This allows the application to continue functioning with limited capabilities
          return {
            user: { id: '', name: null, email: null, image: null },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          };
        }
      },
    },
    debug: process.env.NODE_ENV === 'development',
  };
};

// Export a dynamic API handler that ensures DB is initialized
export default async function auth(req: any, res: any) {
  // Log request details for all environments to help with debugging
  console.log(`NextAuth request: ${req.method} ${req.url}`);
  
  try {
    // Initialize database first to ensure it's ready
    console.log('Initializing auth database connection...');
    const dbInitResult = await initializeAuth();
    console.log('Database initialization result:', dbInitResult);
    
    // Get auth options (this will initialize the adapter if database is ready)
    console.log('Getting NextAuth options...');
    const authOptions = await getAuthOptions();
    
    // Add more detailed logging
    console.log('NextAuth handler processing request:', {
      path: req.url,
      method: req.method,
      hasAdapter: !!authOptions.adapter,
      providers: authOptions.providers.map(p => p.id).join(', '),
      sessionStrategy: authOptions.session?.strategy || 'default'
    });
    
    // Special handling for session endpoint to ensure it never fails with 500
    if (req.url.includes('/api/auth/session')) {
      console.log('Processing session request - applying enhanced error handling');
      try {
        return await NextAuth(req, res, authOptions);
      } catch (sessionError) {
        console.error('Error in session endpoint:', sessionError);
        
        // For session endpoint, return an empty but valid session instead of error
        // This prevents client-side auth failures and allows graceful degradation
        return res.status(200).json({
          user: null,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    // For other auth endpoints, use standard NextAuth with error handling
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error('Critical error in NextAuth handler:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    
    // Check if response has already been sent
    if (res.headersSent) {
      console.warn('Headers already sent, cannot send error response');
      return;
    }
    
    // Return a proper error response instead of throwing
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}