# Deploying Invoice Generator to Vercel

This document provides step-by-step instructions for deploying the Invoice Generator application to Vercel with Google authentication.

## Prerequisites

Before deploying to Vercel, you need:

1. A [Vercel account](https://vercel.com/signup)
2. A [Google Cloud Platform account](https://console.cloud.google.com/) for Google OAuth
3. A PostgreSQL database (e.g., [Supabase](https://supabase.com/), [Heroku Postgres](https://www.heroku.com/postgres), or [Railway](https://railway.app/))
4. [Git](https://git-scm.com/) installed on your local machine
5. [Vercel CLI](https://vercel.com/docs/cli) (optional, but recommended)

## Step 1: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-app-name.vercel.app`
8. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-app-name.vercel.app/api/auth/callback/google`
9. Click "Create"
10. Note down the Client ID and Client Secret

## Step 2: Set Up a PostgreSQL Database

### Option 1: Supabase

1. Create a [Supabase](https://supabase.com/) account
2. Create a new project
3. Go to "Settings" > "Database"
4. Note down the database connection details:
   - Host
   - Port
   - Database name
   - User
   - Password
5. Enable SSL for the database connection

### Option 2: Heroku Postgres

1. Create a [Heroku](https://www.heroku.com/) account
2. Create a new app
3. Go to "Resources" and add the "Heroku Postgres" add-on
4. Go to "Settings" > "View Credentials"
5. Note down the database connection details

### Option 3: Railway

1. Create a [Railway](https://railway.app/) account
2. Create a new project
3. Add a PostgreSQL database
4. Go to "Connect" and note down the connection details

## Step 3: Deploy to Vercel

### Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Navigate to your project directory:
   ```
   cd path/to/invoicegen
   ```

4. Deploy to Vercel:
   ```
   vercel
   ```

5. Follow the prompts to configure your project
   - Link to an existing project or create a new one
   - Set the production branch (usually `main` or `master`)
   - Confirm the deployment

6. Set up environment variables:
   ```
   vercel env add DB_NAME
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add DB_HOST
   vercel env add DB_PORT
   vercel env add JWT_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

7. Deploy to production:
   ```
   vercel --prod
   ```

### Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Configure your project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
6. Click "Deploy"
7. Once deployed, go to "Settings" > "Environment Variables"
8. Add the following environment variables:
   - `DB_NAME`: Your database name
   - `DB_USER`: Your database user
   - `DB_PASSWORD`: Your database password
   - `DB_HOST`: Your database host
   - `DB_PORT`: Your database port (usually 5432)
   - `JWT_SECRET`: A secure random string for JWT encryption
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., https://your-app-name.vercel.app)
   - `NEXTAUTH_SECRET`: A secure random string for NextAuth.js
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `NEXT_PUBLIC_API_URL`: Your Vercel deployment URL (e.g., https://your-app-name.vercel.app)
9. Click "Save" and redeploy your application

## Step 4: Verify Deployment

1. Visit your deployed application (e.g., https://your-app-name.vercel.app)
2. Test the login and registration functionality
3. Test the Google authentication
4. Test the invoice creation and management functionality

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that your database credentials are correct
2. Ensure your database allows connections from Vercel's IP addresses
3. Verify that SSL is enabled for your database connection
4. Check the Vercel logs for any error messages

### Google Authentication Issues

If Google authentication is not working:

1. Verify that your Google OAuth credentials are correct
2. Check that the authorized redirect URIs are correctly configured
3. Ensure the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are set correctly
4. Check that the `NEXTAUTH_URL` is set to your Vercel deployment URL

### General Deployment Issues

If you encounter other deployment issues:

1. Check the Vercel deployment logs
2. Verify that all environment variables are set correctly
3. Ensure your code works locally before deploying
4. Try deploying with the Vercel CLI for more detailed error messages

## Maintenance

### Updating Your Application

To update your application:

1. Make changes to your code locally
2. Test your changes
3. Push your changes to your Git repository
4. Vercel will automatically redeploy your application

### Monitoring

Vercel provides basic monitoring for your application. For more advanced monitoring:

1. Consider integrating with a service like [Sentry](https://sentry.io/) for error tracking
2. Set up [Vercel Analytics](https://vercel.com/analytics) for performance monitoring
3. Use [Vercel Logs](https://vercel.com/docs/concepts/observability/logs) to debug issues

## Security Considerations

1. Always use environment variables for sensitive information
2. Use strong, unique passwords for your database and other services
3. Regularly update your dependencies to patch security vulnerabilities
4. Consider enabling two-factor authentication for your Vercel and Google Cloud accounts
5. Implement rate limiting for your API endpoints to prevent abuse

## Conclusion

Your Invoice Generator application is now deployed to Vercel with Google authentication. Users can sign in with their Google accounts or register with email and password. The application is production-ready and can be accessed from anywhere.