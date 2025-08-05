# Invoice Generator Application

A full-stack invoice generator application built with React, Express.js, and PostgreSQL.

## Project Overview

This application allows users to:
- Create, edit, and manage invoices
- Save company information for reuse
- Download invoices as PDF
- Share invoices via links
- Manage user accounts and settings

## Technology Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- HTML2Canvas and jsPDF for PDF generation

### Backend
- Express.js for the API server
- PostgreSQL for the database
- Sequelize as the ORM
- JWT for authentication
- Bcrypt for password hashing

## Project Structure

The project is organized into two main directories:

### Client
The client directory contains the React frontend application:
```
client/
├── public/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── pages/            # Page components
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # Application entry point
│   └── index.css         # Global styles
├── package.json
└── tailwind.config.js
```

### Server
The server directory contains the Express.js backend application:
```
server/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get the current user's profile
- `POST /api/auth/forgot-password` - Request a password reset
- `GET /api/auth/verify-email/:token` - Verify a user's email

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

### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   DB_NAME=invoicegen
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `npm start`

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. The application will be available at `http://localhost:3000`

## Changes from Original Implementation

The original implementation used Firebase for authentication and Firestore for data storage. This version has been modified to use:

1. PostgreSQL with Sequelize ORM for data storage
2. Express.js for the backend API
3. JWT for authentication
4. Custom user management with email verification

The frontend React application has been restructured to work with the Express.js backend while maintaining the same functionality and user experience.

## Future Improvements

- Add unit and integration tests
- Implement email sending for verification and password reset
- Add more invoice templates and customization options
- Implement multi-language support
- Add support for recurring invoices
- Implement payment integration