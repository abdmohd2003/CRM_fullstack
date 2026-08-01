const companyService = require("../services/company.service");
const { successResponse } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');

class CompanyController {
  // Create company
async create(req, res, next) {
  try {
    console.log('📝 Controller - req.user:', req.user);
    console.log('📝 Controller - req.user._id:', req.user?._id);
    console.log('📝 Controller - req.body:', req.body);
    
    // ✅ Make sure userId is passed
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }
    
    const company = await companyService.createCompany(req.body, userId);
    
    // Support both response formats
    if (res.successResponse) {
      successResponse(res, 201, 'Company created successfully', company);
    } else {
      res.status(201).json({
        success: true,
        data: company,
      });
    }
  } catch (error) {
    console.error('❌ Error creating company:', error);
    if (next) {
      next(error);
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
  // Get all companies with filters and pagination
  async getAll(req, res, next) {
    try {
      const result = await companyService.getAllCompanies(req.query);
      
      // Support both response formats for compatibility
      if (res.successResponse) {
        successResponse(res, 200, 'Companies retrieved successfully', result);
      } else {
        res.status(200).json({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
  
  // Get company by ID
  async getById(req, res, next) {
    try {
      const company = await companyService.getCompanyById(req.params.id);

      if (!company) {
        if (next) {
          throw new ApiError(404, "Company not found");
        } else {
          return res.status(404).json({
            success: false,
            message: "Company not found",
          });
        }
      }

      if (res.successResponse) {
        successResponse(res, 200, 'Company retrieved successfully', company);
      } else {
        res.status(200).json({
          success: true,
          data: company,
        });
      }
    } catch (error) {
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
  
  // Update company
  async update(req, res, next) {
    try {
      const company = await companyService.updateCompany(
        req.params.id,
        req.body,
        req.user?._id
      );

      if (!company) {
        if (next) {
          throw new ApiError(404, "Company not found");
        } else {
          return res.status(404).json({
            success: false,
            message: "Company not found",
          });
        }
      }

      if (res.successResponse) {
        successResponse(res, 200, 'Company updated successfully', company);
      } else {
        res.status(200).json({
          success: true,
          data: company,
        });
      }
    } catch (error) {
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
  
  // Soft delete company
  async delete(req, res, next) {
    try {
      const company = await companyService.deleteCompany(req.params.id);

      if (!company) {
        if (next) {
          throw new ApiError(404, "Company not found");
        } else {
          return res.status(404).json({
            success: false,
            message: "Company not found",
          });
        }
      }

      if (res.successResponse) {
        successResponse(res, 200, 'Company deleted successfully');
      } else {
        res.status(200).json({
          success: true,
          message: "Company deleted successfully",
        });
      }
    } catch (error) {
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
  
  // ============ ADVANCED FEATURES (Keep from your version) ============
  
  // Hard delete company (permanent)
  async hardDeleteCompany(req, res, next) {
    try {
      await companyService.hardDeleteCompany(req.params.id);
      successResponse(res, 200, 'Company permanently deleted');
    } catch (error) {
      next(error);
    }
  }
  
  // Get company statistics
  async getCompanyStatistics(req, res, next) {
    try {
      const stats = await companyService.getCompanyStatistics();
      successResponse(res, 200, 'Statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
  
  // Upload attachment
  async uploadAttachment(req, res, next) {
    try {
      const attachment = await companyService.uploadAttachment(
        req.params.id,
        req.body,
        req.user._id
      );
      successResponse(res, 201, 'Attachment uploaded successfully', attachment);
    } catch (error) {
      next(error);
    }
  }
  
  // Delete attachment
  async deleteAttachment(req, res, next) {
    try {
      await companyService.deleteAttachment(
        req.params.companyId,
        req.params.attachmentId
      );
      successResponse(res, 200, 'Attachment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
  
  // Bulk delete companies
  async bulkDeleteCompanies(req, res, next) {
    try {
      const results = await companyService.bulkDeleteCompanies(req.body.companyIds);
      successResponse(res, 200, 'Bulk delete completed', results);
    } catch (error) {
      next(error);
    }
  }
  
  // ============ Alias methods for backward compatibility ============
  // These map the simpler method names to the full versions
  async getAllCompanies(req, res, next) {
    return this.getAll(req, res, next);
  }
  
  async getCompanyById(req, res, next) {
    return this.getById(req, res, next);
  }
  
  async updateCompany(req, res, next) {
    return this.update(req, res, next);
  }
  
  async deleteCompany(req, res, next) {
    return this.delete(req, res, next);
  }
}

module.exports = new CompanyController();