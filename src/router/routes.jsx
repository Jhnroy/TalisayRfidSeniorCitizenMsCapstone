import React, { useEffect, useState } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { auth } from "./Firebase";
import { onAuthStateChanged } from "firebase/auth";

// Layouts
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

// Pages
import LandingPage from "../pages/LandingPage";
import Login from "../pages/admin/Login";
import SignUp from "../pages/admin/SignUp";
import AdminDashboard from "../pages/admin/AdminDashboard";
import SeniorcitizenList from "../pages/admin/SeniorcitizenList";
import Pension from "../pages/admin/Pension";
import Calendar from "../pages/admin/Calendar";
import Settings from "../pages/admin/Settings";
import NotFound from "../pages/NotFound"; // ✅ Added custom 404 page

// ==============================
// 🔒 Protected Route Component
// ==============================
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <h1 className="text-xl font-semibold">Checking authentication...</h1>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// ==============================
// 📌 Routes Setup
// ==============================
const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />, // ✅ Added
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <SignUp /> },
    ],
  },
  {
    path: "/admin",
    element: <AuthLayout />,
    errorElement: <NotFound />, // ✅ Added
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "senior-citizen",
        element: (
          <ProtectedRoute>
            <SeniorcitizenList />
          </ProtectedRoute>
        ),
      },
      {
        path: "pension",
        element: (
          <ProtectedRoute>
            <Pension />
          </ProtectedRoute>
        ),
      },
      {
        path: "calendar",
        element: (
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // ✅ Catch-all route for undefined URLs
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
