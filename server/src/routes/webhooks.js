// routes/webhooks.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Note: Stripe raw endpoint /stripe is also registered directly in app.js 
// BEFORE express.json() to enable signature verification.
router.post('/stripe', (req, res) => {
  webhookController.handleStripeWebhook(req, res);
});

// Generic webhook endpoint for other providers
router.post('/generic', (req, res) => {
  webhookController.handleGenericWebhook(req, res);
});

// Test webhook endpoint (for development)
router.post('/test', (req, res) => {
  webhookController.testWebhook(req, res);
});

module.exports = router;