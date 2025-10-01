import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { LogOut } from "lucide-react";

const Header = () => {
  const auth = getAuth();
  const db = getDatabase();

  const [userInfo, setUserInfo] = useState({
    name: "",
    role: "",
    email: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserInfo({
              name: data.name || "DSWD-Admin",
              role: data.role?.toUpperCase() || "N/A", // ✅ exact role from DB
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
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserInfo({ name: "", role: "", email: "" });
      }
    });

    return () => unsubscribe();
  }, []);

  

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
      </div>
    </header>
  );
};

export default Header;
