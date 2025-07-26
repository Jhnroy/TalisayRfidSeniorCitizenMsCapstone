import {
  FaTachometerAlt,
  FaUser,
  FaCalendarAlt,
  FaMoneyCheckAlt,
  FaInfoCircle,
  FaTools,
  FaCogs,
  FaChartLine,
  FaCog,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { HiMenu } from "react-icons/hi";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/admin" },
    { label: "Senior Citizen", icon: <FaUser />, path: "/admin/senior-citizen" },
    { label: "Calendar", icon: <FaCalendarAlt />, path: "/admin/calendar" },
    { label: "Pension", icon: <FaMoneyCheckAlt />, path: "/admin/pension" },
    { label: "Inquiry", icon: <FaInfoCircle />, path: "/inquiry" },
    { label: "Coordinator Tools", icon: <FaTools />, path: "/coordinator-tools" },
    { label: "Policy Admin", icon: <FaCogs />, path: "/policy-admin" },
    { label: "Reports", icon: <FaChartLine />, path: "/reports" },
    { label: "Settings", icon: <FaCog />, path: "/admin/settings" },
  ];

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
      >
        <HiMenu className="text-2xl text-gray-700" />
      </button>

      {/* Backdrop when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-white shadow transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ul className="pt-4">
          {menuItems.map(({ label, icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setIsOpen(false)} // close menu when item is clicked
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 cursor-pointer ${
                  isActive
                    ? "bg-orange-100 text-orange-600 font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }`
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </ul>
      </div>
    </>
  );
};

export default AdminSidebar;
