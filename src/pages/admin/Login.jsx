import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAO9TdAUkHNh7jk9U6NRKlCtMmM0pla-_0",
  authDomain: "rfidbasedseniormscapstone.firebaseapp.com",
  databaseURL:
    "https://rfidbasedseniormscapstone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidbasedseniormscapstone",
  storageBucket: "rfidbasedseniormscapstone.firebasestorage.app",
  messagingSenderId: "231424248323",
  appId: "1:231424248323:web:a609ea6237275d93eb9c36",
  measurementId: "G-NCE2MRD0WL",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Centralized redirect based on role
  const redirectBasedOnRole = (role) => {
    const normalizedRole = (role || "").toUpperCase().trim();

    if (normalizedRole === "MSWD") navigate("/super-admin", { replace: true });
    else if (normalizedRole === "OSCA") navigate("/admin", { replace: true });
    else if (normalizedRole === "DSWD") navigate("/dswd-admin", { replace: true });
    else setError("⚠️ Unknown role. Contact administrator.");
  };

  // ✅ Restore session per browser session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const role = snapshot.val().role;
            redirectBasedOnRole(role);
          } else {
            setError("⚠️ User record missing in database.");
          }
        } catch (err) {
          console.error("🔥 Session restore error:", err);
          setError("⚠️ Failed to fetch user role.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Handle login per session
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Ensure login is per session
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        const role = snapshot.val().role;
        redirectBasedOnRole(role);
      } else {
        setError("❌ User record not found in database.");
      }
    } catch (err) {
      console.error("🔥 Login error:", err);
      if (err.code === "auth/user-not-found") setError("❌ User not found.");
      else if (err.code === "auth/wrong-password") setError("❌ Wrong password.");
      else if (err.code === "auth/invalid-email") setError("❌ Invalid email.");
      else setError(`❌ Login failed: ${err.code}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef3fc] px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          System Login
        </h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute right-3 top-9 cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline"
          >
            Sign Up
          </button>
        </p>

        {/* <div className="mt-4 text-center">
          <button
            onClick={handleLogout}
            className="text-red-500 underline text-sm"
          >
            Logout
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
