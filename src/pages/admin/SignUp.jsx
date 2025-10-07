import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyChxzDRb2g3V2c6IeP8WF3baunT-mnnR68",
  authDomain: "rfidseniorcitizenms.firebaseapp.com",
  databaseURL: "https://rfidseniorcitizenms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidseniorcitizenms",
  storageBucket: "rfidseniorcitizenms.firebasestorage.app",
  messagingSenderId: "412368953505",
  appId: "1:412368953505:web:43c8b2f607e50b9fde10e0",
  measurementId: "G-KGRDKXYP4S",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Check kung may users na sa DB
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "users"));

      let role = "OSCA"; // default role

      // ✅ Fixed Rules
      if (email.toLowerCase() === "mswd@gmail.com") {
        role = "MSWD";
      } else if (email.toLowerCase() === "dswd@gmail.com") {
        role = "DSWD";
      } else if (!snapshot.exists()) {
        // ✅ Fallback: kung wala pang user sa DB, first signup = MSWD
        role = "MSWD";
      }

      // Step 2: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 3: Save user details in Realtime DB
      await set(ref(database, "users/" + user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      setSuccess(`Account created successfully as ${role}!`);
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Step 4: Redirect to login
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef3fc] px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md sm:max-w-lg md:max-w-xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
          Create Account
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign up to access the Senior Citizens Management System.
        </p>

        {/* Error & Success */}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {success && <p className="text-green-600 text-center mb-4">{success}</p>}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Back to Login */}
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
