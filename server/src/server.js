// server.js
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

// Import new routes
const dealRoutes = require("./routes/dealRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invoiceRoutes = require("./routes/invoices");
const paymentRoutes = require("./routes/payments");
const webhookRoutes = require("./routes/webhooks");
const notificationRoutes = require("./routes/notifications");
const activityRoutes = require("./routes/activity.routes");

// Connect to database
connectDB();

// Mount routes (if you mount them here instead of app.js)
// If you have routes in app.js, add them there instead

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`📝 API endpoint: http://localhost:${env.PORT}/api`);
  console.log(`📡 Webhook endpoint: http://localhost:${env.PORT}/api/webhooks/stripe`);
  console.log(`📦 Order Management API loaded`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});