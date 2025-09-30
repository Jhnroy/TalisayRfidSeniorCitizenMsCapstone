import React, { useEffect, useState } from "react";
import { FaUserCircle, FaBars } from "react-icons/fa";
import logo from "../assets/Talisay-Logo.png";
import { auth, db } from "../router/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";

const DswdHeader = ({ setSidebarOpen }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(ref(db, "users"), orderByChild("email"), equalTo(user.email));
          const snap = await get(q);

          if (snap.exists()) {
            let data = null;
            snap.forEach((childSnap) => {
              data = childSnap.val();
            });

            // ✅ Only allow DSWD role
            if (data.role && data.role.toUpperCase() === "DSWD") {
              setUserInfo({
                name: data.name || user.displayName || user.email.split("@")[0],
                email: data.email || user.email,
                photo: user.photoURL || null,
                role: "DSWD",
              });
            } else {
              console.warn("⚠️ User is not DSWD. Blocking access.");
              setUserInfo({
                name: user.displayName || user.email.split("@")[0],
                email: user.email,
                photo: user.photoURL || null,
                role: "DSWD",
              });
            }
          } else {
            console.warn("⚠️ No record found in DB for this email.");
            setUserInfo({
              name: user.displayName || user.email.split("@")[0],
              email: user.email,
              photo: user.photoURL || null,
              role: "DSWD",
            });
          }
        } catch (err) {
          console.error("🔥 Error fetching user role:", err);
          setUserInfo({
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            photo: user.photoURL || null,
            role: "DSWD",
          });
        }
      } else {
        setUserInfo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowModal(false);
      window.location.href = "/login"; // redirect to login
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-gray-200 shadow px-6 flex items-center justify-between z-30">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-gray-600 text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <img src={logo} alt="Logo" className="h-12 w-12" />
          <h1 className="text-xl font-bold text-gray-800">Bayan ng Talisay</h1>
        </div>

        {/* Right Section: User Info */}
        <div className="flex items-center gap-4">
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : userInfo ? (
            <div
              className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full shadow hover:shadow-md transition cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              {userInfo.photo ? (
                <img
                  src={userInfo.photo}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border"
                />
              ) : (
                <FaUserCircle className="w-10 h-10 text-gray-500" />
              )}

              <div className="flex flex-col leading-tight">
                <p className="font-semibold text-gray-800 capitalize flex items-center gap-2">
                  {userInfo.name}
                  <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {userInfo.role}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{userInfo.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Not logged in</p>
          )}
        </div>
      </header>

      {/* Logout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
            <p className="text-gray-600 mb-6">{userInfo?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="mt-3 w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DswdHeader;
