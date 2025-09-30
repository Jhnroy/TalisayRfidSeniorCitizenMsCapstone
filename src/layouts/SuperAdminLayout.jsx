import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SuperAdminHeader from "../components/SuperAdminHeader";

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      
      <SuperAdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0 md:ml-64"}`}>

        <SuperAdminHeader  setSidebarOpen={setSidebarOpen}/>

        <main className="p-4 mt-16 overflow-y-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
