const activityRepository = require("../repositories/activityRepositories");
const mongoose = require("mongoose");

const Call = require("../models/Call");
const Note = require("../models/Note");
const Email = require("../models/Email");
const Meeting = require("../models/Meeting");
const Task = require("../models/Task");

const modelMap = {
  Call,
  Note,
  Email,
  Meeting,
  Task
};

class ActivityService {
  async logActivity(activityData) {
    const {
      type,
      entityType,
      entityId,
      details = {},
      description,
      activityDate,
      title,
      assignedTo,
      dueDate,
      priority,
      connected,      
      callOutcome,    
      callDate,      
    } = activityData;
    
    if (!type || !entityType || !entityId) {
      throw new Error("Missing required fields: type, entityType, or entityId.");
    }

    const validEntities = ["lead", "company", "deal", "ticket"];
    if (!validEntities.includes(entityType)) {
      throw new Error("Invalid entity type.");
    }

    let subItem;

    switch (type) {
      case "Call":
        subItem = await Call.create({
          connected:   activityData.connected,
          callOutcome: activityData.callOutcome,
          callDate:    activityData.callDate,
          note:        activityData.details?.note || "",
        });
        break;
      case "Note":
        subItem = await Note.create({
          content: details.content || activityData.content,
          author: details.author || "Admin",
        });
        break;
      case "Email":
        subItem = await Email.create(details);
        break;
      case "Meeting":
        subItem = await Meeting.create({
          title: details.title,
          startDate: details.startDate,
          endDate: details.endDate,
          attendees: details.attendees,       // array of ObjectIds
          location: details.location,
          reminder: details.reminder,
          note: details.note,
        });
        break;
      case "Task":                              
        subItem = await Task.create({
          title: title,
          assignedTo: assignedTo,
          description: description || details.note || "",
          dueDate: dueDate,
          priority: priority,
        });
        break;
      default:
        throw new Error("Invalid activity type.");
    }

    const finalActivityData = {
      type,
      itemRef: subItem._id,
      description: description || details.note || details.content || details.body || details.description || "",
      activityDate: activityDate || Date.now(),
      [entityType]: entityId,
    };

    return await activityRepository.create(finalActivityData);
  }

  async getActivityDetails(id) {
    const activity = await activityRepository.findById(id);
    if (!activity) {
      throw new Error("Activity not found.");
    }
    return activity;
  }

  async getAllActivities(page = 1, limit = 10, type) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    if (type) {
      filter.type = type.charAt(0).toUpperCase() + type.slice(1);
    }

    return await activityRepository.findAll({ filter, skip, limit: parseInt(limit) });
  }

  async updateActivity(id, updateData) {
    const activity = await activityRepository.findById(id);
    if (!activity) {
      throw new Error("Activity not found.");
    }

    if (updateData.details) {
      const Model = modelMap[activity.type];
      if (!Model) throw new Error(`Model matching type '${activity.type}' is unregistered.`);

      await Model.findByIdAndUpdate(activity.itemRef, updateData.details, { new: true, runValidators: true });
    }

    const masterUpdates = {};
    if (updateData.description) masterUpdates.description = updateData.description;
    if (updateData.activityDate) masterUpdates.activityDate = updateData.activityDate;

    return await activityRepository.update(id, masterUpdates);
  }

  async deleteActivity(id) {
    const activity = await activityRepository.findById(id);
    if (!activity) {
      throw new Error("Activity not found.");
    }

    const Model = modelMap[activity.type];
    if (Model) {
      await Model.findByIdAndDelete(activity.itemRef);
    }

    await activityRepository.delete(id);
    return { success: true, message: "Activity and its details successfully deleted." };
  }

  async getEntityTimeline(entityType, entityId) {
    const validEntities = ["lead", "company", "deal", "ticket"];
    if (!validEntities.includes(entityType)) {
      throw new Error("Invalid entity type.");
    }
    return await activityRepository.findByEntity(entityType, entityId);
  }
}

module.exports = new ActivityService();