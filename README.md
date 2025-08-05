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

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Database Configuration
   DB_NAME=invoicegen
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_change_this_in_production

   # Next.js
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. The application will be available at `http://localhost:3000`

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