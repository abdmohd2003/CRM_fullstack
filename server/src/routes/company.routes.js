const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company.controller");
const { protect } = require("../middleware/auth.middleware");

// ✅ All company routes require authentication
router.use(protect);

// Company CRUD operations
router.post("/", companyController.create);
router.get("/", companyController.getAll);
router.get("/:id", companyController.getById);
router.put("/:id", companyController.update);
router.delete("/:id", companyController.delete);

// Bulk operations (if you have them)
// router.post("/bulk/delete", companyController.bulkDeleteCompanies);

module.exports = router;