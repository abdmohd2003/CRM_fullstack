import React, { useState } from "react";
import Papa from "papaparse";
import { toast } from "react-toastify";
import { FiUpload, FiX, FiFileText, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import leadService from "../../services/leadService";

const ImportLeadsModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const requiredColumns = ["firstName", "lastName", "email", "phone"];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        // Validate required columns exist in the CSV header
        const headers = results.meta.fields || [];
        const missing = requiredColumns.filter((col) => !headers.includes(col));

        if (missing.length > 0) {
          setErrors([`Missing required columns: ${missing.join(", ")}`]);
          setParsedRows([]);
          return;
        }

        // Validate each row has a usable email
        const rowErrors = [];
        rows.forEach((row, idx) => {
          if (!row.email || !row.email.includes("@")) {
            rowErrors.push(`Row ${idx + 2}: missing or invalid email`);
          }
        });

        setErrors(rowErrors);
        setParsedRows(rows);
      },
      error: (err) => {
        toast.error("Failed to parse CSV: " + err.message);
      },
    });
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const response = await leadService.bulkImportLeads(parsedRows);
      toast.success(
        `${response.data?.successCount ?? parsedRows.length} leads imported successfully`
      );
      if (response.data?.failedCount > 0) {
        toast.warn(`${response.data.failedCount} rows failed to import`);
      }
      onImportSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error(error.message || "Failed to import leads");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setErrors([]);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent =
      "firstName,lastName,email,phone,status\n" +
      "John,Doe,john@example.com,9876543210,New\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "leads_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[520px] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Import Leads</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Upload a CSV file with columns: <code>firstName, lastName, email, phone, status</code>
        </p>

        <button
          onClick={downloadTemplate}
          className="text-xs font-bold text-indigo-600 hover:underline mb-4"
        >
          Download CSV template
        </button>

        {/* File drop area */}
        <label
          htmlFor="csvFileInput"
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-indigo-300 transition-all"
        >
          <FiUpload className="text-gray-400" size={28} />
          <span className="text-sm text-gray-500">
            {file ? file.name : "Click to select a CSV file"}
          </span>
          <input
            id="csvFileInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 space-y-1 max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                <FiAlertCircle className="shrink-0 mt-0.5" size={12} />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Preview */}
        {parsedRows.length > 0 && errors.length === 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mb-2">
              <FiCheckCircle size={14} /> {parsedRows.length} leads ready to import
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">Email</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                      <td className="px-3 py-2 text-gray-500">{row.email}</td>
                      <td className="px-3 py-2 text-gray-500">{row.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 5 && (
                <p className="text-[10px] text-gray-400 text-center py-2">
                  +{parsedRows.length - 5} more rows
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || errors.length > 0 || importing}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <FiFileText className="animate-pulse" /> Importing...
              </>
            ) : (
              `Import ${parsedRows.length || ""} Leads`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsModal;