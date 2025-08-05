import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import SequelizeAdapter from '@auth/sequelize-adapter';
import { sequelize } from '../../../lib/db/db';
import { User } from '../../../lib/db/models';
import jwt from 'jsonwebtoken';

// Initialize the Sequelize adapter
const adapter = SequelizeAdapter(sequelize);

export const authOptions: NextAuthOptions = {
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
      // Only allow Google sign-in
      if (account?.provider !== 'google') {
        return false;
      }
      
      // Check if user exists in our database
      if (user.email) {
        const existingUser = await User.findOne({ where: { email: user.email } });
        
        if (existingUser) {
          // Update user with Google info if not already set
          if (!existingUser.googleId) {
            await existingUser.update({
              googleId: profile.sub,
              name: user.name,
              image: user.image,
              emailVerified: true,
            });
          }
        } else {
          // Create new user
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: profile.sub,
            emailVerified: true,
          });
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      // Add custom claims to the JWT token
      if (user) {
        token.userId = user.id;
        
        // Create a JWT token compatible with our existing auth system
        const customToken = jwt.sign(
          { id: user.id },
          process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
          { expiresIn: '7d' }
        );
        
        token.customToken = customToken;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID to the session
      if (session.user) {
        session.user.id = token.userId as string;
        
        // Add custom token to the session
        session.customToken = token.customToken as string;
      }
      
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);