import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";           // OSCA
import SuperAdminLayout from "../layouts/SuperAdminLayout"; // MSWD
import DswdLayout from "../layouts/DswdLayout";             // DSWD

// Components
import ProtectedRoute from "../components/ProtectedRoute";

// Pages
import LandingPage from "../pages/LandingPage";
import Login from "../pages/admin/Login";
import SignUp from "../pages/admin/SignUp";

// Admin (OSCA)
import AdminDashboard from "../pages/admin/AdminDashboard";
import SeniorcitizenList from "../pages/admin/SeniorcitizenList";
import Pending from "../pages/admin/Pending";
import AddNewMembers from "../pages/admin/AddNewMembers";
import Pension from "../pages/admin/Pension";
import Archive from "../pages/admin/Archive";
import Calendar from "../pages/admin/Calendar";
import Settings from "../pages/admin/Settings";

// Super Admin (MSWD)
import SuperAdminDashboard from "../pages/superAdmin/SuperAdminDashboard";
import Registrants from "../pages/superAdmin/Registrants";
import Validation from "../pages/superAdmin/Validation";
import RfidBinding from "../pages/superAdmin/RfidBinding";
import Masterlist from "../pages/superAdmin/Masterlist";

// DSWD
import DswdDashboard from "../pages/dswdPage/DswdDashboard";

// Not Found
import NotFound from "../pages/NotFound";

// ==============================
// 📌 Routes Setup
// ==============================
const routes = createBrowserRouter([
  // ------------------------------
  // Public Routes
  // ------------------------------
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <SignUp /> },
    ],
  },

  // ------------------------------
  // OSCA Admin (Moderator)
  // ------------------------------
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["OSCA"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "senior-citizen", element: <SeniorcitizenList /> },
      { path: "pending", element: <Pending /> },
      { path: "add-member", element: <AddNewMembers /> },
      { path: "pension", element: <Pension /> },
      { path: "archive", element: <Archive /> },
      { path: "calendar", element: <Calendar /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // ------------------------------
  // MSWD Super Admin
  // ------------------------------
  {
    path: "/super-admin",
    element: (
      <ProtectedRoute allowedRoles={["MSWD"]}>
        <SuperAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: "registrants", element: <Registrants /> },
      { path: "validation", element: <Validation /> },
      { path: "calendar", element: <Calendar /> },
      { path: "rfid-binding", element: <RfidBinding /> },
      { path: "masterlist", element: <Masterlist /> },
    ],
  },

  // ------------------------------
  // DSWD Admin
  // ------------------------------
  {
    path: "/dswd-admin",
    element: (
      <ProtectedRoute allowedRoles={["DSWD"]}>
        <DswdLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DswdDashboard /> },
    ],
  },

  // ------------------------------
  // Catch-all 404
  // ------------------------------
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
