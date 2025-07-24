import React from "react";
import { FaBars } from "react-icons/fa";
import TalisayLogo from "../assets/Talisay-Logo.png";

const AdminHeader = ({ setSidebarOpen }) => {
  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-gray-300 shadow px-4 flex items-center justify-between z-30">
        
      <div className="flex items-center gap-4">
        {/* Hamburger for small screens */}
        <button
          className="md:hidden text-gray-600 text-xl"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>
        <img src={TalisayLogo} alt="Logo" className="h-10" />
        <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
      </div>
    </header>
  );
};

export default AdminHeader;
