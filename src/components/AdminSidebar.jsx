import {
  FaTachometerAlt,
  FaUser,
  FaCalendarAlt,
  FaMoneyCheckAlt,
  FaArchive,
  FaCog,
  FaFileAlt,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaClock, FaUserPlus } from "react-icons/fa";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [registrantOpen, setRegistrantOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/admin", exact: true },
    
    { label: "Add Applicant", icon: <FaUserPlus />, path: "/admin/registrants" },
    { label: "Masterlist", icon: <FaFileAlt />, path: "/admin/admin-masterlist" },
    // { label: "Pension", icon: <FaMoneyCheckAlt />, path: "/admin/pension" },
    { label: "Calendar", icon: <FaCalendarAlt />, path: "/admin/calendar" },
    
    
    // { label: "Archive Records", icon: <FaArchive />, path: "/admin/archive" },
    // { label: "Settings", icon: <FaCog />, path: "/admin/settings" },
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
          className="fixed inset-0 bg-opacity-30 z-40"
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
          {menuItems.map(({ label, icon, path, subMenu, exact }) =>
            subMenu ? (
              <li key={label}>
                <div className="flex items-center justify-between">
                  {/* Parent link (Registrants main page) */}
                  <NavLink
                    to={path}
                    end={exact} // ✅ exact match
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

                  {/* Arrow toggle ONLY */}
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
                end={exact} // ✅ exact match
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

export default AdminSidebar;
