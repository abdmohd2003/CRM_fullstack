// backend/routes/callRoutes.js
const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

// Create a call record (for manual logging)
router.post('/', callController.createCall);

// Initiate a real call - THIS MUST BE BEFORE /:callId routes
router.post('/initiate', callController.initiateCall);

// Log a call (with entity association)
router.post('/log', callController.logCall);

// Get call history
router.get('/history/:entityType/:entityId', callController.getCallHistory);

// Get call statistics
router.get('/statistics/:entityType/:entityId', callController.getCallStatistics);

// Get call status
router.get('/status/:callId', callController.getCallStatus);

// End a call
router.post('/end/:callId', callController.endCall);

module.exports = router;