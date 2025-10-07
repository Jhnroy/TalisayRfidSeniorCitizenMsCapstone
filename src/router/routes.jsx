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
import AdminRegistrants from "../pages/admin/AdminRegistrant";
import Pension from "../pages/admin/Pension";
import Archive from "../pages/admin/Archive";
import Calendar from "../pages/admin/Calendar";
import Settings from "../pages/admin/Settings";
import AdminMasterlist from "../pages/admin/AdminMasterlist";

// Super Admin (MSWD)
import SuperAdminDashboard from "../pages/superAdmin/SuperAdminDashboard";
import SuperAdminRegistrants from "../pages/superAdmin/SuperAdminRegistrants";
import Validation from "../pages/superAdmin/Validation";
import RfidBinding from "../pages/superAdmin/RfidBinding";
import Masterlist from "../pages/superAdmin/Masterlist";
import SuperAdminCalendar from "../pages/superAdmin/SuperAdminCalendar";

// DSWD

import DswdMasterlist from "../pages/dswdPage/DswdMasterlist";
import DswdPension from "../pages/dswdPage/DswdPension";
import DswdValidation from "../pages/dswdPage/DswdValidation";


// Not Found
import NotFound from "../pages/NotFound";

// ==============================
// 📌 Routes Setup
// ==============================
const routes = createBrowserRouter([
  // ------------------------------
  // Public Routes
  // ------------------------------
//   {
//   path: "/",
//   element: <Login />, // or some wrapper with <Outlet />
//   errorElement: <NotFound />,
//   children: [
//     { index: true, element: <LandingPage /> },
//     { path: "login", element: <Login /> },
//     { path: "signup", element: <SignUp /> },
//   ],
// },

  { path: "/", element: <Login /> },         // default first page = Login
  { path: "/signup", element: <SignUp /> }, // SignUp page
  { path: "*", element: <NotFound /> },

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
      { path: "admin-registrants", element: <AdminRegistrants /> },
      { path: "admin-masterlist", element: <AdminMasterlist /> },
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
      { path: "registrants", element: <SuperAdminRegistrants /> },
      { path: "validation", element: <Validation /> },
      { path: "super-admin-calendar", element: <SuperAdminCalendar /> },
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
      { index: true, element: <DswdMasterlist /> },
      { path: "dswd-pension", element: <DswdPension /> },
      { path: "dswd-validation", element: <DswdValidation /> },
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
