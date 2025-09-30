import {
  FaTachometerAlt,
  FaUserPlus,
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaUsersCog,
  FaChartLine,
  FaCog,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const SuperAdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [registrantOpen, setRegistrantOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/super-admin", exact: true },
    {
      label: "Registrants",
      icon: <FaUserPlus />,
      path: "/super-admin/registrants",
      exact: true,
      subMenu: [
        { label: "Validation", icon: <FaCheckCircle />, path: "/super-admin/validation" },
      ],
    },
    { label: "Calendar", icon: <FaCalendarAlt />, path: "/super-admin/calendar" },
    {label: "RFID Binding", icon: <FaFileAlt />, path: "/super-admin/rfid-binding", exact: true},
    { label: "Masterlist", icon: <FaFileAlt />, path: "/super-admin/masterlist" },
    // { label: "Admin Management", icon: <FaUsersCog />, path: "/super-admin/admin-management" },
    // { label: "Reports", icon: <FaChartLine />, path: "/super-admin/reports" },
    // { label: "Settings", icon: <FaCog />, path: "/super-admin/settings" },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
      >
        <HiMenu className="text-2xl text-gray-700" />
      </button>

      {/* Backdrop for mobile */}
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
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">MSWDO Admin</h1>
          <p className="text-sm text-gray-500">Super Admin Dashboard</p>
        </div>

        <ul className="pt-4">
          {menuItems.map(({ label, icon, path, subMenu, exact }) =>
            subMenu ? (
              <li key={label}>
                <div className="flex items-center justify-between">
                  <NavLink
                    to={path}
                    end={exact}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 w-full rounded-md transition-colors duration-200 ${
                        isActive
                          ? "bg-orange-100 text-orange-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
                      }`
                    }
                  >
                    {icon}
                    <span>{label}</span>
                  </NavLink>

                  {/* Arrow toggle */}
                  <button
                    onClick={() => setRegistrantOpen(!registrantOpen)}
                    className="px-2 text-gray-600 hover:text-orange-500"
                  >
                    {registrantOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {/* Submenu */}
                {registrantOpen && (
                  <ul className="pl-10">
                    {subMenu.map(({ label, icon, path }) => (
                      <NavLink
                        key={path}
                        to={path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 ${
                            isActive
                              ? "text-orange-600 font-semibold bg-orange-50"
                              : "text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                          }`
                        }
                      >
                        {icon}
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <NavLink
                key={path}
                to={path}
                end={exact}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                    isActive
                      ? "bg-orange-100 text-orange-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
                  }`
                }
              >
                {icon}
                <span>{label}</span>
              </NavLink>
            )
          )}
        </ul>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
