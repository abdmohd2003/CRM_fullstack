# 🚀 Polished CRM - Customer Relationship Management System

A full-stack, modern **Customer Relationship Management (CRM)** platform built with cutting-edge web technologies. Polished CRM empowers businesses to manage customer relationships, sales pipelines, leads, orders, payments, and business activities efficiently. It features an AI-powered CRM Assistant that helps users retrieve data through natural language queries.

---

## 📋 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Requirements](#-requirements)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)

---

## 📝 About

Polished CRM is a comprehensive solution for managing customer relationships, sales processes, and business operations. The platform provides intuitive interfaces for sales teams, managers, and business administrators to track leads, manage deals, monitor payments, and maintain customer communications all in one place.

**Key Highlights:**
- Modern, responsive UI built with React
- Secure RESTful API with JWT authentication
- Real-time notifications and activity tracking
- AI-powered intelligent data retrieval
- Payment processing with Stripe integration
- Multi-role access control
- Email notifications and communications
- Order and invoice management

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - UI framework with React Hooks
- **Vite 8** - Lightning-fast build tool and dev server
- **Redux Toolkit & React-Redux** - State management
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **Recharts** - Data visualization and charts
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **Papa Parse** - CSV parsing library
- **Lucide React** - Modern icon set
- **ESLint** - Code quality and linting

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18** - Web framework
- **MongoDB 7.5** - NoSQL database via Mongoose ODM
- **JWT (jsonwebtoken)** - Authentication and authorization
- **bcrypt & bcryptjs** - Password encryption
- **Multer** - File upload handling
- **Nodemailer** - Email sending
- **Resend** - Email delivery service
- **Stripe** - Payment processing
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Dotenv** - Environment variable management

### AI Integration
- **OpenAI SDK** - AI-powered responses
- **Google Generative AI** - Alternative AI provider
- **Anthropic SDK** - Claude AI integration

### Deployment
- **Vercel** - Frontend deployment
- **Docker-ready** - Backend containerization support

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based secure authentication
- Protected API routes with role-based access control
- Password encryption with bcrypt
- Session management

### 👥 Lead Management
- Create, read, update, and delete leads
- Lead status tracking and pipeline management
- Advanced search and filtering capabilities
- Lead assignment to team members
- Lead source tracking
- Activity history per lead

### 🏢 Company Management
- Manage company information and profiles
- Associate multiple leads with companies
- Company-level activity tracking
- Company performance metrics

### 🤝 Deal Management
- Create and manage sales deals
- Deal stage tracking (Prospecting, Negotiation, Won, Lost)
- Revenue forecasting
- Deal timeline and history
- Associated products and services
- Win/loss analysis

### 📦 Product Management
- Create and maintain product catalog
- Product pricing and descriptions
- Product inventory tracking
- Product bundling
- Search and categorization

### 💰 Order Management
- Create customer orders
- Real-time order status tracking
- Multiple payment integration
- Order history and analytics
- Batch order operations

### 💳 Payment & Invoice Management
- Invoice generation and management
- Multiple payment method support
- Stripe payment processing integration
- Payment status tracking
- Automated invoice notifications
- Webhook support for payment confirmations

### 🎫 Ticket Management
- Support ticket system
- Ticket status tracking
- Priority levels and assignment
- Response time tracking
- Ticket comments and attachments

### 📧 Communication & Notifications
- Email notifications for important events
- In-app notifications and alerts
- Email integration with Resend
- Call management and tracking
- Meeting scheduling and notes
- Chat functionality

### 📊 Activity Tracking
- Comprehensive activity logs
- Task management
- Meeting notes and follow-ups
- Activity filtering and search
- Team activity dashboard

### 🤖 AI-Powered CRM Assistant
- Natural language queries to retrieve CRM data
- Intelligent data summarization
- AI-powered insights and recommendations
- Multi-AI provider support (OpenAI, Google Generative AI, Anthropic)

### 📎 File Management
- Document and file attachments
- File upload and download
- File organization and categorization

### 📈 Reporting & Analytics
- Sales pipeline visualization
- Revenue charts and metrics
- Performance dashboards
- Data export capabilities

---

## 📦 Requirements

### Minimum Requirements
- **Node.js**: v14.0 or higher
- **npm**: v6.0 or higher (or yarn)
- **MongoDB**: v4.4 or higher (local or Atlas)
- **Git**: For version control

### Recommended Specifications
- **Node.js**: v18.0 or higher
- **RAM**: 4GB minimum
- **Storage**: 2GB free space
- **Internet**: Required for API calls and cloud services

### External Services (Optional but Recommended)
- **MongoDB Atlas** - Cloud MongoDB database
- **Stripe Account** - Payment processing
- **OpenAI/Google Generative AI Account** - AI features
- **Vercel Account** - Frontend deployment
- **Resend Account** - Email service

---

## 📂 Project Structure

```
crm/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # React entry point
│   │   ├── components/             # Reusable React components
│   │   │   ├── activity/          # Activity-related components
│   │   │   ├── cards/             # Card components
│   │   │   ├── common/            # Common/shared components
│   │   │   ├── forms/             # Form components
│   │   │   ├── otp/               # OTP verification components
│   │   │   ├── tables/            # Table components
│   │   │   └── ui/                # UI utility components
│   │   ├── pages/                  # Page components
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── auth/              # Authentication pages
│   │   │   ├── companies/         # Company management pages
│   │   │   ├── deals/             # Deal management pages
│   │   │   ├── leads/             # Lead management pages
│   │   │   ├── orders/            # Order management pages
│   │   │   ├── payments/          # Payment pages
│   │   │   └── tickets/           # Ticket management pages
│   │   ├── contexts/              # React contexts
│   │   │   ├── AuthContexts.jsx   # Authentication context
│   │   │   └── orderContext.jsx   # Order context
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.js         # Auth hook
│   │   │   ├── useModal.js        # Modal management
│   │   │   ├── useTable.js        # Table utilities
│   │   │   └── useTabs.js         # Tab management
│   │   ├── redux/                  # Redux state management
│   │   │   ├── store.js           # Redux store configuration
│   │   │   └── slices/            # Redux slices
│   │   ├── services/               # API service calls
│   │   │   ├── authService.jsx    # Authentication API
│   │   │   ├── leadService.jsx    # Lead API
│   │   │   ├── companyService.jsx # Company API
│   │   │   ├── dealService.jsx    # Deal API
│   │   │   ├── orderService.jsx   # Order API
│   │   │   └── ...                # Other services
│   │   ├── api/                    # API configuration
│   │   │   └── axiosConfig.jsx    # Axios setup
│   │   ├── utils/                  # Utility functions
│   │   │   └── privateRoute.jsx   # Protected routes
│   │   ├── App.css                # App styles
│   │   └── index.css              # Global styles
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── eslint.config.js           # ESLint configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── index.html                 # HTML entry point
│   └── README.md                  # Frontend README
│
├── server/                         # Backend Node.js application
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Configuration files
│   │   │   ├── db.js              # Database connection
│   │   │   ├── env.js             # Environment setup
│   │   │   └── config.env         # Environment variables
│   │   ├── controllers/           # Route controllers
│   │   │   ├── auth.controller.js # Authentication logic
│   │   │   ├── lead.controller.js # Lead management
│   │   │   ├── company.controller.js # Company logic
│   │   │   ├── deal.controller.js # Deal management
│   │   │   ├── order.controller.js # Order logic
│   │   │   ├── payment.controller.js # Payment handling
│   │   │   └── ...                # Other controllers
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.js            # User model
│   │   │   ├── Lead.js            # Lead model
│   │   │   ├── Company.js         # Company model
│   │   │   ├── Deal.js            # Deal model
│   │   │   ├── Order.js           # Order model
│   │   │   ├── Payment.js         # Payment model
│   │   │   └── ...                # Other models
│   │   ├── routes/                # API routes
│   │   │   ├── auth.routes.js     # Authentication endpoints
│   │   │   ├── lead.routes.js     # Lead endpoints
│   │   │   ├── company.routes.js  # Company endpoints
│   │   │   ├── deal.routes.js     # Deal endpoints
│   │   │   ├── order.routes.js    # Order endpoints
│   │   │   └── ...                # Other routes
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.js # JWT verification
│   │   │   ├── error.middleware.js # Error handling
│   │   │   ├── role.middleware.js # Role-based access
│   │   │   └── validate.middleware.js # Input validation
│   │   ├── services/              # Business logic services
│   │   ├── repositories/          # Database operations
│   │   ├── validators/            # Input validation schemas
│   │   ├── utils/                 # Utility functions
│   │   ├── scripts/               # Utility scripts
│   │   ├── uploads/               # File upload directory
│   │   └── tests/                 # Test files
│   ├── package.json               # Backend dependencies
│   ├── README.md                  # Backend README
│   └── testEmail.js               # Email testing script
│
└── README.md                       # This file
```

---

## 🚀 Setup Instructions

### Prerequisites
1. Install **Node.js** (v14+) and **npm** (v6+)
2. Install **MongoDB** or create a free account on **MongoDB Atlas**
3. Install **Git**
4. Create accounts for external services (Stripe, OpenAI, etc.) - optional

### Step 1: Clone the Repository

```bash
git clone https://git.upcode.in/upcode/crm-live-project-batch-9-frontend-c.git
cd crm
```

### Step 2: Setup Backend

#### 2.1 Navigate to server directory
```bash
cd server
```

#### 2.2 Install dependencies
```bash
npm install
```

#### 2.3 Create environment file
```bash
cp .env.example .env
# OR manually create src/config/config.env
```

#### 2.4 Configure environment variables (see [Environment Variables](#-environment-variables) section)

#### 2.5 Start the backend
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000` (or your configured PORT)

### Step 3: Setup Frontend

#### 3.1 Navigate to client directory
```bash
cd ../client
```

#### 3.2 Install dependencies
```bash
npm install
```

#### 3.3 Create environment file (if needed)
```bash
# Create .env file in client directory
echo "VITE_API_URL=http://localhost:5000" > .env
```

#### 3.4 Start the development server
```bash
npm run dev
```

The frontend will open automatically at `http://localhost:5173`

---

## ⚙️ Configuration

### Database Setup

#### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with a secure password
4. Whitelist your IP address (or use 0.0.0.0 for development)
5. Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

#### Option 2: Local MongoDB
1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Windows
   net start MongoDB
   
   # Linux
   sudo systemctl start mongod
   ```
3. Connection string: `mongodb://localhost:27017/crm_db`

### Stripe Setup (for payments)
1. Create account at [Stripe](https://stripe.com)
2. Get API keys from Dashboard > Developers > API Keys
3. Add to environment variables: `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`
4. Set webhook endpoint secret: `STRIPE_WEBHOOK_SECRET`

### Email Service Setup (Resend)
1. Create account at [Resend](https://resend.com)
2. Get API key from dashboard
3. Add to environment variables: `RESEND_API_KEY`

### AI Services Setup (Optional)
- **OpenAI**: Create account, get API key from [platform.openai.com](https://platform.openai.com)
- **Google Generative AI**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)

---

## 🏃 Running the Application

### Full Stack Local Development

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

**Frontend:**
```bash
cd client
npm run build
# Output in dist/ folder
```

**Backend:**
```bash
cd server
npm run build  # (if using TypeScript/build step)
NODE_ENV=production npm start
```

---

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Leads
- `GET /leads` - Get all leads
- `POST /leads` - Create new lead
- `GET /leads/:id` - Get lead by ID
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead

#### Companies
- `GET /companies` - Get all companies
- `POST /companies` - Create new company
- `GET /companies/:id` - Get company by ID
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

#### Deals
- `GET /deals` - Get all deals
- `POST /deals` - Create new deal
- `GET /deals/:id` - Get deal by ID
- `PUT /deals/:id` - Update deal
- `DELETE /deals/:id` - Delete deal

#### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

#### Payments
- `GET /payments` - Get all payments
- `POST /payments/process` - Process payment (Stripe)
- `GET /payments/:id` - Get payment by ID
- `POST /webhooks/stripe` - Stripe webhook handler

#### Products
- `GET /products` - Get all products
- `POST /products` - Create new product
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

#### Users
- `GET /users` - Get all users
- `POST /users` - Create new user
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Tickets
- `GET /tickets` - Get all tickets
- `POST /tickets` - Create new ticket
- `GET /tickets/:id` - Get ticket by ID
- `PUT /tickets/:id` - Update ticket
- `DELETE /tickets/:id` - Delete ticket

#### Activities
- `GET /activities` - Get all activities
- `POST /activities` - Create new activity
- `GET /activities/:id` - Get activity by ID
- `DELETE /activities/:id` - Delete activity

#### AI Assistance
- `POST /chat` - Send natural language query to AI

For complete API documentation, refer to API documentation tools like Postman or Swagger.

---

## 🔐 Environment Variables

Create `.env` file in the `server` directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db
DATABASE_NAME=crm_db

# Server
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRY=7d

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Generative AI
GOOGLE_API_KEY=...

# Anthropic
ANTHROPIC_API_KEY=...

# Email Configuration (if using Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=debug
```

For frontend, create `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Polished CRM
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Test Stripe Webhooks
```bash
cd server
npm run test:webhook
npm run test:webhook:success
npm run test:webhook:failure
npm run test:webhook:refund
```

### Test Email Sending
```bash
cd server
node testEmail.js
```

---

## 📤 Deployment

### Frontend Deployment (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-deploys on push

```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend Deployment Options

#### Option 1: Render.com
1. Create account at [render.com](https://render.com)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Option 2: Railway.app
1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Option 3: Heroku (Legacy)
1. Install Heroku CLI
2. `heroku login`
3. `heroku create your-app-name`
4. `git push heroku main`

---

## 🐛 Troubleshooting

### Database Connection Issues
- Check MongoDB connection string
- Verify database user credentials
- Ensure IP is whitelisted (MongoDB Atlas)
- Check if MongoDB service is running (local)

### CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in `app.js`
- Ensure API and frontend are on same/compatible origins

### JWT Authentication Fails
- Verify `JWT_SECRET` is set
- Check token expiry time
- Ensure token is included in request headers

### File Upload Issues
- Check `UPLOAD_PATH` directory exists
- Verify `MAX_FILE_SIZE` setting
- Ensure write permissions on upload directory

### Payment Processing Errors
- Verify Stripe API keys are correct
- Check webhook secret is set
- Ensure Stripe test mode is enabled for testing

---

## 📝 License

This project is licensed under the **ISC License** - see LICENSE file for details.

---

## 👥 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow ESLint rules for frontend
- Use meaningful variable and function names
- Add comments for complex logic
- Test your changes before submitting PR

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Open an issue on the repository
- Contact the development team
- Check existing documentation

---

## 🙏 Acknowledgments

- React & Vite communities
- Express.js ecosystem
- MongoDB documentation
- All contributors and team members

---

**Last Updated**: 2026-07-21

**Version**: 1.0.0

**Status**: Active Development

---

*Built with ❤️ by the CRM Development Team*
