import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Header = () => {
  const auth = getAuth();
  const db = getDatabase();
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    name: "",
    role: "",
    email: "",
  });

  // ✅ Handle user logout with redirect
  // const handleLogout = useCallback(async () => {
  //   try {
  //     await signOut(auth);
  //     navigate("/login"); // ✅ Redirect to login page
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //   }
  // }, [auth, navigate]);

  // ✅ Fetch user info on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserInfo({
              name: data.name || "DSWD-Admin",
              role: data.role?.toUpperCase() || "N/A",
              email: user.email,
            });
          } else {
            setUserInfo({
              name: "No Record",
              role: "N/A",
              email: user.email,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserInfo({ name: "", role: "", email: "" });
        navigate("/login"); // ✅ Redirect if user is not logged in
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate]); // ✅ Dependencies included

  // ✅ Dynamic dashboard title based on role
  const dashboardTitle =
    userInfo.role === "DSWD"
      ? "DSWD Dashboard"
      : userInfo.role === "OSCA"
      ? "OSCA Dashboard"
      : userInfo.role === "MSWD"
      ? "MSWD Dashboard"
      : "Dashboard";

  return (
    <header className="w-full bg-blue-600 text-white shadow-md p-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">{dashboardTitle}</h1>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="font-semibold">{userInfo.name}</p>
          <p className="text-sm">{userInfo.role}</p>
          <p className="text-xs text-gray-200">{userInfo.email}</p>
        </div>

        {/* ✅ Logout Button */}
        {/* <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button> */}
      </div>
    </header>
  );
};

export default Header;
