# Invoice Generator Application

A full-stack invoice generator application built with Next.js, React, and PostgreSQL.

## Project Overview

This application allows users to:
- Create, edit, and manage invoices
- Save company information for reuse
- Download invoices as PDF
- Share invoices via links
- Manage user accounts and settings

## Technology Stack

### Frontend
- Next.js for server-side rendering and API routes
- React with TypeScript
- Axios for API requests
- Tailwind CSS for styling
- HTML2Canvas and jsPDF for PDF generation

### Backend
- Next.js API routes
- PostgreSQL for the database
- Sequelize as the ORM
- JWT for authentication
- Bcrypt for password hashing

## Project Structure

The project follows the Next.js structure:

```
invoicegen/
├── components/         # Reusable UI components
├── lib/                # Utility functions and modules
│   ├── context/        # React context providers
│   ├── db/             # Database connection and models
│   └── api-utils.ts    # API utility functions
├── pages/              # Page components and API routes
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── invoices/   # Invoice endpoints
│   │   └── users/      # User endpoints
│   ├── invoice/        # Invoice view page
│   ├── _app.tsx        # Main application component
│   ├── index.tsx       # Home page
│   └── [...].tsx       # Other pages
├── public/             # Static assets
├── styles/             # Global styles
├── .env                # Environment variables
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
└── vercel.json         # Vercel deployment configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get the current user's profile
- `POST /api/auth/forgot-password` - Request a password reset
- `GET /api/auth/verify-email` - Verify a user's email

### Invoices
- `GET /api/invoices` - Get all invoices for the current user
- `GET /api/invoices/:id` - Get a specific invoice
- `POST /api/invoices` - Create a new invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice

### User Settings
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

## Database Schema

### Users
- id (UUID, primary key)
- email (string, unique)
- password (string, hashed)
- emailVerified (boolean)
- settings (JSONB)
- createdAt (timestamp)
- updatedAt (timestamp)

### Invoices
- id (UUID, primary key)
- invoiceNumber (string)
- invoiceDate (date)
- dueDate (date)
- logoUrl (string)
- sender (JSONB)
- recipient (JSONB)
- items (JSONB)
- currency (string)
- taxRate (float)
- subtotal (float)
- total (float)
- UserId (UUID, foreign key)
- createdAt (timestamp)
- updatedAt (timestamp)

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Local Development Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/invoicegen.git
   cd invoicegen
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the `.env.example` file to create your own `.env` file:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your own values:
   ```
   # Database Configuration
   DB_NAME=invoicegen
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432

   # JWT Secret - Generate a secure random string for production
   JWT_SECRET=your_jwt_secret_here

   # Next.js
   NEXT_PUBLIC_API_URL=http://localhost:3000

   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here

   # Google OAuth - Get these from the Google Cloud Console
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

   > **IMPORTANT SECURITY NOTE**: Never commit your `.env` file to version control. It contains sensitive information like database credentials and API keys. The `.env` file is already added to `.gitignore` to prevent accidental commits.

5. Start the development server:
   ```
   npm run dev
   ```

6. The application will be available at `http://localhost:3000`

## Deployment to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com) if you don't have one.

2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Login to Vercel:
   ```
   vercel login
   ```

4. Deploy the application:
   ```
   vercel
   ```

5. For production deployment:
   ```
   vercel --prod
   ```

6. Configure environment variables in the Vercel dashboard:
   - DB_NAME
   - DB_USER
   - DB_PASSWORD
   - DB_HOST
   - DB_PORT
   - JWT_SECRET
   - NEXT_PUBLIC_API_URL (set to your Vercel deployment URL)

## Database Setup

1. Create a PostgreSQL database:
   ```
   createdb invoicegen
   ```

2. The application will automatically create the necessary tables on startup.

## Setting Up Google OAuth

To enable Google authentication in the application:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add authorized JavaScript origins:
   - For local development: `http://localhost:3000`
   - For production: your domain (e.g., `https://yourdomain.com`)
8. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
9. Click "Create"
10. Copy the generated Client ID and Client Secret
11. Add these values to your `.env` file:
    ```
    GOOGLE_CLIENT_ID=your_client_id_here
    GOOGLE_CLIENT_SECRET=your_client_secret_here
    ```

> **SECURITY NOTE**: Never share your Client Secret with anyone or commit it to version control. If your credentials are compromised, you can regenerate them in the Google Cloud Console.

## Changes from Original Implementation

The original implementation used a separate client-server architecture with React for the frontend and Express.js for the backend. This version has been migrated to Next.js to leverage:

1. Server-side rendering for improved performance and SEO
2. API routes for backend functionality
3. Simplified deployment with a single codebase
4. Improved developer experience with a unified project structure

The core functionality remains the same, with users able to create, manage, and share invoices.

## Future Improvements

- Add unit and integration tests
- Implement email sending for verification and password reset
- Add more invoice templates and customization options
- Implement multi-language support
- Add support for recurring invoices
- Implement payment integration
- Add analytics dashboard for invoice tracking