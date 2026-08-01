// services/lead.service.js
const Lead = require('../models/Lead');
const createLead = async (leadData) => {
    try {
        return await Lead.create(leadData);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || { email: 1 })[0];
            const customError = new Error(`A lead with this ${field} already exists`);
            customError.statusCode = 400;
            throw customError;
        }
        throw err;
    }
};

const getAllLeads = async () => {
    // FIXED: Added .populate("products") so your table rows show product names/prices
    return await Lead.find().populate("products").sort({ createdAt: -1 });
};

const getLeadById = async (id) => {
    // FIXED: Added .populate("products") for the detailed modal/view page
    return await Lead.findById(id).populate("products");
};

const updateLead = async (id, leadData) => {
    return await Lead.findByIdAndUpdate(id, leadData, {
        new: true,
        runValidators: true
    }).populate("products"); // Populate after updating
};

const deleteLead = async (id) => {
    return await Lead.findByIdAndDelete(id);
};

// FIXED: Passed email variable into the arguments definition
const getLeadByEmail = async (email) => {
    return await Lead.findOne({ email }).populate("products");
};
const bulkCreateLeads = async (leadsArray) => {
    try {
        const inserted = await Lead.insertMany(leadsArray, { ordered: false });
        return { insertedDocs: inserted, writeErrors: [] };
    } catch (err) {
        const insertedDocs = err.insertedDocs || [];
        const writeErrors = err.writeErrors || [];
        return { insertedDocs, writeErrors };
    }
};
module.exports = {
    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    deleteLead,
    getLeadByEmail,
    bulkCreateLeads
};