import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DswdSidebar from "../components/DsdwdComponents/DswdSidebar";
import DswdHeader from  "../components/DsdwdComponents/DswdHeader";

const DswdLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-40 inset-y-0 left-0 transform transition-transform duration-300 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static md:inset-0`}>
            
        <DswdSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 ml-0 md:ml-64 transition-all duration-300">
        <DswdHeader setSidebarOpen={setSidebarOpen} />

        <main className="p-4 mt-16 overflow-y-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DswdLayout;
