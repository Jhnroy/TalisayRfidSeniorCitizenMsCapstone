import { createBrowserRouter } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

// Pages
import LandingPage from "../pages/LandingPage";
import Login from "../pages/admin/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import SeniorcitizenList from "../pages/admin/SeniorcitizenList";
import Pension from "../pages/admin/Pension";
import Calendar from "../pages/admin/Calendar";
import Settings from "../pages/admin/Settings";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <Login /> },
    ],
  },
  {
    path: "/admin",
    element: <AuthLayout />,
    children: [
      { index: true, element: <AdminDashboard /> }, // /admin
      { path: "senior-citizen", element: <SeniorcitizenList /> }, // /admin/senior-citizen
      { path: "pension", element: <Pension /> }, // /admin/pension
      { path: "calendar", element: <Calendar /> }, // /admin/calendar
      { path: "settings", element: <Settings /> }, // /admin/settings
    ],
  },
]);

export default routes;
