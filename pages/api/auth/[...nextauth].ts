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
  await initializeAuth();
  
  // Only initialize adapter after DB is ready
  const adapter = SequelizeAdapter(sequelize);
  
  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
    ],
    adapter: adapter,
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
          // Add user ID to the session
          if (session.user && token.userId) {
            session.user.id = token.userId as string;
            
            // Add custom token to the session
            if (token.customToken) {
              session.customToken = token.customToken;
            }
          }
          
          return session;
        } catch (error) {
          console.error('Error in session callback:', error);
          return session;
        }
      },
    },
    debug: process.env.NODE_ENV === 'development',
  };
};

// Export a dynamic API handler that ensures DB is initialized
export default async function auth(req: any, res: any) {
  const authOptions = await getAuthOptions();
  return await NextAuth(req, res, authOptions);
}