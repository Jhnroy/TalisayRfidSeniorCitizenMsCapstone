import React, { useEffect, useState } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";
import TalisayLogo from "../assets/Talisay-Logo.png";

// Firebase
import { auth } from "../router/Firebase";
import { onAuthStateChanged } from "firebase/auth";

const AdminHeader = ({ setSidebarOpen }) => {
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Current Admin:", user);

      if (user) {
        setAdminInfo({
          name: user.displayName?.trim() || user.email.split("@")[0], // Fallback to email prefix
          email: user.email,
          photo: user.photoURL || null,
          role: "OSCA",
        });
      } else {
        setAdminInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-gray-300 shadow px-4 flex items-center justify-between z-30">
      {/* Left Section: Logo + Title */}
      <div className="flex items-center gap-4">
        {/* Hamburger Button for Mobile */}
        <button
          className="md:hidden text-gray-600 text-xl"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>
        <img src={TalisayLogo} alt="Logo" className="h-10" />
        <h1 className="text-xl font-semibold text-gray-800">OSCA Dashboard</h1>
      </div>

      {/* Right Section: Admin Info */}
      <div className="flex items-center gap-4">
        {adminInfo ? (
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full shadow hover:shadow-md transition">
            {/* Admin Profile Picture */}
            {adminInfo.photo ? (
              <img
                src={adminInfo.photo}
                alt="Admin Avatar"
                className="w-10 h-10 rounded-full border"
              />
            ) : (
              <FaUserCircle className="w-10 h-10 text-gray-500" />
            )}

            {/* Name + Role + Email */}
            <div className="flex flex-col leading-tight">
              {/* Name + Role in one line */}
              <p className="font-semibold text-gray-800 capitalize flex items-center gap-2">
                {adminInfo.name}
                <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {adminInfo.role}
                </span>
              </p>
              {/* Email */}
              <p className="text-sm text-gray-500">{adminInfo.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Not logged in</p>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
