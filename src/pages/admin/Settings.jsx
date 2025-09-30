import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../router/Firebase";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [theme, setTheme] = useState("light");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12-hour");
  const [landingPage, setLandingPage] = useState("Dashboard");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      console.log("Successfully logged out");
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error.message);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Interface Preferences */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Interface Preferences</h2>
        <div className="mb-6">
          <label className="block font-medium mb-2">Theme</label>
          <div className="flex items-center gap-4">
            <span>Light</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "light" ? "dark" : "light")}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600" />
            </label>
            <span>Dark</span>
          </div>
        </div>

        {/* Date & Time Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Time Format</label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="12-hour">12-hour (1:30 PM)</option>
              <option value="24-hour">24-hour (13:30)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Default Landing Page */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Default Landing Page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Dashboard", "Attendance Logs", "Senior Profiles", "Pension Module"].map(
            (page) => (
              <label key={page} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="landingPage"
                  value={page}
                  checked={landingPage === page}
                  onChange={() => setLandingPage(page)}
                />
                {page}
              </label>
            )
          )}
        </div>
      </section>

      {/* Session Settings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Session Settings</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <label className="block font-medium mb-1">Inactivity Timeout</label>
            <input
              type="text"
              readOnly
              value="10 minutes"
              className="p-2 border rounded bg-gray-100"
            />
            <span className="ml-2 text-sm text-gray-500">(Set by Admin)</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            Log Out
          </button>
        </div>
      </section>
    </main>
  );
};

export default Settings;
