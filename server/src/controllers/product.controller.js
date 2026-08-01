// controllers/productController.js
const productRepository = require("../repositories/productRepository");

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productRepository.findAll();
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ 
      message: "Server error while fetching products", 
      error: error.message 
    });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, amount, description } = req.body;

    // Simple payload validations
    if (!name || !amount) {
      return res.status(400).json({ message: "Name and Amount fields are required" });
    }

    const productData = { name, amount, description };
    const newProduct = await productRepository.create(productData);

    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(400).json({ 
      message: "Failed to create product record", 
      error: error.message 
    });
  }
};