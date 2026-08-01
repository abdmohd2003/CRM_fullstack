const activityService = require("../services/activity.service");

class ActivityController {

  // 1. Create a new activity
  async createActivity(req, res) {
    try {
      const newActivity = await activityService.logActivity(req.body);
      return res.status(201).json({ success: true, data: newActivity });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // 2. Get a single activity by its ID
  async getActivityById(req, res) {
    try {
      const { id } = req.params;
      const activity = await activityService.getActivityDetails(id);
      
      return res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // 3. Get all activities with pagination and filters
  async getAllActivities(req, res) {
    try {
      const { page, limit, type } = req.query;
      const activities = await activityService.getAllActivities(page, limit, type);
      
      return res.status(200).json({
        success: true,
        count: activities.length,
        data: activities,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // 4. Update an existing activity
  async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const updatedActivity = await activityService.updateActivity(id, req.body);
      
      return res.status(200).json({
        success: true,
        data: updatedActivity,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // 5. Delete an activity completely
  async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const result = await activityService.deleteActivity(id);
      
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getEntityTimeline(req, res) {
    console.log(req.params);

    const { entityType, entityId } = req.params;

    const data = await activityService.getEntityTimeline(
      entityType,
      entityId
    );

    res.json({
      success: true,
      count: data.length,
      data
    });
  }

  // NEW: Get order activities
  async getOrderActivities(req, res) {
    try {
      const { orderId } = req.params;
      const Activity = require("../models/Activity");
      const activities = await Activity.find({ order: orderId })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: activities });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // NEW: Get payment activities
  async getPaymentActivities(req, res) {
    try {
      const { paymentId } = req.params;
      const Activity = require("../models/Activity");
      const activities = await Activity.find({ payment: paymentId })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: activities });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ActivityController();