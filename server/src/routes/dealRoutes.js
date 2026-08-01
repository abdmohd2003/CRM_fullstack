const express = require("express");
const router = express.Router();

const {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  updateDealStage,
} = require("../controllers/dealController");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// ✅ All deal routes require authentication
router.use(protect);

// Deal CRUD operations
router.post("/", createDeal);
router.get("/", getDeals);
router.get("/:id", getDealById);
router.put("/:id", updateDeal);
router.delete("/:id", deleteDeal);

// NEW: Update deal stage (triggers order creation on CLOSED_WON)
router.patch("/:id/stage", updateDealStage);

module.exports = router;