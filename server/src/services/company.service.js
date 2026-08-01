const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');
let companyRepository;
try {
  companyRepository = require("../repositories/companyRepositories");
} catch (error) {
  companyRepository = null;
}

class CompanyService {
  

async createCompany(companyData, userId) {
  console.log('📝 createCompany - userId:', userId);
  console.log('📝 createCompany - companyData:', companyData);
  
  if (companyRepository && !userId) {
    return await companyRepository.create(companyData);
  }
  
  // ✅ Make sure userId is valid
  if (!userId) {
    throw new ApiError(401, 'User ID is required to create a company');
  }
  
  const existingCompany = await Company.findOne({ 
    $or: [
      { domainName: companyData.domainName },
      { companyName: companyData.companyName }
    ]
  });
  
  if (existingCompany) {
    throw new ApiError(400, 'Company with this domain or name already exists');
  }
  
  const company = await Company.create({
    ...companyData,
    createdBy: userId,        
    companyOwner: userId,     
    updatedBy: userId,
    isActive: true
  });
  
  console.log('✅ Company created:', company);
  return company;
}
  
  async getAllCompanies(filters = {}) {
    if (companyRepository && !Object.keys(filters).length) {
      const companies = await companyRepository.findAll();
      return {
        companies,
        pagination: {
          page: 1,
          limit: companies.length,
          total: companies.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    const query = { isActive: true };
    
    // Apply filters
    if (filters.search) {
      query.$or = [
        { companyName: { $regex: filters.search, $options: "i" } },
        { domainName: { $regex: filters.search, $options: "i" } },
        { city: { $regex: filters.search, $options: "i" } },
        { phoneNumber: { $regex: filters.search, $options: "i" } }
      ];
    }
    
    if (filters.industry && filters.industry !== 'all') {
      query.industry = filters.industry;
    }
    
    if (filters.city) {
      query.city = filters.city;
    }
    
    if (filters.countryRegion) {
      query.countryRegion = filters.countryRegion;
    }
    
    if (filters.leadStatus && filters.leadStatus !== 'all') {
      query.leadStatus = filters.leadStatus;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate('companyOwner', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .populate('attachments.uploadedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Company.countDocuments(query)
    ]);
    
    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
  
  async getCompanyById(companyId) {
    if (companyRepository) {
      const company = await companyRepository.findById(companyId);
      if (company) {
        return company;
      }
    }
    
    const company = await Company.findById(companyId)
      .populate('companyOwner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('attachments.uploadedBy', 'firstName lastName email');
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    return company;
  }
  
  async updateCompany(companyId, updateData, userId) {
    if (companyRepository && !userId) {
      return await companyRepository.update(companyId, updateData);
    }
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      {
        ...updateData,
        updatedBy: userId,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return updatedCompany;
  }
  
  async deleteCompany(companyId) {
    if (companyRepository) {
      return await companyRepository.delete(companyId);
    }
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    company.isActive = false;
    await company.save();
    
    return true;
  }
  
  
  // Hard delete - No role restrictions
  async hardDeleteCompany(companyId) {
    const company = await Company.findByIdAndDelete(companyId);
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    return true;
  }
  
  // Get company statistics - No role restrictions
  async getCompanyStatistics() {
    const statistics = await Company.getStatistics();
    
    // Industry distribution
    const industryDistribution = await Company.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Lead status distribution
    const leadStatusDistribution = await Company.aggregate([
      {
        $group: {
          _id: '$leadStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return {
      ...statistics,
      industryDistribution,
      leadStatusDistribution
    };
  }
  
  // Upload attachment - No role restrictions
  async uploadAttachment(companyId, fileData, userId) {
    const company = await Company.findById(companyId);
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    company.attachments.push({
      ...fileData,
      uploadedBy: userId,
      uploadedAt: new Date()
    });
    
    await company.save();
    
    return company.attachments[company.attachments.length - 1];
  }
  
  // Delete attachment - No role restrictions
  async deleteAttachment(companyId, attachmentId) {
    const company = await Company.findById(companyId);
    
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    
    const attachmentIndex = company.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );
    
    if (attachmentIndex === -1) {
      throw new ApiError(404, 'Attachment not found');
    }
    
    company.attachments.splice(attachmentIndex, 1);
    await company.save();
    
    return true;
  }
  
  // Bulk delete companies - No role restrictions
  async bulkDeleteCompanies(companyIds) {
    const results = {
      success: [],
      failed: []
    };
    
    for (const companyId of companyIds) {
      try {
        await this.deleteCompany(companyId);
        results.success.push(companyId);
      } catch (error) {
        results.failed.push({ id: companyId, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new CompanyService();