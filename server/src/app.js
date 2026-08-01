const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/error.middleware');
const env = require('./config/env');

// ============ YOUR ROUTES (HEAD) ============
const companyRoutes = require('./routes/company.routes');
const ticketRoutes = require('./routes/ticket.routes');

// ============ OTHER DEVELOPER'S ROUTES (leads branch) ============
const dealRoutes = require('./routes/dealRoutes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const productRoutes = require('./routes/product.routes');
const activityRoutes = require('./routes/activity.routes');
const chatRoutes = require('./routes/chat.routes');
const emailRouter = require("./routes/email.route");
const aiSummaryRoutes = require("./routes/aiSummary");

// ============ ATTACHMENT ROUTES ============
const attachmentRoutes = require('./routes/attachment.routes');

// ============ NEW ORDER-TO-PAYMENT ROUTES ============
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Stripe raw body parser (must come before express.json() for signature verification)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  // Pass to webhook controller
  const webhookController = require('./controllers/webhookController');
  webhookController.handleStripeWebhook(req, res);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());

// CORS middleware
// Dynamic CORS middleware to accept localhost, production, and all Vercel preview domains
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://crm-software-frontend-one.vercel.app'
    ];

    // Check if origin matches allowed list OR is any subdomain on vercel.app
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Cache control middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM Backend API is running"
  });
});
// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: null
  });
});

// ============ API ROUTES ============

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Existing CRM routes
app.use('/api/deals', dealRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/emails", emailRouter);
app.use("/api", aiSummaryRoutes);

// ============ NEW ORDER-TO-PAYMENT ROUTES ============
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);

// ============ ATTACHMENT ROUTES ============
app.use('/api', attachmentRoutes);

// Global 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;