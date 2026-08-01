const mongoose = require('mongoose')
const Activity = require('../models/Activity'); 

class ActivityRepository {
 
  async create(activityData) {
    return await Activity.create(activityData);
  }

async findById(id) {
    const Model = Activity.findById ? Activity : mongoose.model("Activity");
    return await Model.findById(id)
      .populate("itemRef")
      .populate("lead", "firstName lastName email phone")
      .populate("company", "name industry phone")
      .populate("deal", "title value stage")
      .populate("ticket", "subject priority status"); 
  }

  async findByEntity(entityType, entityId) {
  return await Activity.find({
    [entityType]: entityId
  })
    .populate("itemRef")
    .populate("lead", "firstName lastName email")
    .populate("company")
    .populate("deal")
    .populate("ticket")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 });
}

  async findAll({ filter = {}, skip = 0, limit = 10 }) {
    return await Activity.find(filter)
      .populate("itemRef")
      .populate("lead", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(id, updateData) {
    return await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

 

  async delete(id) {
    return await Activity.findByIdAndDelete(id);
  }
}

module.exports = new ActivityRepository();