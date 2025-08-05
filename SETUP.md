# Invoice Generator Application Setup Guide

This guide will help you set up and run the Invoice Generator application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
2. **PostgreSQL** (v12 or higher)

## Database Setup

1. Install PostgreSQL if you haven't already:
   - For macOS: `brew install postgresql`
   - For Ubuntu/Debian: `sudo apt-get install postgresql`
   - For Windows: Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

2. Start the PostgreSQL service:
   - For macOS: `brew services start postgresql`
   - For Ubuntu/Debian: `sudo service postgresql start`
   - For Windows: PostgreSQL should start automatically as a service

3. Create a database for the application:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE invoicegen;
   
   # Exit psql
   \q
   ```

## Application Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd invoicegen
   ```

2. Install dependencies for the root project, client, and server:
   ```bash
   npm run install-all
   ```
   
   Alternatively, you can install dependencies separately:
   ```bash
   # Root project
   npm install
   
   # Client
   cd client
   npm install
   cd ..
   
   # Server
   cd server
   npm install
   cd ..
   ```

3. Configure environment variables:
   - The server uses a `.env` file for configuration
   - A default `.env` file has been created in the server directory
   - Update the database connection details if necessary

## Running the Application

1. Start both the client and server in development mode:
   ```bash
   npm run dev
   ```

   This will start:
   - The React frontend on http://localhost:3000
   - The Express.js backend on http://localhost:5000

2. Alternatively, you can start the client and server separately:
   ```bash
   # Start the client
   npm run client
   
   # Start the server
   npm run server
   ```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify that PostgreSQL is running:
   ```bash
   # For macOS/Linux
   ps aux | grep postgres
   
   # For Windows
   tasklist | findstr postgres
   ```

2. Check the database connection settings in `server/.env`:
   ```
   DB_NAME=invoicegen
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. Ensure the database exists:
   ```bash
   psql -U postgres -c "\l" | grep invoicegen
   ```

### API Connection Issues

If the client cannot connect to the API:

1. Verify that the server is running on port 5000
2. Check that the client's proxy setting in `client/package.json` is set to `"http://localhost:5000"`
3. Ensure there are no CORS issues by checking the server logs

## Production Deployment

For production deployment, refer to the `VERCEL_DEPLOYMENT.md` file for instructions on deploying the application to Vercel.