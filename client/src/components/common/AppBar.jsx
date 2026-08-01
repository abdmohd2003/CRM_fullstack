

import React, { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiBell,
  FiUser,
  FiBriefcase,
  FiGrid,
  FiTag,
  FiAlertCircle,
  FiMail,
  FiMessageCircle,
  FiX,
  FiTrash2,
  FiCheck,
  FiTrash,
  FiLogOut,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNotification } from "../ui/NotificationContext";
import { useAuth } from "../../contexts/AuthContexts";

import IconButton from "../ui/IconButton";
import Avatar from "../ui/Avatar";
import Chatbot from "../../components/ui/Chatot"

import { setLeads }     from "../../redux/slices/leadSlice";
import { setDeals }     from "../../redux/slices/dealSlice";
import { setCompanies } from "../../redux/slices/companySlice";
import { setTickets }   from "../../redux/slices/ticketSlice";
import axios from "axios";

const AppBar = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { user, logout, isAuthenticated } = useAuth();

  // ── Notifications ─────────────────────────────────────────────────────────
  const {
    hasNewNotification,
    clearNotificationBadge,
    notifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    clearReadNotifications,
    removeNotification,
  } = useNotification();

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery]           = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // ── Profile dropdown state ────────────────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // ── Notification state ────────────────────────────────────────────────────
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTab, setActiveTab]   = useState("all");
  const [showClearMenu, setShowClearMenu] = useState(false);
  const notificationRef = useRef(null);
  const clearMenuRef    = useRef(null);

  // ── Redux: live CRM data (used only by global search here) ────────────────
  const leads     = useSelector((state) => state.leads?.leads         || []);
  const deals     = useSelector((state) => state.deals?.deals         || []);
  const companies = useSelector((state) => state.company?.companies   || []);
  const tickets   = useSelector((state) => state.tickets?.tickets     || []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
        setShowClearMenu(false);
      }
      if (clearMenuRef.current && !clearMenuRef.current.contains(event.target)) {
        setShowClearMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return (
      (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "")
    ).toUpperCase() || "U";
  };

  const getUserFullName = () => {
    if (!user) return "User";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case "Admin":   return "bg-purple-100 text-purple-700";
      case "Manager": return "bg-blue-100 text-blue-700";
      case "Sales":   return "bg-green-100 text-green-700";
      default:        return "bg-gray-100 text-gray-700";
    }
  };

  // ── Global search logic ───────────────────────────────────────────────────
  const searchTerm = query.toLowerCase().trim();

  const searchResults =
    searchTerm.length > 1
      ? {
          leads: leads.filter(
            (item) =>
              item?.name?.toLowerCase().includes(searchTerm) ||
              item?.email?.toLowerCase().includes(searchTerm) ||
              item?.phone?.toLowerCase().includes(searchTerm)
          ),
          deals: deals.filter(
            (item) =>
              item?.dealName?.toLowerCase().includes(searchTerm) ||
              item?.name?.toLowerCase().includes(searchTerm) ||
              item?.stage?.toLowerCase().includes(searchTerm) ||
              (Array.isArray(item?.owner)
                ? item.owner.join(", ").toLowerCase()
                : String(item?.owner || "").toLowerCase()
              ).includes(searchTerm)
          ),
          companies: companies.filter(
            (item) =>
              item?.companyName?.toLowerCase().includes(searchTerm) ||
              item?.name?.toLowerCase().includes(searchTerm) ||
              item?.domainName?.toLowerCase().includes(searchTerm) ||
              item?.industry?.toLowerCase().includes(searchTerm) ||
              item?.city?.toLowerCase().includes(searchTerm)
          ),
          tickets: tickets.filter(
            (item) =>
              item?.ticketName?.toLowerCase().includes(searchTerm) ||
              item?.name?.toLowerCase().includes(searchTerm) ||
              item?.description?.toLowerCase().includes(searchTerm) ||
              item?.status?.toLowerCase().includes(searchTerm)
          ),
        }
      : { leads: [], deals: [], companies: [], tickets: [] };

  const hasResults = Object.values(searchResults).some((arr) => arr.length > 0);
  const totalResults = Object.values(searchResults).reduce((s, a) => s + a.length, 0);

  const handleNavigate = (path) => {
    navigate(path);
    setIsSearchOpen(false);
    setQuery("");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      setQuery("");
    }
  };

  // ── Notification helpers ──────────────────────────────────────────────────
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.path) {
      navigate(notification.path);
      setIsNotificationOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setShowClearMenu(false);
    toast.success("All notifications cleared");
  };

  const handleClearRead = () => {
    clearReadNotifications();
    setShowClearMenu(false);
    toast.success("Read notifications cleared");
  };

  const handleRemoveNotification = (e, notificationId) => {
    e.stopPropagation();
    removeNotification(notificationId);
    toast.info("Notification removed");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "lead":    return <FiUser          className="text-indigo-500" />;
      case "deal":    return <FiBriefcase     className="text-emerald-500" />;
      case "company": return <FiGrid          className="text-blue-500" />;
      case "ticket":  return <FiTag           className="text-rose-500" />;
      case "message": return <FiMessageCircle className="text-purple-500" />;
      case "email":   return <FiMail          className="text-cyan-500" />;
      default:        return <FiAlertCircle   className="text-gray-500" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case "lead":    return "bg-indigo-50";
      case "deal":    return "bg-emerald-50";
      case "company": return "bg-blue-50";
      case "ticket":  return "bg-rose-50";
      case "message": return "bg-purple-50";
      case "email":   return "bg-cyan-50";
      default:        return "bg-gray-50";
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60)  return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)  return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === "unread" ? !n.read : true
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── AppBar ─────────────────────────────────────────────────────────── */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">

        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/dashboard")}>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">CRM</h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">

          {/* ── Global Search ── */}
          <div className="relative group hidden md:block" ref={searchRef}>
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 z-10"
              size={16}
            />
            <input
              type="text"
              placeholder="Search leads, deals, companies, tickets..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-80 bg-gray-50/50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-9 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setIsSearchOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={14} />
              </button>
            )}

            {/* Search dropdown */}
            {isSearchOpen && query.length > 1 && (
              <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-[420px] overflow-y-auto z-50 custom-scrollbar">
                {hasResults && (
                  <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
                    </p>
                  </div>
                )}

                {!hasResults ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <FiSearch className="text-slate-400" size={18} />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching with different keywords</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {/* Leads */}
                    {searchResults.leads.length > 0 && (
                      <div className="mb-1">
                        <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                          <span>Leads</span>
                          <span className="text-indigo-400">{searchResults.leads.length}</span>
                        </div>
                        {searchResults.leads.slice(0, 4).map((lead) => (
                          <div
                            key={`lead-${lead._id || lead.id}`}
                            onClick={() => handleNavigate(`/leads/${lead._id || lead.id}`)}
                            className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                              <FiUser size={13} />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{lead.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{lead.email || lead.phone || "No contact info"}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${lead.status === "Open" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
                              {lead.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Deals */}
                    {searchResults.deals.length > 0 && (
                      <div className="mb-1">
                        <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                          <span>Deals</span>
                          <span className="text-emerald-400">{searchResults.deals.length}</span>
                        </div>
                        {searchResults.deals.slice(0, 4).map((deal) => (
                          <div
                            key={`deal-${deal._id || deal.id}`}
                            onClick={() => handleNavigate(`/deals/${deal._id || deal.id}`)}
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                              <FiBriefcase size={13} />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{deal.dealName || deal.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{deal.stage || "No stage"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Companies */}
                    {searchResults.companies.length > 0 && (
                      <div className="mb-1">
                        <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                          <span>Companies</span>
                          <span className="text-blue-400">{searchResults.companies.length}</span>
                        </div>
                        {searchResults.companies.slice(0, 4).map((company) => (
                          <div
                            key={`company-${company._id || company.id}`}
                            onClick={() => handleNavigate(`/companies/${company._id || company.id}`)}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                              <FiGrid size={13} />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{company.companyName || company.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{company.industry || company.domainName || "No industry"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tickets */}
                    {searchResults.tickets.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                          <span>Tickets</span>
                          <span className="text-rose-400">{searchResults.tickets.length}</span>
                        </div>
                        {searchResults.tickets.slice(0, 4).map((ticket) => (
                          <div
                            key={`ticket-${ticket._id || ticket.id}`}
                            onClick={() => handleNavigate(`/tickets/${ticket._id || ticket.id}`)}
                            className="px-4 py-2.5 hover:bg-rose-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                              <FiTag size={13} />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{ticket.ticketName || ticket.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{ticket.description || "No description"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Notification Bell ── */}
          <div className="relative" ref={notificationRef}>
            <div
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                if (isNotificationOpen) clearNotificationBadge();
              }}
              className="cursor-pointer"
            >
              <IconButton icon={FiBell} hasBadge={hasNewNotification} />
            </div>

            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-3 w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Notifications</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                      >
                        Mark all read
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setShowClearMenu(!showClearMenu)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      {showClearMenu && (
                        <div ref={clearMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                          <button
                            onClick={handleClearRead}
                            className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <FiCheck size={12} className="text-green-500" /> Clear read notifications
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                          >
                            <FiTrash size={12} /> Clear all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-white px-2">
                  {["all", "unread"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all relative capitalize ${activeTab === tab ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                      )}
                      {tab === "unread" && unreadCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-600">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FiBell className="text-slate-400" size={24} />
                      </div>
                      <p className="text-sm text-slate-500 text-center">
                        {activeTab === "all" ? "No notifications yet" : "No unread notifications"}
                      </p>
                      <p className="text-xs text-slate-400 text-center mt-1">
                        {activeTab === "all"
                          ? "When you receive notifications, they'll appear here"
                          : "Great! You're all caught up"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-5 py-4 cursor-pointer transition-all hover:bg-slate-50 group ${!notification.read ? "bg-indigo-50/30" : ""}`}
                        >
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${getNotificationBg(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notification.read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                                  {notification.title}
                                </p>
                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                                  )}
                                  <button
                                    onClick={(e) => handleRemoveNotification(e, notification.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                                  >
                                    <FiX size={12} className="text-slate-400" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-400">{getTimeAgo(notification.timestamp)}</span>
                                {!notification.read && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
                                  >
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                    >
                      View all notifications →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Profile Dropdown ── */}
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="cursor-pointer transition-transform hover:scale-105 flex items-center gap-3"
            >
              <Avatar label={getUserInitials()} />
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700">{getUserFullName()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                  {user?.role || "User"}
                </span>
              </div>
            </div>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar label={getUserInitials()} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{getUserFullName()}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || "user@example.com"}</p>
                    </div>
                  </div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                    {user?.role || "User"}
                  </span>
                </div>

                <button
                  onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <FiUser size={16} className="text-slate-400" /> My Profile
                </button>

                <button
                  onClick={() => { setIsProfileOpen(false); navigate("/change-password"); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <FiSettings size={16} className="text-slate-400" /> Change Password
                </button>

                {user?.role === "Admin" && (
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate("/admin"); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <FiShield size={16} className="text-slate-400" /> Admin Panel
                  </button>
                )}

                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <FiLogOut size={16} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ✅ Standalone chatbot — floats bottom-right, reads Redux automatically */}
      <Chatbot />
    </>
  );
};

export default AppBar;

