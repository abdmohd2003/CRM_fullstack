import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

// Slices & Services
import leadService from "../services/leadService";
import dealService from "../services/dealService";
import userService from "../services/userService";
import { setLeads, leadStart, leadFailure } from "../redux/slices/leadSlice";
import { setDeals, dealStart, dealSuccess, dealFailure } from "../redux/slices/dealSlice";
import { setUsers, userStart, userSuccess, userFailure } from "../redux/slices/userSlice";

// Order data (source of truth for revenue / payments)
import { useOrder } from "../contexts/orderContext";

// Components
import StatCard from "../components/cards/StatCard";
import DataTable from "../components/tables/DataTable";
import TableHeader from "../components/tables/TableHeader";

// Icons
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiDollarSign,
  FiDownload,
} from "react-icons/fi";

// Recharts
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

// --- Normalizes deal/lead stage strings so "Closed Won", "closed won",
// "CLOSED WON", "CLOSED_WON" all compare equal. Without this, a stored
// value like "CLOSED_WON" never matches a hardcoded "CLOSED WON" (space)
// check, and closedDeals/totalRevenue/percentages silently stay 0.
const normalizeStage = (stage) => {
  if (!stage) return "";
  return stage.trim().toUpperCase().replace(/\s+/g, "_");
};

// Order statuses that count as real, collected revenue. Used consistently
// for the "Total Revenue" stat card and the "Revenue Collected" chart bars
// so the two numbers can never drift apart.
const PAID_STATUSES = ["PAID", "COMPLETED"];

const Dashboard = () => {
  const dispatch = useDispatch();

  // --- REDUX STATE EXTRACTION ---
  const { leads, loading: leadsLoading, error: leadsError } = useSelector((state) => state.leads);
  const { deals, loading: dealsLoading, error: dealsError } = useSelector((state) => state.deals);
  const { users, loading: usersLoading, error: usersError } = useSelector((state) => state.users);

  // --- ORDER CONTEXT (real payment/revenue data) ---
  const { orders, loading: ordersLoading } = useOrder();

  const teamColumns = ["Employee", "Active Deals", "Closed Deals", "Revenue"];

  // --- ASYNC DATA FETCHING ON MOUNT ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      dispatch(leadStart());
      dispatch(dealStart());
      dispatch(userStart());
      try {
        const leadResponse = await leadService.getAllLeads();
        dispatch(setLeads(leadResponse.data || []));

        const dealResponse = await dealService.getDeals();
        const extractedDeals = dealResponse?.data?.deals || dealResponse?.deals || [];
        dispatch(setDeals(extractedDeals));
        dispatch(dealSuccess());

        // /api/users returns a flat array: [{ _id, firstName, lastName, email }]
        const userResponse = await userService.getAllUsers();
        const extractedUsers = Array.isArray(userResponse)
          ? userResponse
          : userResponse?.data || [];
        dispatch(setUsers(extractedUsers));
        dispatch(userSuccess());
      } catch (err) {
        dispatch(leadFailure(err.message || "Failed to fetch leads"));
        dispatch(dealFailure(err.message || "Failed to fetch deals"));
        dispatch(userFailure(err.message || "Failed to fetch users"));
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  // --- SAFE STATE EXTRACTORS ---
  const safeLeads = useMemo(() => (Array.isArray(leads) ? leads : []), [leads]);
  const safeDeals = useMemo(() => (Array.isArray(deals) ? deals : []), [deals]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  // --- STAT CARDS CALCULATIONS ---
  const totalLeads = safeLeads.length;
  const totalDealsCount = safeDeals.length;

  const activeDeals = safeDeals.filter((deal) => {
    const stage = normalizeStage(deal.stage);
    return stage !== "CLOSED_WON" && stage !== "CLOSED_LOST";
  }).length;

  const closedDeals = safeDeals.filter((deal) => {
    const stage = normalizeStage(deal.stage);
    return stage === "CLOSED_WON";
  }).length;

  // Total Revenue comes from real Orders (paid/completed), not from Deal
  // stage, since Orders/Payments are the actual source of collected money
  // (matches the Payments table: bank transfers marked COMPLETED).
  const totalRevenue = useMemo(() => {
    return safeOrders
      .filter((order) => PAID_STATUSES.includes(order.status))
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  }, [safeOrders]);

  // --- PROGRESS BAR CALCULATION MAPPED TO REAL BACKEND STAGES ---
  const getStagePercentage = (stageName) => {
    const denominator = totalLeads + totalDealsCount;
    if (denominator === 0) return 0;

    let matchCount = 0;

    switch (stageName) {
      case "Contact":
        matchCount = safeLeads.filter(lead => {
          const status = (lead.leadStatus || lead.status || "").toUpperCase();
          return status === "CONTACT" || status === "CONTACTED";
        }).length;
        return Math.round((matchCount / denominator) * 100);

      case "Qualified Lead":
        matchCount = safeLeads.filter(lead => {
          const status = (lead.leadStatus || lead.status || "").toUpperCase();
          return status === "QUALIFIED" || status === "QUALIFIED LEAD";
        }).length;
        return Math.round((matchCount / denominator) * 100);

      case "Contract Sent":
        matchCount = safeDeals.filter(deal => normalizeStage(deal.stage) === "CONTRACT_SENT").length;
        return Math.round((matchCount / denominator) * 100);

      case "Qualified to Buy":
        matchCount = safeDeals.filter(deal => normalizeStage(deal.stage) === "QUALIFIED_TO_BUY").length;
        return Math.round((matchCount / denominator) * 100);

      case "Closed Won":
        matchCount = safeDeals.filter(deal => normalizeStage(deal.stage) === "CLOSED_WON").length;
        return Math.round((matchCount / denominator) * 100);

      default:
        return 0;
    }
  };

  // --- GENERATE LIVE CHART DATA FROM BACKEND DEALS + ORDERS ---
  // "Revenue Collected" sums order.totalAmount for paid/completed orders
  // (same PAID_STATUSES + safeOrders as totalRevenue above, so the stat
  // card and chart always reconcile). "Open Pipeline Value" still comes
  // from deals, since open deals haven't been invoiced/paid yet.
  const liveMonthlyData = useMemo(() => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    const chartMap = months.map((m) => ({
      month: m,
      "Revenue Collected": 0,
      "Open Pipeline Value": 0,
    }));

    safeOrders.forEach((order) => {
      if (!PAID_STATUSES.includes(order.status)) return;
      const orderDate = order.paidAt
        ? new Date(order.paidAt)
        : order.createdAt
        ? new Date(order.createdAt)
        : new Date();
      const monthIndex = orderDate.getMonth();
      const amount = Number(order.totalAmount || 0);
      chartMap[monthIndex]["Revenue Collected"] += amount;
    });

    safeDeals.forEach((deal) => {
      const stage = normalizeStage(deal.stage);
      if (stage === "CLOSED_WON" || stage === "CLOSED_LOST") return;

      const dealDate = deal.createdAt ? new Date(deal.createdAt) : new Date();
      const monthIndex = dealDate.getMonth();
      const amount = Number(deal.amount || 0);
      chartMap[monthIndex]["Open Pipeline Value"] += amount;
    });

    return chartMap;
  }, [safeDeals, safeOrders]);

  const liveTeamData = useMemo(() => {
    const teamMap = {};

    // 1) Seed every active user so they always show up in the table
    safeUsers.forEach((user) => {
      const id = user._id;
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unnamed";
      teamMap[id] = {
        employee: name,
        activeDeals: 0,
        closedDeals: 0,
        revenue: 0,
      };
    });

    // 2) Layer deal stats on top, matched by owner id
    safeDeals.forEach((deal) => {
      const amount = Number(deal.amount || 0);
      const stage = normalizeStage(deal.stage);

      const ownerEntries = Array.isArray(deal.owner) && deal.owner.length > 0
        ? deal.owner
        : [];

      if (ownerEntries.length === 0) {
        return;
      }

      ownerEntries.forEach((ownerEntry) => {
        const ownerId = typeof ownerEntry === "string" ? ownerEntry : ownerEntry?._id;
        if (!ownerId) return;

        if (!teamMap[ownerId]) {
          const fallbackName = typeof ownerEntry === "object"
            ? `${ownerEntry.firstName || ""} ${ownerEntry.lastName || ""}`.trim() || ownerEntry.email
            : null;
          teamMap[ownerId] = {
            employee: fallbackName || "Unknown User",
            activeDeals: 0,
            closedDeals: 0,
            revenue: 0,
          };
        }

        if (stage === "CLOSED_WON") {
          teamMap[ownerId].closedDeals += 1;
          teamMap[ownerId].revenue += amount;
        } else if (stage !== "CLOSED_LOST") {
          teamMap[ownerId].activeDeals += 1;
        }
      });
    });

    return Object.values(teamMap).map((member) => ({
      name: member.employee,
      active: member.activeDeals,
      closed: member.closedDeals,
      revenue: `$${member.revenue.toLocaleString()}`,
    }));
  }, [safeUsers, safeDeals]);

  const handleExportCSV = () => {
    if (!liveTeamData || liveTeamData.length === 0) {
      console.warn("No team data available to export");
      return;
    }

    const headers = teamColumns;

    const escapeCSV = (value) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = liveTeamData.map((row) =>
      [row.name, row.active, row.closed, row.revenue].map(escapeCSV).join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `team-performance-${dateStamp}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // --- RENDERING HANDLERS ---
  if (leadsLoading || dealsLoading || usersLoading || ordersLoading) {
    return <div className="p-6 text-center font-bold text-slate-600">Loading Dashboard Metrics...</div>;
  }
  if (leadsError || dealsError || usersError) {
    return <div className="p-6 text-center font-bold text-rose-500">Error: {leadsError || dealsError || usersError}</div>;
  }

  return (
    <div className="space-y-6">
      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value={totalLeads} percentage="12" icon={FiUsers} color="indigo" />
        <StatCard title="Active Deals" value={activeDeals} percentage="5" icon={FiBriefcase} color="emerald" />
        <StatCard title="Closed Deals" value={closedDeals} percentage="8" icon={FiCheckCircle} color="amber" />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} percentage="10" icon={FiDollarSign} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROGRESS SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">
            Contact to Deal Conversion
          </h3>

          <div className="flex-1 flex flex-col justify-between py-2 gap-4">
            <ProgressItem label="Contact" value={getStagePercentage("Contact")} color="bg-indigo-500" />
            <ProgressItem label="Qualified Lead" value={getStagePercentage("Qualified Lead")} color="bg-emerald-400" />
            <ProgressItem label="Contract Sent" value={getStagePercentage("Contract Sent")} color="bg-amber-400" />
            <ProgressItem label="Qualified to Buy" value={getStagePercentage("Qualified to Buy")} color="bg-indigo-600" />
            <ProgressItem label="Closed Won" value={getStagePercentage("Closed Won")} color="bg-emerald-500" />
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Sales Pipeline Distribution (Real-Time)
            </h3>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-4 flex justify-center items-center overflow-x-auto min-h-[320px]">
            <BarChart width={700} height={280} data={liveMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }} tickMargin={12} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={2}
                    textAnchor="end"
                    fontSize={10}
                    fontWeight={600}
                    fill="#64748B"
                  >
                    {payload.value >= 1000 ? `$${(payload.value / 1000).toFixed(1)}k` : `$${payload.value}`}
                  </text>
                )}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", padding: "10px", fontSize: "11px", fontWeight: "600" }}
                cursor={{ fill: "rgba(226, 232, 240, 0.3)" }}
                formatter={(value) => `$${value}`}
              />
              <Bar dataKey="Revenue Collected" name="Revenue Collected" stackId="a" fill="#7B61FF" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Open Pipeline Value" name="Open Pipeline Value" stackId="a" fill="#C7B9FF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <TableHeader title="Team Performance Tracking" showSearch={false} showFilter={false} showDownload={false} showAdd={false}>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-700 bg-white border border-indigo-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm cursor-pointer">
            <FiDownload size={16} /> Export CSV
          </button>
        </TableHeader>
        <DataTable columns={teamColumns} data={liveTeamData} />
      </div>
    </div>
  );
};

const ProgressItem = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <span className="text-[10px] font-bold text-slate-400">{value}%</span>
    </div>
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default Dashboard;