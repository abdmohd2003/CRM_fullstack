const Company = require("../models/Company");

class CompanyRepository {
  async create(data) {
    return await Company.create(data);
  }

  async findAll() {
    return await Company.find()
      .populate("companyOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async findById(id) {
    return await Company.findById(id)
      .populate("companyOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async update(id, data) {
    return await Company.findByIdAndUpdate(id, data, {
      new: true,
    })
      .populate("companyOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async delete(id) {
    return await Company.findByIdAndDelete(id);
  }
}

module.exports = new CompanyRepository();