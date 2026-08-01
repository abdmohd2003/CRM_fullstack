// controllers/leadController.js
const asyncHandler = require("express-async-handler");
const leadService = require("../services/lead.service");
const Product = require("./../models/Product");

const createLead = asyncHandler(async (req, res) => {
  const { products } = req.body;
  let totalProductAmount = 0;

  // 1. Securely fetch matching products from database to calculate the total amount
  if (products && Array.isArray(products) && products.length > 0) {
    const dbProducts = await Product.find({ _id: { $in: products } });
    totalProductAmount = dbProducts.reduce((sum, item) => sum + item.amount, 0);
  }

  // 2. Attach total amount to payload safely on backend
  const leadPayload = {
    ...req.body,
    totalProductAmount
  };

  const lead = await leadService.createLead(leadPayload);

  // 3. Re-populate the brand new lead record details before replying
  const fullyPopulatedLead = await leadService.getLeadById(lead._id);

  res.status(201).json({
    success: true,
    message: "Lead created successfully",
    data: fullyPopulatedLead,
  });
});

const getAllLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.getAllLeads();
  res.status(200).json({
    success: true,
    count: leads.length,
    data: leads,
  });
});

const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
});

const updateLead = asyncHandler(async (req, res) => {
  const { products } = req.body;
  let updatePayload = { ...req.body };

  // Recalculate financial value if products are being changed during update
  if (products && Array.isArray(products)) {
    if (products.length > 0) {
      const dbProducts = await Product.find({ _id: { $in: products } });
      updatePayload.totalProductAmount = dbProducts.reduce((sum, item) => sum + item.amount, 0);
    } else {
      updatePayload.totalProductAmount = 0;
    }
  }

  const lead = await leadService.updateLead(req.params.id, updatePayload);

  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  res.status(200).json({
    success: true,
    message: "Lead updated successfully",
    data: lead,
  });
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await leadService.deleteLead(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  res.status(200).json({
    success: true,
    message: "Lead deleted successfully",
  });
});

// ─────────────────────────────────────────────
// BULK IMPORT LEADS (from CSV upload)
// ─────────────────────────────────────────────
const bulkImportLeads = asyncHandler(async (req, res) => {
  const { leads } = req.body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    res.status(400);
    throw new Error("No leads provided for import");
  }

  const results = {
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  const validLeads = [];

  // Validate each row before attempting to insert
  leads.forEach((row, index) => {
    const rowNumber = index + 2; // +2 to account for CSV header row + 1-based indexing

    const firstName = row.firstName?.trim();
    const lastName = row.lastName?.trim();
    const email = row.email?.trim().toLowerCase();
    const phone = row.phone?.trim();

    if (!firstName || !lastName || !email || !phone) {
      results.failedCount += 1;
      results.errors.push(`Row ${rowNumber}: missing required field (firstName, lastName, email, or phone)`);
      return;
    }

    // Validate status against schema enum; default to "New" if missing/invalid
    const allowedStatuses = ["New", "Contacted", "Qualified", "Unqualified"];
    const status = allowedStatuses.includes(row.status) ? row.status : "New";

    validLeads.push({
      firstName,
      lastName,
      email,
      phone,
      jobTitle: row.jobTitle?.trim() || undefined,
      city: row.city?.trim() || undefined,
      status,
    });
  });

  // Attempt bulk insert for all rows that passed validation above.
  // leadService.bulkCreateLeads returns { insertedDocs, writeErrors }
  // instead of throwing, so we can report partial success accurately.
  if (validLeads.length > 0) {
    const { insertedDocs, writeErrors } = await leadService.bulkCreateLeads(validLeads);

    results.successCount += insertedDocs.length;

    writeErrors.forEach((writeErr) => {
      results.failedCount += 1;
      const failedEmail = validLeads[writeErr.index]?.email || "unknown";
      const isDuplicate = writeErr.code === 11000 || writeErr.errmsg?.includes("duplicate");
      results.errors.push(
        `Email "${failedEmail}": ${isDuplicate ? "already exists" : "failed to import"}`
      );
    });
  }

  res.status(200).json({
    success: true,
    message: `${results.successCount} leads imported, ${results.failedCount} failed`,
    data: results,
  });
});

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  bulkImportLeads,
};