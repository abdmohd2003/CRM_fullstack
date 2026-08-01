// repositories/productRepository.js
const Product = require("../models/Product");

class ProductRepository {
  // Find all products in the database
  async findAll() {
    return await Product.find().sort({ createdAt: -1 });
  }

  // Find a single product by ID
  async findById(id) {
    return await Product.findById(id);
  }

  // Create and persist a new product record
  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  // Find multiple products matching an array of IDs (Handy for calculating Lead pricing totals!)
  async findManyByIds(idsArray) {
    return await Product.find({ _id: { $in: idsArray } });
  }
}

module.exports = new ProductRepository();