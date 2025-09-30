import { useEffect, useState } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import {
  FaUsers,
  FaCheckCircle,
  FaMoneyBillWave,
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

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [barangayCounts, setBarangayCounts] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    active: 0,
    payout: 0,
  });
  const [octogenarians, setOctogenarians] = useState([]);
  const [nonagenarians, setNonagenarians] = useState([]);
  const [centenarians, setCentenarians] = useState([]);

  // Fetch data from Realtime Database
  useEffect(() => {
    const masterRef = ref(rtdb, "masterlist");
    const eligibleRef = ref(rtdb, "eligible");

    const unsubMaster = onValue(masterRef, (snap) => {
      const masterData = snap.exists()
        ? Object.keys(snap.val()).map((id) => ({ id, ...snap.val()[id] }))
        : [];

      const unsubEligible = onValue(eligibleRef, (esnap) => {
        const eligibleData = esnap.exists()
          ? Object.keys(esnap.val()).map((id) => ({ id, ...esnap.val()[id] }))
          : [];

        // Counts
        const total = masterData.length;
        const eligibleCount = eligibleData.length;
        const activeCount = eligibleCount; // Active = Eligible
        const monthlyPayout = eligibleCount * 1000;

        setStats({
          total,
          eligible: eligibleCount,
          active: activeCount,
          payout: `₱${monthlyPayout.toLocaleString()}`,
        });

        // Barangay counts (active only)
        const counts = {};
        barangays.forEach((b) => {
          counts[b] = eligibleData.filter(
            (m) => m.barangay?.toLowerCase() === b.toLowerCase()
          ).length;
        });
        setBarangayCounts(counts);

        // Upcoming beneficiaries (age-based from masterlist)
        const upcoming = masterData
          .map((m) => {
            const age = calculateAge(m.birthDate);
            return {
              name: `${m.firstName} ${m.middleName || ""} ${m.surname}`,
              age,
              birthday: m.birthDate,
              barangay: m.barangay,
            };
          })
          .filter((p) => p.age !== null);

        setOctogenarians(upcoming.filter((p) => isUpcoming(p.birthday, 80)));
        setNonagenarians(upcoming.filter((p) => isUpcoming(p.birthday, 90)));
        setCentenarians(upcoming.filter((p) => isUpcoming(p.birthday, 100)));

        setLoading(false);
      });

      // Cleanup eligible listener
      return () => unsubEligible();
    });

    // Cleanup master listener
    return () => unsubMaster();
  }, []);

  // Helper: Table Component
  const BeneficiaryTable = ({ title, color, benefit, data }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className={`text-lg font-bold mb-4 ${color}`}>{title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500">No upcoming beneficiaries.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">Birthday</th>
                <th className="p-3 text-left">Barangay</th>
                <th className="p-3 text-right">Benefit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-200 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3">{p.birthday}</td>
                  <td className="p-3">{p.barangay}</td>
                  <td className={`p-3 text-right font-bold ${color}`}>
                    {benefit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Senior Citizens</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-green-100 text-green-600">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Eligible for Pension</p>
            <p className="text-2xl font-bold text-gray-800">{stats.eligible}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <FaMoneyBillWave />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Payout Amount</p>
            <p className="text-2xl font-bold text-gray-800">{stats.payout}</p>
          </div>
        </div>

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

      {/* Upcoming Beneficiaries */}
      <div className="space-y-6">
        <BeneficiaryTable
          title="Upcoming Octogenarians (₱10,000 Benefit)"
          color="text-orange-600"
          benefit="₱10,000"
          data={octogenarians}
        />
        <BeneficiaryTable
          title="Upcoming Nonagenarians (₱10,000 Benefit)"
          color="text-green-600"
          benefit="₱10,000"
          data={nonagenarians}
        />
        <BeneficiaryTable
          title="Upcoming Centenarians (₱100,000 Benefit)"
          color="text-purple-600"
          benefit="₱100,000"
          data={centenarians}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
