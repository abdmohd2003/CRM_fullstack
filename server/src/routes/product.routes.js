// routes/product.routes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller"); 

// Match paths to your controller methods
router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);

module.exports = router;