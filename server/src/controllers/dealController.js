// controllers/dealController.js
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const { 
  createOrderFromDeal,
  createActivity,
  createNotification 
} = require("../utils/orderHelpers");

// CREATE
const createDeal = async (req, res) => {
  try {
    const deal = await Deal.create(req.body);
    const populated = await Deal.findById(deal._id)
      .populate("owner", "firstName lastName email")
      .populate({
  path: "associatedLead",
  populate: [
    {
      path: "company",
      model: "Company",
    },
    {
      path: "products",
      model: "Product",
    },
  ],
})
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL - ⭐ FIX: Populate associatedLead
const getDeals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { stage: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.closeDate) filter.closeDate = { $gte: new Date(req.query.closeDate) };

    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate("owner", "firstName lastName email")
        // ⭐ Populate associatedLead with full lead data
       .populate({
  path: "associatedLead",
  populate: [
    {
      path: "company",
      model: "Company",
    },
    {
      path: "products",
      model: "Product",
    },
  ],
})
        .populate("orderId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Deal.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        deals,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ONE - ⭐ FIX: Populate associatedLead
const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("owner", "firstName lastName email")
      // ⭐ Populate associatedLead with full lead data
     .populate({
  path: "associatedLead",
  populate: [
    {
      path: "company",
      model: "Company",
    },
    {
      path: "products",
      model: "Product",
    },
  ],
})
      .populate({
        path: 'orderId',
        populate: [
          { path: 'lineItems' },
          { path: 'payments', model: 'Payment' },
          { path: 'invoice', model: 'Invoice' }
        ]
      });
    
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    
    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("owner", "firstName lastName email")
   .populate({
  path: "associatedLead",
  populate: [
    {
      path: "company",
      model: "Company",
    },
    {
      path: "products",
      model: "Product",
    },
  ],
})

    if (!deal) return res.status(404).json({ message: "Deal not found" });
    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
const deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update deal stage (triggers order creation on CLOSED_WON)
const updateDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const userId = req.user?._id || req.user?.id || 'system';

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    const oldStage = deal.stage;
    
    // Update stage
    deal.stage = stage;
    await deal.save();

    // Log activity
    await Activity.create({
      deal: deal._id,
      type: 'Order',
      itemRef: deal._id,
      description: `Deal stage changed from ${oldStage} to ${stage}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'DEAL_STAGE_CHANGED',
      metadata: { oldStage, newStage: stage }
    });

    // STEP 1 & 2: If stage is CLOSED_WON, auto-create Draft Order
    if (stage === 'CLOSED_WON' && !deal.orderId) {
      // Create order from deal
      const order = await createOrderFromDeal(id, userId);
      
      // Log order creation
      await Activity.create({
        deal: deal._id,
        order: order._id,
        type: 'Order',
        itemRef: order._id,
        description: `Order ${order.orderNumber} auto-created from deal ${deal.name}`,
        activityDate: new Date(),
        createdBy: userId,
        action: 'ORDER_CREATED',
        metadata: { orderId: order._id, orderNumber: order.orderNumber }
      });

      // Get the first owner from the deal's owner array
      const ownerId = deal.owner && deal.owner.length > 0 ? deal.owner[0] : userId;

      // Create notification
      await Notification.create({
        userId: ownerId,
        title: '🎉 Order Created',
        message: `Order ${order.orderNumber} has been auto-created from deal ${deal.name}`,
        type: 'ORDER_CREATED',
        link: `/orders/${order._id}`,
        metadata: { dealId: deal._id, orderId: order._id },
        read: false,
      });

      // Return with order data
      return res.status(200).json({
        success: true,
        data: {
          deal,
          order,
        },
        message: `Deal moved to Closed Won. Order ${order.orderNumber} created.`
      });
    }

    res.status(200).json({
      success: true,
      data: deal,
      message: `Deal stage updated to ${stage}`
    });

  } catch (error) {
    console.error('Update deal stage error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  updateDealStage,
};