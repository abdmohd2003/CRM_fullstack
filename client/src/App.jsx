import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { NotificationProvider } from "./components/ui/NotificationContext";
import { useAuth } from "./contexts/AuthContexts";
import { OrderProvider } from "./contexts/orderContext"; // Added

import "react-toastify/dist/ReactToastify.css";

// AUTH
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOTP from "./components/otp/VerifyOTP";

// MAIN
import Dashboard from "./pages/Dashboard";
import AppBar from "./components/common/AppBar";
import SideBar from "./components/common/SideBar";

// MODULES
import CompaniesList from "./pages/companies/CompaniesList";
import DealsList from "./pages/deals/DealsList";
import TicketList from "./pages/tickets/TicketsList";
import LeadsList from "./pages/leads/LeadsList";

// UNIVERSAL BOARD
import EntityActivityBoard from "./components/activity/EntityActivityBoard";

// ORDER & PAYMENT MODULES
import OrdersList from "./pages/orders/OrdersList";
import OrderPreview from "./pages/orders/OrderPreview";
import InvoicePreview from "./pages/orders/Invoice";
import PaymentsList from "./pages/payments/PaymentsList";
import PaymentPreview from "./pages/payments/PaymentPreview";

/* ---------------- AUTH GUARDS ---------------- */

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

/* ---------------- LAYOUT ---------------- */

function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppBar />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ORDER LAYOUT (with OrderProvider) ---------------- */

function OrderLayout({ children }) {
  return (
    <OrderProvider>
      <Layout>{children}</Layout>
    </OrderProvider>
  );
}

/* ---------------- ROUTES ---------------- */

function AppRoutes() {
  return (
    <Routes>
      {/* ROOT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* AUTH */}
      <Route path="/login"                 element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"              element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"       element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/verify-otp"            element={<PublicRoute><VerifyOTP /></PublicRoute>} />

      {/* DASHBOARD */}
<Route path="/dashboard" element={<PrivateRoute><OrderLayout><Dashboard /></OrderLayout></PrivateRoute>} />
      {/* 🏢 COMPANIES */}
      <Route path="/companies"                element={<PrivateRoute><Layout><CompaniesList /></Layout></PrivateRoute>} />
      <Route path="/companies/:id"            element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />
      <Route path="/companies/:id/notes"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />
      <Route path="/companies/:id/emails"     element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />
      <Route path="/companies/:id/calls"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />
      <Route path="/companies/:id/tasks"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />
      <Route path="/companies/:id/meetings"   element={<PrivateRoute><Layout><EntityActivityBoard entityType="company" /></Layout></PrivateRoute>} />

      {/* 🎯 LEADS */}
      <Route path="/leads"                element={<PrivateRoute><Layout><LeadsList /></Layout></PrivateRoute>} />
      <Route path="/leads/:id"            element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />
      <Route path="/leads/:id/notes"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />
      <Route path="/leads/:id/emails"     element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />
      <Route path="/leads/:id/calls"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />
      <Route path="/leads/:id/tasks"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />
      <Route path="/leads/:id/meetings"   element={<PrivateRoute><Layout><EntityActivityBoard entityType="lead" /></Layout></PrivateRoute>} />

      {/* 🤝 DEALS */}
      <Route path="/deals"                element={<PrivateRoute><Layout><DealsList /></Layout></PrivateRoute>} />
      <Route path="/deals/:id"            element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />
      <Route path="/deals/:id/notes"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />
      <Route path="/deals/:id/emails"     element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />
      <Route path="/deals/:id/calls"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />
      <Route path="/deals/:id/tasks"      element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />
      <Route path="/deals/:id/meetings"   element={<PrivateRoute><Layout><EntityActivityBoard entityType="deal" /></Layout></PrivateRoute>} />

      {/* 🎫 TICKETS */}
      <Route path="/tickets"              element={<PrivateRoute><Layout><TicketList /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id"          element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id/notes"    element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id/emails"   element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id/calls"    element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id/tasks"    element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />
      <Route path="/tickets/:id/meetings" element={<PrivateRoute><Layout><EntityActivityBoard entityType="ticket" /></Layout></PrivateRoute>} />

      {/* ============ ORDERS ============ */}
      <Route path="/orders" element={
        <PrivateRoute>
          <OrderLayout>
            <OrdersList />
          </OrderLayout>
        </PrivateRoute>
      } />
      
      <Route path="/orders/:id" element={
        <PrivateRoute>
          <OrderLayout>
            <OrderPreview />
          </OrderLayout>
        </PrivateRoute>
      } />

      {/* Invoice routes - accessed from order detail */}
      <Route path="/orders/:orderId/invoice" element={
        <PrivateRoute>
          <OrderLayout>
            <InvoicePreview />
          </OrderLayout>
        </PrivateRoute>
      } />
      
      <Route path="/invoices/:invoiceId" element={
        <PrivateRoute>
          <OrderLayout>
            <InvoicePreview />
          </OrderLayout>
        </PrivateRoute>
      } />

      {/* ============ PAYMENTS ============ */}
        <Route path="/payments/:paymentId" element={
        <PrivateRoute>
          <OrderLayout>
            <PaymentPreview />
          </OrderLayout>
        </PrivateRoute>
      } />
      <Route path="/payments" element={
        <PrivateRoute>
          <OrderLayout>
            <PaymentsList />
          </OrderLayout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

/* ---------------- APP MAIN ENTRY ---------------- */

function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </NotificationProvider>
  );
}

export default App;