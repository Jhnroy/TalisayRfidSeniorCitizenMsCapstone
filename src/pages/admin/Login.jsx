import React, { useState } from "react";

import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeSharp, IoEyeOffSharp } from "react-icons/io5";
import { signInWithEmailAndPassword } from "firebase/auth";

import AdminLoginLogo from "../../assets/AdminLoginLogo.png";

import { auth } from "../../Firebase.js";

import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard"); // change to your dashboard route
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3fc] flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="">
            <img
              src={AdminLoginLogo} 
              alt="icon"
              className="w-15 h-15"
            />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">
          Senior Citizen Management
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Administrative Access Only – Log in with your assigned credentials to manage senior citizen services and records.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="text-left">
          <label className="text-sm text-gray-600 font-medium">Username or Email</label>
          <div className="relative mb-4 mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <FaUser />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username or email"
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <a href="#" className="text-sm text-blue-500 hover:underline">
              Forgot Password?
            </a>
          </div>
          <div className="relative mt-1 mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <FaLock />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
            >
              {showPassword ? <IoEyeOffSharp /> : <IoEyeSharp />}
            </button>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;