const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = await User.create(userData);
    return user;
  }

  async findByEmail(email, includePassword = false) {
    let query = User.findOne({ email: email.toLowerCase() });
    
    if (includePassword) {
      query = query.select('+password');
    }
    
    const user = await query;
    return user;
  }

  async findById(userId, includePassword = false) {
    let query = User.findById(userId);
    
    if (includePassword) {
      query = query.select('+password');
    }
    
    const user = await query;
    return user;
  }

  async findByIdAndUpdate(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    return user;
  }

  async updatePassword(userId, hashedPassword) {
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
    return user;
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const users = await User.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filters);
    
    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findByRole(role) {
    const users = await User.find({ role });
    return users;
  }

  async updateStatus(userId, isActive) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );
    return user;
  }

  async deleteUser(userId, hardDelete = false) {
    if (hardDelete) {
      await User.findByIdAndDelete(userId);
    } else {
      await User.findByIdAndUpdate(userId, { isActive: false });
    }
    return true;
  }

  async emailExists(email, excludeUserId = null) {
    const query = { email: email.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const user = await User.findOne(query);
    return !!user;
  }

  async getUserCountByRole() {
    const counts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      Admin: 0,
      Manager: 0,
      Sales: 0,
      total: 0
    };
    
    counts.forEach(item => {
      result[item._id] = item.count;
      result.total += item.count;
    });
    
    return result;
  }

  async searchUsers(searchTerm) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    
    return users;
  }

  async bulkCreate(usersData) {
    const users = await User.insertMany(usersData);
    return users;
  }

  async updateLastLogin(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { lastLogin: new Date() },
      { new: true }
    );
    return user;
  }
}

module.exports = new UserRepository();