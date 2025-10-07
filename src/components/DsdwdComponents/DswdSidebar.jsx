import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const DswdSidebar = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menus = [
    { name: "Masterlist", icon: LayoutDashboard, path: "/dswd-admin" },
    { name: "Validation", icon: CheckCircle, path: "/dswd-admin/dswd-validation" },
    // { name: "Pension", icon: Users, path: "/dswd-admin/dswd-pension" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Header/Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-blue-600 transition-all"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-xl font-bold">DSWD</h1>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg 
          flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Desktop Header */}
        <div className="px-6 py-5 border-b border-blue-600 lg:block hidden">
          <h1 className="text-2xl font-bold">DSWD</h1>
        </div>

        {/* Mobile Header inside sidebar */}
        <div className="px-6 py-5 border-b border-blue-600 lg:hidden flex items-center justify-between">
          <h1 className="text-2xl font-bold">DSWD</h1>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="px-2 py-4 space-y-3">
            {menus.map((menu, idx) => (
              <li key={idx}>
                <NavLink
                  to={menu.path}
                  end
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold text-lg"
                        : "hover:bg-blue-600 text-lg"
                    }`
                  }
                >
                  <menu.icon className="w-6 h-6" />
                  <span>{menu.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-lg font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Add padding to main content for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default DswdSidebar;