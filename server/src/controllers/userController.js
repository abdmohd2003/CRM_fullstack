const User = require("../models/User"); 

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select("firstName lastName email");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};