# Vercel Deployment Guide

This document provides instructions for deploying the Invoice Generator application to Vercel.

## Environment Variables

Set up the following environment variables in the Vercel dashboard under Project Settings > Environment Variables:

### Database Configuration
- `DB_NAME`: Your PostgreSQL database name
- `DB_USER`: Your PostgreSQL username
- `DB_PASSWORD`: Your PostgreSQL password
- `DB_HOST`: Your PostgreSQL host (e.g., from a managed PostgreSQL service)
- `DB_PORT`: Your PostgreSQL port (typically 5432)

### Authentication
- `JWT_SECRET`: Secret key for JWT authentication (generate a strong random string)

### Other
- `NODE_ENV`: Set to "production"
- Any other environment variables your application needs

## Database Setup

Since Vercel functions are serverless, you should use a managed PostgreSQL service. Options include:

1. **Vercel Postgres**: Vercel's built-in PostgreSQL service
2. **Supabase**: Offers a generous free tier with PostgreSQL
3. **Neon**: Serverless PostgreSQL specifically designed for this use case
4. **Railway**: Simple setup with reasonable free tier
5. **Heroku Postgres**: Reliable but requires a paid plan
6. **AWS RDS**: Enterprise-grade but more complex to set up

### Database Connection String

If your database provider offers a connection string, you can use that instead of individual parameters by adding a `DATABASE_URL` environment variable and modifying the `db.js` file to use it.

## SSL Configuration

Many managed PostgreSQL services require SSL connections. If needed, update the database configuration in `server/src/config/db.js` to include SSL options:

```
{
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Set to true in production with proper certificates
    }
  }
}
```

## Deployment Steps

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy your application:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

## Monitoring and Logs

- Use Vercel's built-in logs and monitoring to troubleshoot any issues after deployment
- Check the Function Logs in the Vercel dashboard for backend errors
- Use the Deployment Inspector to verify build outputs

## Custom Domain

To use a custom domain:

1. Go to the Vercel dashboard
2. Select your project
3. Navigate to "Domains"
4. Add your domain and follow the instructions to configure DNS

## Limitations and Considerations

1. **Cold Starts**: Serverless functions may experience cold starts, which can cause the first request after inactivity to be slower
2. **Execution Time**: Vercel functions have a maximum execution time of 10 seconds (on the free plan)
3. **Database Connections**: Be mindful of connection limits on your database service
4. **Statelessness**: Serverless functions are stateless, so don't rely on local file storage or memory between invocations

## Troubleshooting

If you encounter issues:

1. Check the Vercel build logs for any errors during deployment
2. Verify that all environment variables are correctly set
3. Ensure your database is accessible from Vercel's servers
4. Check that your database schema is properly initialized
5. Test API endpoints using tools like Postman or curl

## Local Development vs Production

The application is configured to behave differently in development and production:

- In development, the server starts normally and listens on a port
- In production, the server runs as a serverless function
- Database initialization happens on first request in production

This setup ensures a smooth development experience while optimizing for serverless deployment.