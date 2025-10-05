import { useEffect, useState } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import {
  FaUsers,
  FaCheckCircle,
  FaUser,
} from "react-icons/fa";

// Barangay list
const barangays = [
  "Binanuun",
  "Caawigan",
  "Cahabaan",
  "Calintaan",
  "Del Carmen",
  "Gabon",
  "Itomang",
  "Poblacion",
  "San Francisco",
  "San Isidro",
  "San Jose",
  "San Nicolas",
  "Sta. Cruz",
  "Sta. Elena",
  "Sto. Niño",
];

// Helper: calculate age
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// Helper: check if senior will turn targetAge on next birthday
const isUpcoming = (birthDate, targetAge) => {
  if (!birthDate) return false;
  const today = new Date();
  const dob = new Date(birthDate);
  let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const turningAge = nextBirthday.getFullYear() - dob.getFullYear();
  return turningAge === targetAge;
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [barangayCounts, setBarangayCounts] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    active: 0,
  });
  const [octogenarians, setOctogenarians] = useState([]);
  const [nonagenarians, setNonagenarians] = useState([]);
  const [centenarians, setCentenarians] = useState([]);

  // Fetch data from Realtime Database
  useEffect(() => {
    const seniorRef = ref(rtdb, "senior_citizens");
    const eligibleRef = ref(rtdb, "rfidBindings");

    const unsubSenior = onValue(seniorRef, (snap) => {
      const seniorData = snap.exists()
        ? Object.keys(snap.val()).map((id) => ({ id, ...snap.val()[id] }))
        : [];

      const total = seniorData.length;
      const activeData = seniorData.filter((m) => m.status === "Eligible");

      const unsubEligible = onValue(eligibleRef, (esnap) => {
        const eligibleData = esnap.exists()
          ? Object.keys(esnap.val()).map((id) => ({ id, ...esnap.val()[id] }))
          : [];

        // Stats
        setStats({
          total,
          eligible: eligibleData.length,
          active: activeData.length,
        });

        // Barangay counts (active only)
        const counts = {};
        barangays.forEach((b) => {
          counts[b] = activeData.filter(
            (m) => m.barangay?.toLowerCase() === b.toLowerCase()
          ).length;
        });
        setBarangayCounts(counts);

        // Upcoming beneficiaries (from senior_citizens)
        const upcoming = seniorData
          .map((m) => {
            const age = calculateAge(m.dateOfBirth);
            return {
              name: `${m.firstName} ${m.middleName || ""} ${m.lastName}`,
              age,
              birthday: m.dateOfBirth,
              barangay: m.barangay,
            };
          })
          .filter((p) => p.age !== null);

        setOctogenarians(upcoming.filter((p) => isUpcoming(p.birthday, 80)));
        setNonagenarians(upcoming.filter((p) => isUpcoming(p.birthday, 90)));
        setCentenarians(upcoming.filter((p) => isUpcoming(p.birthday, 100)));

        setLoading(false);
      });

      return () => unsubEligible();
    });

    return () => unsubSenior();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  return (
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Senior Citizens</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>

        {/* Eligible */}
        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-green-100 text-green-600">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Eligible for Pension</p>
            <p className="text-2xl font-bold text-gray-800">{stats.eligible}</p>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
            <FaUser />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Beneficiaries</p>
            <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Active Beneficiaries per Barangay */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Active Beneficiaries Per Barangay
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {barangays.map((b, i) => (
            <div
              key={i}
              className="bg-white shadow-sm rounded-lg p-4 text-center hover:shadow-md transition"
            >
              <h3 className="font-medium text-gray-700">{b}</h3>
              <p className="text-orange-500 text-2xl font-bold">
                {barangayCounts[b] || 0}
              </p>
              <p className="text-xs text-gray-500">Active Beneficiaries</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
