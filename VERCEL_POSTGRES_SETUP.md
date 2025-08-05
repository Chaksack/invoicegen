# Vercel Postgres Setup Guide

## Overview

This document provides instructions on how to set up Vercel Postgres for the InvoiceGen application. The application is designed to use Vercel Postgres when deployed to Vercel, and a local PostgreSQL database for development.

## Current Issue

The application is currently experiencing database connection errors in production:

```
Using local PostgreSQL connection
Sequelize instance created successfully
🔄 Initializing database...
🔄 Testing database connection...
Testing database connection with the following configuration:
- Environment: production
- Using Vercel Postgres: false
- Dialect: postgres
❌ Unable to connect to the database (attempt 1/5):
- Error name: SequelizeConnectionRefusedError
- Error message: connect ECONNREFUSED 127.0.0.1:5432
- Connection refused. Check if the database server is running and the port is correct.
```

This error occurs because the application is trying to connect to a local PostgreSQL database in production, but there is no local PostgreSQL server running in the Vercel environment.

## Solution

The application has been updated to:

1. Detect when it's running in production without Vercel Postgres
2. Provide clear error messages and instructions
3. Improve error handling and logging

To fix the issue, you need to set up Vercel Postgres for your project.

## Setting Up Vercel Postgres

Follow these steps to set up Vercel Postgres for your project:

1. **Go to the Vercel Dashboard**
   - Log in to your Vercel account at https://vercel.com

2. **Select Your Project**
   - Navigate to the InvoiceGen project

3. **Go to the Storage Tab**
   - In the project dashboard, click on the "Storage" tab

4. **Create a New Postgres Database**
   - Click on "Create" or "Add New"
   - Select "Postgres"
   - Follow the prompts to create a new database
   - Choose the appropriate region (preferably close to your application deployment)

5. **Connect the Database to Your Project**
   - After creating the database, Vercel will prompt you to connect it to your project
   - Select the InvoiceGen project
   - Vercel will automatically add the `POSTGRES_URL` environment variable to your project

6. **Redeploy Your Application**
   - Trigger a new deployment to apply the changes
   - You can do this by making a small change to your code or using the "Redeploy" option in the Vercel dashboard

## Verifying the Setup

After setting up Vercel Postgres and redeploying your application, you should see the following in your logs:

```
Using Vercel Postgres connection
Connection URL (masked): postgres://username:****@host:port/database
Sequelize instance created successfully
🔄 Initializing database...
🔄 Testing database connection...
Testing database connection with the following configuration:
- Environment: production
- Using Vercel Postgres: true
- Dialect: postgres
✅ Database connection has been established successfully.
```

## Local Development Setup

For local development, the application will use the database configuration from your `.env` file. Make sure you have the following environment variables set:

```
DB_NAME=invoicegen
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

You'll need to have PostgreSQL installed and running locally with a database named `invoicegen`.

## Troubleshooting

If you continue to experience database connection issues after setting up Vercel Postgres:

1. **Check Environment Variables**
   - Verify that the `POSTGRES_URL` environment variable is set in your Vercel project settings
   - The variable should contain a valid PostgreSQL connection string

2. **Check Database Access**
   - Ensure that your Vercel deployment has network access to the Postgres database
   - Check if there are any IP restrictions on the database

3. **Check Database Status**
   - Verify that your Vercel Postgres database is active and running
   - Check the Vercel dashboard for any alerts or issues with the database

4. **Review Logs**
   - Check the application logs in the Vercel dashboard for detailed error messages
   - Look for any specific error codes or messages that might indicate the issue

## Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Sequelize Documentation](https://sequelize.org/master/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)