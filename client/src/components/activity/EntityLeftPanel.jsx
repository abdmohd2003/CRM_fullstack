import React from "react";
import { FiEdit2, FiCopy } from "react-icons/fi";
import DetailItem from "../../components/ui/DetailItem"
import QuickActionButton from "../../components/ui/QuickActionButton"; 

const EntityLeftPanel = ({ entityType, entityData, quickActions }) => {
  if (!entityData) return null;

  // 1. Dynamic Variables
  let initials = "";
  let title = "";
  let subtitle = "";
  let copyText = "";

  // Helper functions
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "-";
  };

  const getOwnerName = (ownerData) => {
    if (!ownerData) return "-";
    const ownerArray = Array.isArray(ownerData) ? ownerData : [ownerData];
    return ownerArray.map(owner =>
      typeof owner === 'object' ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() : owner
    ).join(", ") || "-";
  };

  // 2. Data Mapping based on Entity Type
  if (entityType === "lead") {
    initials = `${entityData.firstName?.charAt(0) || ""}${entityData.lastName?.charAt(0) || ""}`;
    title = `${entityData.firstName || ""} ${entityData.lastName || ""}`.trim() || "Unnamed Lead";
    subtitle = entityData.jobTitle || "-";
    copyText = entityData.email || "";
  } 
  else if (entityType === "company") {
    initials = (entityData.name || "C").charAt(0);
    title = entityData.name || "Unnamed Company";
    subtitle = entityData.industry || "-";
    copyText = entityData.website || entityData.domain || entityData.phone || "";
  } 
  else if (entityType === "deal") {
    initials = (entityData.name || entityData.dealName || "D").charAt(0);
    title = entityData.name || entityData.dealName || "Unnamed Deal";
    subtitle = entityData.stage || "-";
    copyText = entityData.amount ? `$${entityData.amount}` : "";
  } 
  else if (entityType === "ticket") {
    initials = (entityData.ticketName || "T").charAt(0);
    title = entityData.ticketName || "Unnamed Ticket";
    subtitle = `Priority: ${entityData.priority || "Medium"}`;
    copyText = entityData.ticketStatus || "New";
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
      {/* ── TOP AVATAR & TITLE SECTION ── */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-sm text-slate-400 shrink-0 uppercase">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 truncate">
            {title}
          </p>

          <p className="text-[11px] text-slate-400 font-semibold truncate">
            {subtitle}
          </p>

          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-slate-400 truncate max-w-[115px]">
              {copyText || "-"}
            </span>

            {copyText && (
              <FiCopy
                size={10}
                className="text-slate-300 cursor-pointer hover:text-indigo-500 shrink-0 transition-colors"
                onClick={() => navigator.clipboard.writeText(copyText)}
                title="Copy to clipboard"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      {quickActions && quickActions.length > 0 && (
        <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100">
          {quickActions.map(({ icon, label, onClick }) => (
            <QuickActionButton
              key={label}
              icon={icon}
              label={label}
              onClick={onClick}
            />
          ))}
        </div>
      )}

      {/* ── ABOUT SECTION ── */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            About this {entityType}
          </span>

          <FiEdit2
            size={11}
            className="text-indigo-500 cursor-pointer hover:text-indigo-700 transition-colors"
          />
        </div>

        {/* Dynamic Detail Items */}
        {entityType === "lead" && (
          <>
            <DetailItem label="Email" value={entityData.email || "-"} />
            <DetailItem label="First Name" value={entityData.firstName || "-"} />
            <DetailItem label="Last Name" value={entityData.lastName || "-"} />
            <DetailItem label="Phone number" value={entityData.phone || "-"} />
            <DetailItem label="Lead Status" value={entityData.status || "New"} isBadge />
            <DetailItem label="Job Title" value={entityData.jobTitle || "-"} />
            <DetailItem label="Created Date" value={formatDate(entityData.createdAt)} />
          </>
        )}

        {entityType === "company" && (
          <>
            <DetailItem label="Domain" value={entityData.website || entityData.domain || "-"} />
            <DetailItem label="Industry" value={entityData.industry || "-"} />
            <DetailItem label="City" value={entityData.city || "-"} />
            <DetailItem label="Phone" value={entityData.phone || "-"} />
            <DetailItem label="Owner" value={getOwnerName(entityData.companyOwner)} />
            <DetailItem label="Created Date" value={formatDate(entityData.createdAt)} />
          </>
        )}

        {entityType === "deal" && (
          <>
            <DetailItem label="Amount" value={entityData.amount ? `$${entityData.amount}` : "-"} />
            <DetailItem label="Stage" value={entityData.stage || "-"} isBadge />
            <DetailItem label="Priority" value={entityData.priority || "-"} isBadge />
            <DetailItem label="Lead Name" value={entityData.leadName || "-"} />
            <DetailItem label="Owner" value={getOwnerName(entityData.dealOwner || entityData.owner)} />
            <DetailItem label="Close Date" value={formatDate(entityData.closeDate)} />
            <DetailItem label="Created Date" value={formatDate(entityData.createdAt || entityData.createdDate)} />
          </>
        )}

        {entityType === "ticket" && (
          <>
            <DetailItem label="Description" value={entityData.description || "-"} />
            <DetailItem label="Status" value={entityData.ticketStatus || "-"} isBadge />
            <DetailItem label="Priority" value={entityData.priority || "-"} isBadge />
            <DetailItem label="Source" value={entityData.source || "-"} />
            <DetailItem label="Associated Deal" value={entityData.associatedDeal?.name || "-"} />
            <DetailItem label="Owner" value={getOwnerName(entityData.ticketOwner || entityData.owner)} />
            <DetailItem label="Created Date" value={formatDate(entityData.createdAt)} />
          </>
        )}
      </div>
    </div>
  );
};

export default EntityLeftPanel;