import { useEffect, useState } from "react";
import {
  FaMoneyBillWave,
  FaCheckCircle,
  FaFileAlt,
} from "react-icons/fa";
import { FiUsers, FiCheck, FiClock } from "react-icons/fi";
import { HiOutlineCreditCard } from "react-icons/hi2";
import {
  MdOutlineEventNote,
  MdOutlineVerifiedUser,
  MdOutlineCake,
} from "react-icons/md";

// Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyChxzDRb2g3V2c6IeP8WF3baunT-mnnR68",
  authDomain: "rfidseniorcitizenms.firebaseapp.com",
  databaseURL:
    "https://rfidseniorcitizenms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidseniorcitizenms",
  storageBucket: "rfidseniorcitizenms.firebasestorage.app",
  messagingSenderId: "412368953505",
  appId: "1:412368953505:web:43c8b2f607e50b9fde10e0",
  measurementId: "G-KGRDKXYP4S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    payout: 0,
  });

  // Fetch senior citizen stats
  useEffect(() => {
    const archivedRef = ref(db, "archivedSeniorCitizens");
    const registeredRef = ref(db, "registered_uids");

    const processData = (snapshot, accumulated) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((citizen) => {
          accumulated.total += 1;
          if (citizen.status === "Claimed") accumulated.active += 1;
          if (citizen.status === "Unclaimed") accumulated.pending += 1;
          if (citizen.current_balance)
            accumulated.payout += Number(citizen.current_balance);
        });
      }
      return accumulated;
    };

    const fetchData = () => {
      let statsAccumulator = { total: 0, active: 0, pending: 0, payout: 0 };

      onValue(archivedRef, (snapshot) => {
        let updatedStats = processData(snapshot, { ...statsAccumulator });

        onValue(registeredRef, (snapshot2) => {
          updatedStats = processData(snapshot2, updatedStats);
          setStats(updatedStats);
        });
      });
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Total Senior Citizens</p>
            <h2 className="text-2xl font-bold">{stats.total}</h2>
          </div>
          <FiUsers className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Active Recipients</p>
            <h2 className="text-2xl font-bold">{stats.active}</h2>
          </div>
          <FiCheck className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Pending Applications</p>
            <h2 className="text-2xl font-bold">{stats.pending}</h2>
          </div>
          <FiClock className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Monthly Payout</p>
            <h2 className="text-2xl font-bold">
              ₱{stats.payout.toLocaleString()}
            </h2>
          </div>
          <HiOutlineCreditCard className="text-orange-500 text-3xl" />
        </div>
      </div>

      {/* Activities and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Recent Activities</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-gray-500 mt-1" />
              <div>
                <p>Maria Santos verified</p>
                <small className="text-gray-500">2 hours ago</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineEventNote className="text-gray-500 mt-1" />
              <div>
                <p>Verification reminder sent</p>
                <small className="text-gray-500">6 hours ago</small>
              </div>
            </li>
          </ul>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Upcoming Schedule</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <HiOutlineCreditCard className="text-gray-500 mt-1" />
              <div>
                <p>Pension Payout</p>
                <small className="text-gray-500">March 15, 2025 - 9:00 AM</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineVerifiedUser className="text-gray-500 mt-1" />
              <div>
                <p>Verification Drive</p>
                <small className="text-gray-500">
                  March 18, 2025 - 8:00 AM
                </small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineCake className="text-gray-500 mt-1" />
              <div>
                <p>Birthday Celebration</p>
                <small className="text-gray-500">
                  March 20, 2025 - 2:00 PM
                </small>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-green-50">
            <FaMoneyBillWave className="text-green-500" />
            <span>Process Payout</span>
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-green-50">
            <FaCheckCircle className="text-green-500" />
            <span>Verify Application</span>
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-blue-50">
            <FaFileAlt className="text-blue-500" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
