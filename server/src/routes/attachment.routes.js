const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Attachment = require('../models/Attachment');

// ============ MULTER CONFIGURATION ============

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created:', uploadDir);
  } catch (err) {
    console.error('❌ Failed to create upload directory:', err);
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Multer upload instance with error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: fileFilter
});

// ============ ROUTES ============

/**
 * POST /api/:entityType/:entityId/attachments/upload
 * Upload attachments for a specific entity
 */
router.post(
  '/:entityType/:entityId/attachments/upload',
  (req, res, next) => {
    // Log the request
    console.log('📤 Upload request received:');
    console.log('  Entity Type:', req.params.entityType);
    console.log('  Entity ID:', req.params.entityId);
    console.log('  Content-Type:', req.headers['content-type']);
    console.log('  Files:', req.files);
    
    // Handle multer errors
    upload.array('attachments', 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({
          success: false,
          error: err.message,
          code: err.code
        });
      } else if (err) {
        console.error('❌ Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('📤 Processing upload...');
      
      const { entityType, entityId } = req.params;
      const files = req.files;

      console.log('  Entity Type:', entityType);
      console.log('  Entity ID:', entityId);
      console.log('  Number of files:', files?.length || 0);

      // Check if files were uploaded
      if (!files || files.length === 0) {
        console.log('❌ No files uploaded');
        return res.status(400).json({ 
          success: false,
          error: 'No files uploaded' 
        });
      }

      // Save to database
      const uploadedFiles = [];
      for (const file of files) {
        console.log(`📄 Processing file: ${file.originalname} (${file.size} bytes)`);
        
        try {
          const attachment = new Attachment({
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            filePath: file.path,
            entityType: entityType,
            entityId: entityId,
            uploadedBy: req.user?._id || null
          });
          
          await attachment.save();
          console.log(`✅ File saved: ${attachment._id}`);
          
          uploadedFiles.push({
            _id: attachment._id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
            uploadedAt: attachment.uploadedAt,
            url: `/api/attachments/${attachment._id}/download`
          });
        } catch (saveError) {
          console.error(`❌ Failed to save file ${file.originalname}:`, saveError);
          // Continue with other files
        }
      }

      console.log(`✅ Upload complete: ${uploadedFiles.length} files saved`);

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('  Stack:', error.stack);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to upload files',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * GET /api/:entityType/:entityId/attachments
 * Get all attachments for a specific entity
 */
router.get('/:entityType/:entityId/attachments', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    console.log('📥 Fetching attachments:', { entityType, entityId });

    const attachments = await Attachment.find({
      entityType,
      entityId,
      isDeleted: false
    }).sort({ uploadedAt: -1 });

    const formattedAttachments = attachments.map(att => ({
      _id: att._id,
      fileName: att.fileName,
      originalName: att.originalName,
      fileSize: att.fileSize,
      fileType: att.fileType,
      uploadedAt: att.uploadedAt,
      url: `/api/attachments/${att._id}/download`
    }));

    console.log(`✅ Found ${formattedAttachments.length} attachments`);

    res.json({
      success: true,
      data: formattedAttachments
    });

  } catch (error) {
    console.error('❌ Get attachments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch attachments' 
    });
  }
});

/**
 * GET /api/attachments/:id/download
 * Download a specific attachment by ID
 */
router.get('/attachments/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📥 Downloading attachment:', id);

    const attachment = await Attachment.findOne({
      _id: id,
      isDeleted: false
    });

    if (!attachment) {
      console.log('❌ Attachment not found:', id);
      return res.status(404).json({ 
        success: false,
        error: 'Attachment not found' 
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      console.log('❌ File not found on server:', attachment.filePath);
      return res.status(404).json({ 
        success: false,
        error: 'File not found on server' 
      });
    }

    console.log(`✅ Downloading file: ${attachment.originalName}`);
    res.download(attachment.filePath, attachment.originalName);

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to download file' 
    });
  }
});

/**
 * DELETE /api/attachments/:id
 * Delete a specific attachment by ID
 */
router.delete('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting attachment:', id);

    const attachment = await Attachment.findOne({
      _id: id,
      isDeleted: false
    });

    if (!attachment) {
      console.log('❌ Attachment not found:', id);
      return res.status(404).json({ 
        success: false,
        error: 'Attachment not found' 
      });
    }

    // Soft delete
    attachment.isDeleted = true;
    await attachment.save();

    console.log('✅ Attachment deleted:', id);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete attachment' 
    });
  }
});

module.exports = router;