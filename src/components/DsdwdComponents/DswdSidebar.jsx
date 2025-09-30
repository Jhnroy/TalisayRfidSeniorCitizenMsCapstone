import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const DswdSidebar = () => {
  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dswd" },
    { name: "Applications", icon: FileText, path: "/dswd/applications" },
    { name: "Pensioners", icon: Users, path: "/dswd/pensioners" },
    { name: "Schedule", icon: Calendar, path: "/dswd/schedule" },
    { name: "Approved", icon: CheckCircle, path: "/dswd/approved" },
    { name: "Rejected", icon: XCircle, path: "/dswd/rejected" },
    { name: "Budget", icon: DollarSign, path: "/dswd/budget" },
  ];

  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-blue-600">
        <h1 className="text-2xl font-bold">DSWD</h1>
        <p className="text-sm text-blue-200">Pension Monitoring</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2 py-4 space-y-2">
          {menus.map((menu, idx) => (
            <li key={idx}>
              <NavLink
                to={menu.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "hover:bg-blue-600"
                  }`
                }
              >
                <menu.icon className="w-5 h-5" />
                <span>{menu.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-blue-600">
        <button className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-red-600 transition-all">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default DswdSidebar;
