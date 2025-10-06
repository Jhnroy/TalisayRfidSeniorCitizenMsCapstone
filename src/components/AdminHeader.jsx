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
          name: user.displayName?.trim() || "rascojohnroy",
          email: user.email || "rascojohnroy@gmail.com",
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
      if (showProfileModal && !event.target.closest(".profile-modal")) {
        setShowProfileModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white shadow-sm px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-gray-600 text-xl hover:text-gray-800 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <img src={TalisayLogo} alt="Logo" className="h-10" />
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
            OSCA Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {adminInfo ? (
            <div
              className="flex items-center gap-3 bg-white px-3 py-2 md:px-4 rounded-full shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer hover:bg-gray-50 max-w-[200px] sm:max-w-xs md:max-w-sm truncate"
              onClick={() => setShowProfileModal(true)}
            >
              {adminInfo.photo ? (
                <img
                  src={adminInfo.photo}
                  alt="Admin Avatar"
                  className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0"
                />
              ) : (
                <FaUserCircle className="w-8 h-8 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex flex-col leading-tight truncate">
                <p className="font-semibold text-gray-800 capitalize flex items-center gap-2 truncate">
                  {adminInfo.name}
                  <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    {adminInfo.role}
                  </span>
                </p>
                <p className="text-sm text-gray-500 truncate">{adminInfo.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Not logged in</p>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 transition-opacity p-2">
          <div className="profile-modal bg-white rounded-xl shadow-lg w-full sm:max-w-xs md:max-w-sm mx-auto max-h-[90vh] overflow-y-auto transform -translate-y-10 opacity-0 animate-slideDown">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">
                Profile Information
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-sm md:text-base" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6">
              <div className="flex justify-center mb-4">
                {adminInfo?.photo ? (
                  <img
                    src={adminInfo.photo}
                    alt="Admin Avatar"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <FaUserCircle className="w-16 h-16 md:w-20 md:h-20 text-gray-400" />
                )}
              </div>

              <div className="space-y-3 text-sm md:text-base">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">
                    Name
                  </label>
                  <p className="font-semibold text-gray-800 capitalize truncate">
                    {adminInfo?.name}
                  </p>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-800 truncate">{adminInfo?.email}</p>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 mb-1">
                    Role
                  </label>
                  <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full w-fit">
                    {adminInfo?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-3 py-2 md:px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-xs md:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 md:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 text-xs md:text-sm"
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
