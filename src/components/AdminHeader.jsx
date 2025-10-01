import React, { useEffect, useState } from "react";
import { FaBars, FaUserCircle, FaSignOutAlt, FaTimes } from "react-icons/fa";
import TalisayLogo from "../assets/Talisay-Logo.png";

// Firebase
import { auth } from "../router/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AdminHeader = ({ setSidebarOpen }) => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Current Admin:", user);

      if (user) {
        setAdminInfo({
          name: user.displayName?.trim() || user.email.split("@")[0],
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileModal(false);
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileModal && !event.target.closest('.profile-modal')) {
        setShowProfileModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileModal]);

  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white shadow-sm px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-gray-600 text-xl hover:text-gray-800 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <img src={TalisayLogo} alt="Logo" className="h-10" />
          <h1 className="text-xl font-semibold text-gray-800">OSCA Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {adminInfo ? (
            <div
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer hover:bg-gray-50"
              onClick={() => setShowProfileModal(true)}
            >
              {adminInfo.photo ? (
                <img
                  src={adminInfo.photo}
                  alt="Admin Avatar"
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
              ) : (
                <FaUserCircle className="w-8 h-8 text-gray-400" />
              )}
              <div className="flex flex-col leading-tight">
                <p className="font-semibold text-gray-800 capitalize flex items-center gap-2">
                  {adminInfo.name}
                  <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {adminInfo.role}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{adminInfo.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Not logged in</p>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 transition-opacity">
          <div className="profile-modal bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 transform -translate-y-20 opacity-0 animate-slideDown">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex justify-center mb-4">
                {adminInfo?.photo ? (
                  <img
                    src={adminInfo.photo}
                    alt="Admin Avatar"
                    className="w-20 h-20 rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <FaUserCircle className="w-20 h-20 text-gray-400" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-base font-semibold text-gray-800 capitalize">
                    {adminInfo?.name}
                  </p>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-base text-gray-800">{adminInfo?.email}</p>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">Role</label>
                  <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full w-fit">
                    {adminInfo?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 text-sm"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Animation */}
      <style>
        {`
          @keyframes slideDown {
            0% {
              transform: translateY(-50px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .animate-slideDown {
            animation: slideDown 0.3s ease-out forwards;
          }
        `}
      </style>
    </>
  );
};

export default AdminHeader;
