import { useEffect, useState } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import { FaUsers, FaCheckCircle, FaUser } from "react-icons/fa";

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

// Safe date parser
const parseDate = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
};

// Helper: calculate current age
const calculateAge = (birthDate) => {
  const dob = parseDate(birthDate);
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// Helper: check if senior will turn targetAge on next birthday
const isUpcoming = (birthDate, targetAge) => {
  const dob = parseDate(birthDate);
  if (!dob) return false;

  const today = new Date();
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
  });

  // current categories
  const [currentOcto, setCurrentOcto] = useState([]);
  const [currentNona, setCurrentNona] = useState([]);
  const [currentCente, setCurrentCente] = useState([]);

  // upcoming categories
  const [upcomingOcto, setUpcomingOcto] = useState([]);
  const [upcomingNona, setUpcomingNona] = useState([]);
  const [upcomingCente, setUpcomingCente] = useState([]);

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

      // enrich data
      const processed = seniorData
        .map((m) => {
          const age = calculateAge(m.dateOfBirth);
          return {
            name: `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`.trim(),
            age,
            birthday: m.dateOfBirth,
            barangay: m.barangay,
          };
        })
        .filter((p) => p.age !== null);

      // Current seniors
      setCurrentOcto(processed.filter((p) => p.age >= 80 && p.age < 90));
      setCurrentNona(processed.filter((p) => p.age >= 90 && p.age < 100));
      setCurrentCente(processed.filter((p) => p.age >= 100));

      // Upcoming seniors
      setUpcomingOcto(processed.filter((p) => isUpcoming(p.birthday, 80)));
      setUpcomingNona(processed.filter((p) => isUpcoming(p.birthday, 90)));
      setUpcomingCente(processed.filter((p) => isUpcoming(p.birthday, 100)));

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

        setLoading(false);
      });

      return () => unsubEligible();
    });

    return () => unsubSenior();
  }, []);

  // Helper: Table Component
  const BeneficiaryTable = ({ title, color, benefit, data }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className={`text-lg font-bold mb-4 ${color}`}>{title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500">No beneficiaries.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Current Beneficiaries */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">Current Beneficiaries</h2>
        <BeneficiaryTable
          title="Current Octogenarians (₱10,000 Benefit)"
          color="text-orange-600"
          benefit="₱10,000"
          data={currentOcto}
        />
        <BeneficiaryTable
          title="Current Nonagenarians (₱10,000 Benefit)"
          color="text-green-600"
          benefit="₱10,000"
          data={currentNona}
        />
        <BeneficiaryTable
          title="Current Centenarians (₱100,000 Benefit)"
          color="text-purple-600"
          benefit="₱100,000"
          data={currentCente}
        />
      </div>

      {/* Upcoming Beneficiaries */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">Upcoming Beneficiaries</h2>
        <BeneficiaryTable
          title="Upcoming Octogenarians (₱10,000 Benefit)"
          color="text-orange-600"
          benefit="₱10,000"
          data={upcomingOcto}
        />
        <BeneficiaryTable
          title="Upcoming Nonagenarians (₱10,000 Benefit)"
          color="text-green-600"
          benefit="₱10,000"
          data={upcomingNona}
        />
        <BeneficiaryTable
          title="Upcoming Centenarians (₱100,000 Benefit)"
          color="text-purple-600"
          benefit="₱100,000"
          data={upcomingCente}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
