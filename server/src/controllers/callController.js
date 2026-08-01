// backend/controllers/callController.js
const Call = require('../models/Call');
const Activity = require('../models/Activity');

// Store active calls
const activeCalls = new Map();

// Helper function to get entity field name
const getEntityField = (entityType) => {
  const mapping = {
    'lead': 'lead',
    'company': 'company',
    'deal': 'deal',
    'ticket': 'ticket'
  };
  return mapping[entityType] || null;
};

// Helper function to log call activity
const logCallActivity = async ({ 
  entityId, 
  entityType, 
  callRecordId, 
  description, 
  callOutcome,
  connected,
  duration,
  phoneNumber,
  contactName,
  note,
  createdBy = 'Admin'
}) => {
  try {
    const entityField = getEntityField(entityType);
    if (!entityField) {
      throw new Error('Invalid entity type');
    }

    // Create activity data
    const activityData = {
      type: 'Call',
      description: description || `Call logged: ${callOutcome || 'Unknown'}`,
      activityDate: new Date(),
      [entityField]: entityId,
      itemRef: callRecordId, // Set itemRef to the call record ID
      metadata: {
        callRecordId: callRecordId || null,
        callOutcome: callOutcome || 'Logged',
        connected: connected || 'Yes',
        duration: duration || 0,
        phoneNumber: phoneNumber || '',
        contactName: contactName || '',
        note: note || '',
        timestamp: new Date().toISOString(),
        createdBy: createdBy
      },
      action: 'DEAL_STAGE_CHANGED'
    };

    // Create and save activity
    const activity = new Activity(activityData);
    await activity.save();

    return activity;
  } catch (error) {
    console.error('Error logging call activity:', error);
    throw error;
  }
};

// Create a call record (POST /api/calls)
exports.createCall = async (req, res) => {
  try {
    const { 
      connected, 
      callOutcome, 
      callDate, 
      note,
      createdBy,
      entityId,
      entityType,
      phoneNumber,
      contactName,
      duration
    } = req.body;

    // Validate required fields
    if (!connected || !callOutcome) {
      return res.status(400).json({ 
        success: false,
        error: 'Connected status and call outcome are required' 
      });
    }

    // Create call record
    const callRecord = new Call({
      connected,
      callOutcome,
      callDate: callDate || new Date(),
      note: note || '',
      createdBy: createdBy || req.user?.name || 'Admin'
    });

    await callRecord.save();

    // If entityId and entityType are provided, log to activity
    if (entityId && entityType) {
      await logCallActivity({
        entityId,
        entityType,
        callRecordId: callRecord._id,
        description: `Call logged: ${callOutcome}`,
        callOutcome,
        connected,
        duration: duration || 0,
        phoneNumber: phoneNumber || '',
        contactName: contactName || '',
        note: note || '',
        createdBy: createdBy || req.user?.name || 'Admin'
      });
    }

    res.status(201).json({
      success: true,
      data: callRecord
    });

  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create call record'
    });
  }
};

// Initiate a real call
exports.initiateCall = async (req, res) => {
  try {
    const { phoneNumber, contactName, entityId, entityType, offer } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }

    const callId = `call_${Date.now()}`;
    
    activeCalls.set(callId, {
      id: callId,
      phoneNumber,
      contactName,
      entityId,
      entityType,
      startTime: new Date(),
      status: 'dialing'
    });

    // Simulate call connection
    setTimeout(async () => {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'connected';
        
        // Create call record
        const callRecord = new Call({
          connected: 'Yes',
          callOutcome: 'Connected',
          callDate: new Date(),
          note: `Call connected with ${contactName || phoneNumber}`,
          createdBy: req.user?.name || 'Admin'
        });
        await callRecord.save();

        // Log to activity with itemRef set to callRecord._id
        await logCallActivity({
          entityId: call.entityId,
          entityType: call.entityType,
          callRecordId: callRecord._id,
          description: `Call connected with ${contactName || phoneNumber}`,
          callOutcome: 'Connected',
          connected: 'Yes',
          phoneNumber: call.phoneNumber,
          contactName: call.contactName,
          createdBy: req.user?.name || 'Admin'
        });
      }
    }, 2000);

    res.status(200).json({
      success: true,
      data: {
        callId,
        status: 'dialing',
        message: `Calling ${contactName || phoneNumber}...`
      }
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call'
    });
  }
};

// Log a call (manual entry)
exports.logCall = async (req, res) => {
  try {
    const { 
      entityId, 
      entityType, 
      connected, 
      callOutcome, 
      callDate, 
      note,
      duration,
      phoneNumber,
      contactName
    } = req.body;

    // Validate required fields
    if (!connected || !callOutcome) {
      return res.status(400).json({ 
        success: false,
        error: 'Connected status and call outcome are required' 
      });
    }

    // Validate entity fields
    if (!entityId || !entityType) {
      return res.status(400).json({ 
        success: false,
        error: 'Entity ID and Entity Type are required' 
      });
    }

    // Create call record
    const callRecord = new Call({
      connected,
      callOutcome,
      callDate: callDate || new Date(),
      note: note || `Call ${callOutcome}`,
      createdBy: req.user?.name || 'Admin'
    });
    await callRecord.save();

    // Log to activity with itemRef set to callRecord._id
    const activity = await logCallActivity({
      entityId,
      entityType,
      callRecordId: callRecord._id,
      description: `Call logged: ${callOutcome}`,
      callOutcome,
      connected,
      duration: duration || 0,
      phoneNumber: phoneNumber || '',
      contactName: contactName || '',
      note: note || '',
      createdBy: req.user?.name || 'Admin'
    });

    res.status(201).json({
      success: true,
      data: {
        call: callRecord,
        activity
      }
    });

  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to log call'
    });
  }
};

// Get call history for an entity
exports.getCallHistory = async (req, res) => {
  try {
    const { entityId, entityType } = req.params;

    const entityField = getEntityField(entityType);
    if (!entityField) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid entity type' 
      });
    }

    const query = {
      [entityField]: entityId,
      type: 'Call'
    };

    const activities = await Activity.find(query)
      .sort({ activityDate: -1 })
      .populate('itemRef') // Populate the call reference
      .lean();

    const callHistory = activities.map(activity => ({
      id: activity._id,
      callDate: activity.activityDate,
      callOutcome: activity.metadata?.callOutcome || 'Unknown',
      connected: activity.metadata?.connected || 'No',
      note: activity.description,
      duration: activity.metadata?.duration || 0,
      createdBy: activity.metadata?.createdBy || 'Admin',
      callDetails: activity.itemRef // The actual call record
    }));

    res.status(200).json({
      success: true,
      data: callHistory
    });

  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get call history'
    });
  }
};

// Get call statistics
exports.getCallStatistics = async (req, res) => {
  try {
    const { entityId, entityType } = req.params;

    const entityField = getEntityField(entityType);
    if (!entityField) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid entity type' 
      });
    }

    const query = {
      [entityField]: entityId,
      type: 'Call'
    };

    const activities = await Activity.find(query).lean();

    const totalCalls = activities.length;
    const connectedCalls = activities.filter(a => a.metadata?.connected === 'Yes').length;
    const successfulCalls = activities.filter(a => a.metadata?.callOutcome === 'Connected' || a.metadata?.callOutcome === 'Successful').length;
    
    const totalDuration = activities.reduce((sum, a) => sum + (a.metadata?.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    const outcomes = {};
    activities.forEach(a => {
      const outcome = a.metadata?.callOutcome || 'Unknown';
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalCalls,
        connectedCalls,
        successfulCalls,
        totalDuration,
        avgDuration,
        outcomes
      }
    });

  } catch (error) {
    console.error('Error getting call statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get call statistics'
    });
  }
};

// End call
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = activeCalls.get(callId);
    
    if (!call) {
      return res.status(404).json({ 
        success: false,
        error: 'Call not found' 
      });
    }

    const duration = Math.floor((new Date() - call.startTime) / 1000);
    
    // Create call record for ended call
    const callRecord = new Call({
      connected: 'No',
      callOutcome: 'Ended',
      callDate: new Date(),
      note: `Call ended after ${duration} seconds with ${call.contactName || call.phoneNumber}`,
      createdBy: req.user?.name || 'Admin'
    });
    await callRecord.save();

    await logCallActivity({
      entityId: call.entityId,
      entityType: call.entityType,
      callRecordId: callRecord._id,
      callOutcome: 'Ended',
      connected: 'No',
      duration: duration,
      phoneNumber: call.phoneNumber,
      contactName: call.contactName,
      note: `Call ended after ${duration} seconds`,
      createdBy: req.user?.name || 'Admin'
    });

    if (call.peerConnection) {
      call.peerConnection.close();
    }
    activeCalls.delete(callId);

    res.status(200).json({
      success: true,
      data: {
        callId,
        duration,
        message: 'Call ended successfully'
      }
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get call status
exports.getCallStatus = (req, res) => {
  try {
    const { callId } = req.params;
    const call = activeCalls.get(callId);
    
    if (!call) {
      return res.status(404).json({ 
        success: false,
        error: 'Call not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: call.status,
        duration: Math.floor((new Date() - call.startTime) / 1000),
        phoneNumber: call.phoneNumber,
        contactName: call.contactName
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// backend/controllers/callController.js - Add this function

// Simple initiate call (simulates call initiation)
exports.initiateCall = async (req, res) => {
  try {
    const { phoneNumber, contactName, entityId, entityType } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Simulate call initiation
    // In production, this would integrate with Twilio or other telephony service
    
    const callId = `call_${Date.now()}`;
    
    // Store call in memory (or database in production)
    activeCalls.set(callId, {
      id: callId,
      phoneNumber,
      contactName,
      entityId,
      entityType,
      startTime: new Date(),
      status: 'connected' // Simulate immediate connection
    });

    // Create call record
    const callRecord = new Call({
      connected: 'Yes',
      callOutcome: 'Connected',
      callDate: new Date(),
      note: `Call initiated with ${contactName || phoneNumber}`,
      createdBy: req.user?.name || 'Admin'
    });
    await callRecord.save();

    // Log to activity
    await logCallActivity({
      entityId,
      entityType,
      callRecordId: callRecord._id,
      description: `Call initiated with ${contactName || phoneNumber}`,
      callOutcome: 'Connected',
      connected: 'Yes',
      phoneNumber,
      contactName,
      createdBy: req.user?.name || 'Admin'
    });

    res.status(200).json({
      success: true,
      data: {
        callId,
        status: 'connected',
        message: `Call connected with ${contactName || phoneNumber}`
      }
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call'
    });
  }
};