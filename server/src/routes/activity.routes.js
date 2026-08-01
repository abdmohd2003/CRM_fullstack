const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activity.controller");

// Base Routes: /api/activities
router.route("/")
  .get(activityController.getAllActivities)
  .post(activityController.createActivity);

// Timeline Route: /api/activities/timeline/:entityType/:entityId
// Example: /api/activities/timeline/lead/65f1bc...
router.get("/timeline/:entityType/:entityId", activityController.getEntityTimeline);

// NEW: Order-specific activity routes
router.get("/order/:orderId", activityController.getOrderActivities);

// NEW: Payment-specific activity routes
router.get("/payment/:paymentId", activityController.getPaymentActivities);

// Individual Document Routes: /api/activities/:id
router.route("/:id")
  .get(activityController.getActivityById)
  .put(activityController.updateActivity)
  .delete(activityController.deleteActivity);

module.exports = router;