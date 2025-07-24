import React from "react";
import { createBrowserRouter } from "react-router-dom";


//Para sa mga layouts ini
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

//Para sa mga pages ini
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
    children: [{ index: true, element: <LandingPage /> }],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "admin", element: <AdminDashboard /> },
      { path: "senior-citizen", element: <SeniorcitizenList /> },
      {path: "pension", element: <Pension />},
      {path: "calendar", element: <Calendar />},
      {path: "settings", element: <Settings />}
    ],
  },
]);


export default routes;
