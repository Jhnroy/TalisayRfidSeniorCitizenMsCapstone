import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // ⏳ While checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <h1 className="text-xl font-semibold">Checking authentication...</h1>
      </div>
    );
  }

  // ❌ No user → redirect login
  if (!user) {
    console.log("🚨 Redirecting: No user found");
    return <Navigate to="/login" replace />;
  }

  // ❌ No role in DB
  if (!user.role) {
    console.warn("⚠️ No role found in DB");
    return <Navigate to="/login" replace />;
  }

  // ❌ User exists but role not in allowedRoles
  if (allowedRoles && user.role) {
    const normalizedAllowedRoles = allowedRoles.map((r) =>
      (r || "").toUpperCase().trim()
    );
    const normalizedUserRole = (user.role || "").toUpperCase().trim();

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.warn(
        `🚫 Access denied. User role: ${normalizedUserRole}, Allowed: ${normalizedAllowedRoles.join(", ")}`
      );

      // Redirect based on actual role
      if (normalizedUserRole === "MSWD") return <Navigate to="/super-admin" replace />;
      if (normalizedUserRole === "OSCA") return <Navigate to="/admin" replace />;
      if (normalizedUserRole === "DSWD") return <Navigate to="/dswd-admin" replace />;

      return <Navigate to="/login" replace />;
    }
  }

  // ✅ Allowed
  console.log("✅ Access granted. Role:", user.role);
  return children;
};

export default ProtectedRoute;
