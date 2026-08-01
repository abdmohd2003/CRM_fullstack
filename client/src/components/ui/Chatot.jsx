// client/src/components/Chatbot.jsx
// Standalone floating chatbot — fetches its own CRM data from backend (not dependent
// on other pages having been visited first), calls /api/chat with JWT

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSend, FiX, FiMessageSquare, FiRefreshCw } from "react-icons/fi";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast"; // adjust import if you use a different toast lib

// ── Adjust these paths to match your project structure ──
import leadService from "../../services/leadService";
import companyService from "../../services/companyService";
import dealService from "../../services/dealService";
import ticketService from "../../services/ticketService";
import orderService from "../../services/order/orderService";
import paymentService from "../../services/order/paymentService";

import { setLeads } from "../../redux/slices/leadSlice";
import {
  companyStart,
  companySuccess,
  companyFailure,
  setCompanies,
} from "../../redux/slices/companySlice";
import { dealStart, dealSuccess, dealFailure, setDeals } from "../../redux/slices/dealSlice";
import {
  setLoading as setTicketLoading,
  setError as setTicketError,
  setTickets,
} from "../../redux/slices/ticketSlice";
import {
  orderStart,
  orderSuccess,
  orderFailure,
  setOrders,
} from "../../redux/slices/orderSlice";
import {
  paymentStart,
  paymentSuccess,
  paymentFailure,
  setPayments,
} from "../../redux/slices/paymentSlice";

// ── Orders/Payments come from the existing OrderContext, which already
// fetches on app mount via OrderProvider — no need to duplicate that fetch here.
import { useOrder } from "../../contexts/orderContext";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL || "https://crm-software-yh77.onrender.com/api/chat";
  const MAX_HISTORY = 20;


// ─── QUICK PROMPT CHIPS ───────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Show me all open leads",
  "Which deals are in negotiation?",
  "Any high-priority tickets?",
  "Summarize my sales pipeline",
  "Which companies have no open deals?",
  "What leads came in this month?",
  "Show me pending orders",
  "Any failed payments recently?",
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const buildSystemPrompt = ({ leads, deals, companies, tickets, orders, payments }) =>
  `You are a helpful CRM assistant for a sales team.
Today's date is ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.

You have access to the following live workspace data:

LEADS (${leads.length} total):
${JSON.stringify(leads.slice(0, 80))}

DEALS (${deals.length} total):
${JSON.stringify(deals.slice(0, 80))}

COMPANIES (${companies.length} total):
${JSON.stringify(companies.slice(0, 80))}

TICKETS (${tickets.length} total):
${JSON.stringify(tickets.slice(0, 80))}

ORDERS (${orders.length} total):
${JSON.stringify(orders.slice(0, 80))}

PAYMENTS (${payments.length} total):
${JSON.stringify(payments.slice(0, 80))}

Guidelines:
- Answer only based on the data above. Do not invent records.
- Use bullet points when listing multiple items.
- Include name and key details when referencing any record.
- For orders, include order status and total amount when relevant.
- For payments, include payment status, method, and amount when relevant. Never invent or guess card numbers or other sensitive payment details — only use what's in the data above.
- Keep replies under 200 words unless user asks for a detailed breakdown.
- Format dates as DD/MM/YYYY and currency amounts with their currency symbol.`.trim();

// ─── RESPONSE-SHAPE HELPER ─────────────────────────────────────────────────────
// Backends vary in how they wrap list responses (e.g. { data: { payments } },
// { payments }, { data: { results } }, or just a bare array). This walks the
// common shapes and returns the first array it finds, checking `keys` at both
// the top level and one level under `.data`.
const extractArray = (res, keys = []) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  for (const key of keys) {
    if (Array.isArray(res?.[key])) return res[key];
    if (Array.isArray(res?.data?.[key])) return res.data[key];
  }
  return [];
};

// ─── TOKEN HELPER ─────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  "";

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const Chatbot = () => {
  const dispatch = useDispatch();

  // Orders/payments come straight from the existing OrderContext.
  const {
    orders,
    stats: orderStats,
    loading: ordersLoading,
    refreshOrders,
  } = useOrder();

  const [isOpen, setIsOpen]                     = useState(false);
  const [input, setInput]                       = useState("");
  const [isLoading, setIsLoading]               = useState(false);
  const [history, setHistory]                   = useState([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [messages, setMessages]                 = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your CRM Assistant.\nAsk me about your leads, deals, companies, tickets, orders, or payments — or pick a quick question below.",
      isBot: true,
    },
  ]);

  // ── Chatbot's own copy of CRM data (independent of which pages were visited) ──
  const [crmData, setCrmData] = useState({
    leads: [],
    deals: [],
    companies: [],
    tickets: [],
    orders: [],
    payments: [],
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded]   = useState(false);

  const bottomRef = useRef(null);

  // ── Fetch all CRM data the chatbot needs, straight from backend ──────────
  const fetchAllCrmData = useCallback(async () => {
    setDataLoading(true);

    const results = await Promise.allSettled([
      // Leads
      (async () => {
        const res = await leadService.getAllLeads();
        const leads = res?.data || [];
        dispatch(setLeads(leads));
        return leads;
      })(),

      // Companies
      (async () => {
        dispatch(companyStart());
        const res = await companyService.getCompanies();
        if (res?.success) {
          const companies = res.data?.companies || [];
          dispatch(companySuccess());
          if (typeof setCompanies === "function") {
            dispatch(setCompanies(companies));
          }
          return companies;
        }
        dispatch(companyFailure(res?.message || "Failed to fetch companies"));
        return [];
      })(),

      // Deals
      (async () => {
        dispatch(dealStart());
        const res = await dealService.getDeals();
        if (res?.success) {
          const deals = res.data?.deals || [];
          dispatch(setDeals(deals));
          dispatch(dealSuccess());
          return deals;
        }
        dispatch(dealFailure(res?.message || "Failed to fetch deals"));
        return [];
      })(),

      // Tickets
      (async () => {
        dispatch(setTicketLoading(true));
        const res = await ticketService.getTickets();
        if (res?.success) {
          const tickets = res.data?.tickets || [];
          dispatch(setTickets(tickets));
          return tickets;
        }
        dispatch(setTicketError(res?.message || "Failed to fetch tickets"));
        return [];
      })(),

      // Orders
      (async () => {
        dispatch(orderStart());
        try {
          const res = await orderService.getOrders();
          const orders = extractArray(res, ["orders", "results", "docs", "data"]);
          dispatch(setOrders(orders));
          dispatch(orderSuccess());
          return orders;
        } catch (err) {
          dispatch(orderFailure(err?.message || "Failed to fetch orders"));
          return [];
        }
      })(),

      // Payments
      (async () => {
        dispatch(paymentStart());
        try {
          const res = await paymentService.getPayments();
          const payments = extractArray(res, ["payments", "results", "docs", "data"]);
          dispatch(setPayments(payments));
          dispatch(paymentSuccess());
          return payments;
        } catch (err) {
          dispatch(paymentFailure(err?.message || "Failed to fetch payments"));
          return [];
        }
      })(),
    ]);

    const [leadsRes, companiesRes, dealsRes, ticketsRes, ordersRes, paymentsRes] = results;

    setCrmData({
      leads: leadsRes.status === "fulfilled" ? leadsRes.value : [],
      companies: companiesRes.status === "fulfilled" ? companiesRes.value : [],
      deals: dealsRes.status === "fulfilled" ? dealsRes.value : [],
      tickets: ticketsRes.status === "fulfilled" ? ticketsRes.value : [],
      orders: ordersRes.status === "fulfilled" ? ordersRes.value : [],
      payments: paymentsRes.status === "fulfilled" ? paymentsRes.value : [],
    });

    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error("Chatbot data fetch failed:", r.reason);
      }
    });

    // Orders live in OrderContext already; just make sure they're fresh.
    try {
      await refreshOrders();
    } catch (err) {
      console.error("Chatbot order refresh failed:", err);
    }

    dispatch(setTicketLoading(false));
    setDataLoading(false);
    setDataLoaded(true);
  }, [dispatch, refreshOrders]);

  // ── Fetch data once, the first time the chatbot is opened ────────────────
  useEffect(() => {
    if (isOpen && !dataLoaded && !dataLoading) {
      fetchAllCrmData();
    }
  }, [isOpen, dataLoaded, dataLoading, fetchAllCrmData]);


  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    setShowQuickPrompts(false);
    setInput("");

    setMessages((prev) => [...prev, { id: Date.now(), text: userText, isBot: false }]);
    setIsLoading(true);

    const updatedHistory = [
      ...history,
      { role: "user", content: userText },
    ].slice(-MAX_HISTORY);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 1024,
          system:     buildSystemPrompt({ leads, deals, companies, tickets, orders, payments }),
          messages:   updatedHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }

      const data = await res.json();

      const reply =
        data.reply ||
        data.content?.[0]?.text ||
        data.message ||
        "Sorry, I received an unexpected response.";

      setHistory([
        ...updatedHistory,
        { role: "assistant", content: reply },
      ].slice(-MAX_HISTORY));

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: reply, isBot: true },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `⚠️ ${err.message || "Could not reach the server. Check your API setup."}`,
          isBot: true,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // ── Reset conversation ────────────────────────────────────────────────────
  const handleReset = () => {
    setMessages([{
      id: Date.now(),
      text: "Conversation cleared! What would you like to know about your CRM data?",
      isBot: true,
    }]);
    setHistory([]);
    setShowQuickPrompts(true);
  };

  // ── Manual refresh of CRM data ────────────────────────────────────────────
  const handleRefreshData = () => {
    setDataLoaded(false); // triggers re-fetch via the effect above
  };

  const isDataBusy = (dataLoading && !dataLoaded) || ordersLoading;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans antialiased">

      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open CRM Assistant"
          className="flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <div className="relative w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl">
            <FiMessageSquare size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[560px] bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-indigo-600 px-4 py-3.5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center border border-indigo-400/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 0 1 10 10v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1A10 10 0 0 1 12 2z" />
                  <circle cx="9" cy="11" r="1" fill="currentColor" />
                  <circle cx="15" cy="11" r="1" fill="currentColor" />
                  <path d="M16 16c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">CRM Assistant</h3>
                <p className="text-[10px] text-indigo-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  {isLoading ? "Thinking…" : isDataBusy ? "Loading data…" : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefreshData}
                title="Refresh CRM data"
                disabled={isDataBusy}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
              >
                <FiRefreshCw size={15} className={isDataBusy ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handleReset}
                title="Clear conversation"
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiMessageSquare size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX size={17} />
              </button>
            </div>
          </div>

          {/* ── Live data counts bar ── */}
          <div className="flex items-center px-3 py-2 bg-indigo-50 border-b border-indigo-100 shrink-0 overflow-x-auto">
            {[
              { label: "Leads",     count: leads.length,     color: "text-indigo-600"  },
              { label: "Deals",     count: deals.length,     color: "text-emerald-600" },
              { label: "Companies", count: companies.length, color: "text-blue-600"    },
              { label: "Tickets",   count: tickets.length,   color: "text-rose-600"    },
              { label: "Orders",    count: orders.length,    color: "text-amber-600"   },
              { label: "Payments",  count: payments.length,  color: "text-teal-600"    },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex flex-col items-center flex-1 min-w-[44px]">
                <span className={`text-xs font-bold ${color}`}>
                  {isDataBusy ? "…" : count}
                </span>
                <span className="text-[9px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3">

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    msg.isBot
                      ? msg.isError
                        ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-none"
                        : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none"
                      : "bg-indigo-600 text-white shadow-sm rounded-tr-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick prompt chips */}
            {showQuickPrompts && messages.length === 1 && (
              <div className="pt-1">
                <p className="text-[10px] text-slate-400 mb-2 font-medium">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={isDataBusy}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm disabled:opacity-40"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask about your leads, deals, orders…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shrink-0 disabled:opacity-40 disabled:hover:bg-indigo-600 active:scale-95"
            >
              <FiSend size={14} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default Chatbot;