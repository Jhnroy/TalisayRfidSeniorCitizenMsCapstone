import React, { useEffect, useState } from "react";
import { FaUserCircle, FaBars, FaBell } from "react-icons/fa";
import logo from "../assets/Talisay-Logo.png";
import { auth, rtdb } from "../router/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  onValue,
  update,
} from "firebase/database";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate

const MswdHeader = ({ setSidebarOpen }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate(); // ✅ Initialize navigation

  // ✅ Fetch logged-in user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const usersRef = ref(rtdb, "users");
          const q = query(usersRef, orderByChild("email"), equalTo(user.email));
          const snap = await get(q);

          if (snap.exists()) {
            let data = null;
            snap.forEach((childSnap) => {
              data = childSnap.val();
            });

            setUserInfo({
              name: data?.name || user.displayName || user.email.split("@")[0],
              email: data?.email || user.email,
              photo: user.photoURL || null,
              role: "MSWD",
            });
          } else {
            setUserInfo({
              name: user.displayName || user.email.split("@")[0],
              email: user.email,
              photo: user.photoURL || null,
              role: "MSWD",
            });
          }
        } catch (err) {
          console.error("🔥 Error fetching user info:", err);
          setUserInfo({
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            photo: user.photoURL || null,
            role: "MSWD",
          });
        }
      } else {
        setUserInfo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch notifications (flatten all barangays)
  useEffect(() => {
    const notifRef = ref(rtdb, "notifications");
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const notifList = Object.entries(data).flatMap(([barangay, notifs]) =>
          Object.entries(notifs).map(([id, value]) => ({
            id,
            barangay,
            ...value,
          }))
        );

        notifList.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setNotifications(notifList);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Logout with redirect
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowModal(false);
      navigate("/", { replace: true }); // ✅ Proper router redirect
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to log out. Please try again.");
    }
  };

  // ✅ Mark all as read
  const markAsRead = () => {
    notifications.forEach((notif) => {
      if (!notif.read) {
        update(ref(rtdb, `notifications/${notif.barangay}/${notif.id}`), {
          read: true,
        });
      }
    });
  };

  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-gray-200 shadow px-4 md:px-6 flex items-center justify-between z-30">
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            className="md:hidden text-gray-600 text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <img src={logo} alt="Logo" className="h-10 w-10 md:h-12 md:w-12" />
          <h1 className="hidden sm:block text-base md:text-xl font-bold text-gray-800 truncate">
            Bayan ng Talisay
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotif(!showNotif);
                if (!showNotif) markAsRead();
              }}
              className="text-gray-700 hover:text-gray-900 relative"
            >
              <FaBell className="w-5 h-5 md:w-6 md:h-6" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs rounded-full px-1">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white shadow-lg rounded-lg border z-50">
                <div className="p-3 border-b font-semibold text-gray-700 text-sm md:text-base">
                  Notifications
                </div>
                <ul className="max-h-60 overflow-y-auto text-sm md:text-base">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className={`p-3 hover:bg-gray-100 cursor-pointer ${
                          notif.read ? "text-gray-500" : "text-black"
                        }`}
                      >
                        <div className="font-medium truncate">
                          {notif.message}
                        </div>
                        <div className="text-xs text-gray-400">
                          {notif.barangay} •{" "}
                          {notif.timestamp
                            ? new Date(notif.timestamp).toLocaleString()
                            : "No date"}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="p-3 text-gray-500 text-center">
                      No notifications
                    </li>
                  )}
                </ul>
                <div className="p-2 border-t text-center text-sm text-blue-600 hover:bg-gray-50 cursor-pointer">
                  View all
                </div>
              </div>
            )}
          </div>

          {/* 👤 User Info */}
          {loading ? (
            <p className="text-gray-600 text-sm md:text-base">Loading...</p>
          ) : userInfo ? (
            <div
              className="flex items-center gap-2 md:gap-3 bg-gray-100 px-2 md:px-4 py-1.5 md:py-2 rounded-full shadow hover:shadow-md transition cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              {userInfo.photo ? (
                <img
                  src={userInfo.photo}
                  alt="User Avatar"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border"
                />
              ) : (
                <FaUserCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
              )}

              <div className="hidden sm:flex flex-col leading-tight max-w-[100px] md:max-w-[160px]">
                <p className="font-semibold text-gray-800 capitalize text-xs md:text-sm truncate flex items-center gap-1 md:gap-2">
                  {userInfo.name}
                  <span className="bg-green-100 text-green-600 text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {userInfo.role}
                  </span>
                </p>
                <p className="text-[10px] md:text-sm text-gray-500 truncate">
                  {userInfo.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm md:text-base">Not logged in</p>
          )}
        </div>
      </header>

      {/* Logout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
            <p className="text-gray-600 mb-6 truncate">{userInfo?.email}</p>
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

export default MswdHeader;
