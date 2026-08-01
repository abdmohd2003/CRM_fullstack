import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiType, FiPaperclip, FiLink2, FiSmile, FiImage, FiTrash2, FiChevronDown, FiUpload, FiFolder, FiXCircle, FiLoader } from 'react-icons/fi';
import { toast } from "react-toastify";
import activityService from "../../../services/activityService";
import axiosInstance from "../../../api/axiosConfig";

const IconButton = ({ children, className = '', ...props }) => (
  <button
    className={`p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

const CreateEmailModal = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  onCreated,
  defaultTo,
}) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject]       = useState('');
  const [body, setBody]             = useState('');
  const [isSending, setIsSending]   = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [savedAttachments, setSavedAttachments] = useState([]);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch saved attachments when modal opens
  useEffect(() => {
    if (isOpen && entityId && entityType) {
      fetchSavedAttachments();
    }
  }, [isOpen, entityId, entityType]);

  useEffect(() => {
    if (isOpen && defaultTo) {
      setRecipients(defaultTo);
    }
    if (!isOpen) {
      setAttachments([]);
      setShowAttachmentPicker(false);
      setUploadingFiles(false);
    }
  }, [isOpen, defaultTo]);

  if (!isOpen) return null;

  // Fetch saved attachments from the entity
  const fetchSavedAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const response = await axiosInstance.get(`/${entityType}s/${entityId}/attachments`);
      const data = response.data?.data || response.data || [];
      setSavedAttachments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching saved attachments:", error);
      setSavedAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Handle system file picker
  const handleSystemFilePicker = () => {
    fileInputRef.current?.click();
    setShowAttachmentPicker(false);
  };

  // Handle file upload from system
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const toastId = toast.loading(`📤 Processing ${files.length} file(s)...`, {
      position: "top-right",
    });

    try {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Read file as base64
        const base64 = await readFileAsBase64(file);
        newAttachments.push({
          id: Date.now() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64, // Store base64 content
          source: 'uploaded'
        });
      }

      setAttachments([...attachments, ...newAttachments]);

      toast.update(toastId, {
        render: `✅ ${newAttachments.length} file(s) added to email`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        theme: "colored",
      });

    } catch (error) {
      console.error("Error processing files:", error);
      toast.update(toastId, {
        render: "❌ Failed to process files",
        type: "error",
        isLoading: false,
        autoClose: 5000,
        theme: "colored",
      });
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Helper function to read file as base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Add saved attachment to email
  const addSavedAttachment = (savedAtt) => {
    const exists = attachments.some(att => 
      att.id === savedAtt._id || att.id === savedAtt.id
    );
    
    if (!exists) {
      setAttachments([...attachments, {
        id: savedAtt._id || savedAtt.id,
        name: savedAtt.originalName || savedAtt.fileName || 'Unnamed file',
        size: savedAtt.fileSize || savedAtt.size || 0,
        type: savedAtt.fileType || savedAtt.type || 'application/octet-stream',
        source: 'saved',
        savedData: savedAtt,
        url: savedAtt.url || savedAtt.path || ''
      }]);
      toast.success(`📎 Added "${savedAtt.originalName || savedAtt.fileName}" to email`);
    } else {
      toast.info('This file is already attached');
    }
    setShowAttachmentPicker(false);
  };

  // Remove attachment from email
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    const type = file.type || '';
    const name = (file.name || '').toLowerCase();
    
    if (type.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.png')) return '🖼️';
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📄';
    if (type.includes('word') || name.endsWith('.doc')) return '📝';
    if (type.includes('excel') || name.endsWith('.xls')) return '📊';
    if (type.includes('zip') || name.endsWith('.zip')) return '📦';
    if (type.includes('video') || name.endsWith('.mp4')) return '🎬';
    if (type.includes('audio') || name.endsWith('.mp3')) return '🎵';
    
    return '📎';
  };

  const handleSend = async () => {
    // Validate required fields
    if (!recipients.trim() || !subject.trim() || !body.trim()) {
      toast.warn("⚠️ Please fill all fields", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientsList = recipients.split(',').map(email => email.trim());
    const invalidEmails = recipientsList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.warn(`⚠️ Invalid email address(es): ${invalidEmails.join(', ')}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setIsSending(true);
    const toastId = toast.loading("📤 Sending email...", {
      position: "top-right",
    });

    try {
      // Prepare email data - only send what the backend expects
      const emailData = {
        to: recipients,
        subject: subject,
        body: body,
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type,
          content: att.content || null, // Only for uploaded files
          source: att.source,
          url: att.url || null
        }))
      };

      console.log('📧 Sending email with data:', {
        to: emailData.to,
        subject: emailData.subject,
        attachmentsCount: emailData.attachments.length
      });

      // Send email with attachments
      const response = await axiosInstance.post("/emails/send-with-attachments", emailData);

      console.log('✅ Email sent successfully:', response.data);

      toast.update(toastId, {
        render: `✅ Email sent to ${recipients} with ${attachments.length} attachment(s)`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
        theme: "colored",
      });

      // Log activity
      try {
        await activityService.logActivity({
          type: "Email",
          entityType,
          entityId,
          details: {
            to: recipients,
            subject,
            body,
            status: "Sent",
            attachments: attachments.map(att => att.name).join(', ')
          },
          description: subject,
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
        // Continue even if logging fails
      }

      // Reset form
      setRecipients("");
      setSubject("");
      setBody("");
      setAttachments([]);
      
      // Call onCreated callback
      if (onCreated) onCreated();
      
      // Close modal
      onClose();

    } catch (error) {
      console.error("Email error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      let errorMessage = "Failed to send email. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.update(toastId, {
        render: `❌ ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        theme: "colored",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#613EEA] p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-white font-semibold text-lg">New Email</h2>
          <button onClick={onClose} className="text-white hover:text-white/80">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-3">

            {/* Recipients */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <label className="text-sm text-gray-600 font-medium w-24">Recipients</label>
              <input
                type="text"
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                className="flex-grow text-sm outline-none placeholder:text-gray-400"
                placeholder="recipient@example.com"
              />
              <div className="text-sm text-gray-500 flex items-center gap-1">
                Cc
                <button className="p-0.5"><FiChevronDown size={14} /></button>
                Bcc
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <label className="text-sm text-gray-600 font-medium w-24">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="flex-grow text-sm outline-none placeholder:text-gray-400"
                placeholder="Enter subject"
              />
            </div>
          </div>

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, index) => (
                  <div
                    key={att.id || index}
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <span>{getFileIcon(att)}</span>
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-1"
                    >
                      <FiXCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-4 pb-2" style={{ minHeight: 180 }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full h-40 text-sm outline-none resize-none placeholder:text-gray-400"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="bg-[#613EEA] text-white px-5 py-2.5 rounded-l text-sm font-medium hover:bg-[#5233D1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
              <button
                disabled={isSending}
                className="bg-[#613EEA] text-white p-2.5 rounded-r border-l border-white/20 hover:bg-[#5233D1] transition-colors disabled:opacity-60"
              >
                <FiChevronDown size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 relative">
              <IconButton onClick={() => setShowAttachmentPicker(!showAttachmentPicker)}>
                {uploadingFiles ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : (
                  <FiPaperclip size={18} />
                )}
              </IconButton>
              <IconButton><FiType size={18} /></IconButton>
              <IconButton><FiLink2 size={18} /></IconButton>
              <IconButton><FiSmile size={18} /></IconButton>
              <IconButton><FiImage size={18} /></IconButton>

              {/* Attachment Picker Dropdown */}
              {showAttachmentPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50">
                  <div className="p-2">
                    <button
                      onClick={handleSystemFilePicker}
                      disabled={uploadingFiles}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiUpload size={16} className="text-indigo-500" />
                      <div className="text-left">
                        <div className="font-medium">Upload from computer</div>
                        <div className="text-xs text-gray-400">Choose files from your device</div>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <div className="text-xs text-gray-400 px-3 py-1 font-medium">Saved Attachments</div>
                    
                    {loadingAttachments ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent" />
                      </div>
                    ) : savedAttachments.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">No saved attachments found</div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto">
                        {savedAttachments.map((saved) => (
                          <button
                            key={saved._id || saved.id}
                            onClick={() => addSavedAttachment(saved)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <FiFolder size={16} className="text-yellow-500" />
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium truncate">{saved.originalName || saved.fileName || 'Unnamed file'}</div>
                              <div className="text-xs text-gray-400">{formatFileSize(saved.fileSize || saved.size || 0)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <IconButton className="text-gray-400 hover:text-red-600 hover:bg-red-50">
            <FiTrash2 size={18} />
          </IconButton>
        </div>

      </div>
    </div>
  );
};

export default CreateEmailModal;