import { useEffect, useState } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, update } from "firebase/database";
import { FaUsers, FaCheckCircle, FaUser, FaTimesCircle } from "react-icons/fa";

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

// Parse date safely
const parseDate = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
};

// Compute age
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

// Check if upcoming
const isUpcoming = (birthDate, targetAge) => {
  const dob = parseDate(birthDate);
  if (!dob) return false;
  const today = new Date();
  let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  const turningAge = nextBirthday.getFullYear() - dob.getFullYear();
  return turningAge === targetAge;
};

// ✅ Modal with blurred background
const ClaimStatusModal = ({ person, onClose, onMarkClaimed, onMarkNotClaimed }) => {
  if (!person) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Benefit Claim Status
        </h2>

        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {person.name}</p>
          <p><strong>Age:</strong> {person.age}</p>
          <p><strong>Barangay:</strong> {person.barangay}</p>
          <p><strong>Birthday:</strong> {person.birthday}</p>
          <p>
            <strong>Status:</strong>{" "}
            {person.claimed ? (
              <span className="text-green-600 font-semibold">
                Claimed on {person.claimedDate || "—"}
              </span>
            ) : (
              <span className="text-red-600 font-semibold">Not Claimed</span>
            )}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {!person.claimed ? (
            <button
              onClick={() => onMarkClaimed(person)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Mark as Claimed
            </button>
          ) : (
            <button
              onClick={() => onMarkNotClaimed(person)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Mark as Not Claimed
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [barangayCounts, setBarangayCounts] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    active: 0,
    notClaimed: 0,
  });

  const [currentOcto, setCurrentOcto] = useState([]);
  const [currentNona, setCurrentNona] = useState([]);
  const [currentCente, setCurrentCente] = useState([]);

  const [upcomingOcto, setUpcomingOcto] = useState([]);
  const [upcomingNona, setUpcomingNona] = useState([]);
  const [upcomingCente, setUpcomingCente] = useState([]);

  const [selectedPerson, setSelectedPerson] = useState(null);

  // Fetch data
  useEffect(() => {
    const seniorRef = ref(rtdb, "senior_citizens");
    const eligibleRef = ref(rtdb, "rfidBindings");

    const unsubSenior = onValue(seniorRef, (snap) => {
      const seniorData = snap.exists()
        ? Object.keys(snap.val()).map((id) => ({ id, ...snap.val()[id] }))
        : [];
      const total = seniorData.length;
      const activeData = seniorData.filter((m) => m.status === "Eligible");

      const processed = seniorData
        .map((m) => {
          const age = calculateAge(m.dateOfBirth);
          return {
            id: m.id,
            name: `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`.trim(),
            age,
            birthday: m.dateOfBirth,
            barangay: m.barangay,
            claimed: m.claimed || false,
            claimedDate: m.claimedDate || null,
          };
        })
        .filter((p) => p.age !== null);

      setCurrentOcto(processed.filter((p) => p.age >= 80 && p.age < 90));
      setCurrentNona(processed.filter((p) => p.age >= 90 && p.age < 100));
      setCurrentCente(processed.filter((p) => p.age >= 100));

      setUpcomingOcto(processed.filter((p) => isUpcoming(p.birthday, 80)));
      setUpcomingNona(processed.filter((p) => isUpcoming(p.birthday, 90)));
      setUpcomingCente(processed.filter((p) => isUpcoming(p.birthday, 100)));

      const notClaimedCount = processed.filter((p) => !p.claimed).length;

      const unsubEligible = onValue(eligibleRef, (esnap) => {
        const eligibleData = esnap.exists()
          ? Object.keys(esnap.val()).map((id) => ({ id, ...esnap.val()[id] }))
          : [];

        setStats({
          total,
          eligible: eligibleData.length,
          active: activeData.length,
          notClaimed: notClaimedCount,
        });

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

  // ✅ Mark as claimed
  const handleMarkClaimed = async (person) => {
    try {
      const now = new Date();
      const formattedDate = now.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const personRef = ref(rtdb, `senior_citizens/${person.id}`);
      await update(personRef, { claimed: true, claimedDate: formattedDate });

      alert(`${person.name} has been marked as Claimed on ${formattedDate}.`);
      setSelectedPerson(null);
    } catch (err) {
      console.error("Error updating claimed status:", err);
      alert("Failed to update claim status.");
    }
  };

  // ✅ Mark as not claimed
  const handleMarkNotClaimed = async (person) => {
    try {
      const personRef = ref(rtdb, `senior_citizens/${person.id}`);
      await update(personRef, { claimed: false, claimedDate: null });

      alert(`${person.name} has been marked as Not Claimed.`);
      setSelectedPerson(null);
    } catch (err) {
      console.error("Error updating not claimed status:", err);
      alert("Failed to update claim status.");
    }
  };

  // Table component
  const BeneficiaryTable = ({ title, color, benefit, data, showClaimStatus }) => (
    <div className="bg-white shadow rounded-lg p-6 backdrop-blur-sm bg-opacity-95">
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
                {showClaimStatus && <th className="p-3 text-left">Claim Status</th>}
                <th className="p-3 text-right">Benefit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedPerson(p)}
                  className={`border-t border-gray-200 cursor-pointer ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3">{p.birthday}</td>
                  <td className="p-3">{p.barangay}</td>
                  {showClaimStatus && (
                    <td className="p-3">
                      {p.claimed ? (
                        <span className="text-green-600 font-semibold">
                          Claimed on {p.claimedDate || "—"}
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Not Claimed</span>
                      )}
                    </td>
                  )}
                  <td className={`p-3 text-right font-bold ${color}`}>{benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">
        Click a row to view claim status
      </p>
    </div>
  );

  if (loading)
    return <div className="p-6 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-10 bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 min-h-screen">
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
            <p className="text-sm text-gray-500">Eligible for Pension</p>
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

        <div className="bg-white shadow rounded-xl flex items-center gap-4 p-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-red-100 text-red-600">
            <FaTimesCircle />
          </div>
          <div>
            <p className="text-sm text-gray-500">Not Claimed</p>
            <p className="text-2xl font-bold text-gray-800">{stats.notClaimed}</p>
          </div>
        </div>
      </div>

      {/* Current & Upcoming Tables */}
      <div className="space-y-10">
        <h2 className="text-xl font-semibold text-gray-700">Current Elderly Subgroups</h2>
        <BeneficiaryTable
          title="Current Octogenarians (₱10,000 Benefit)"
          color="text-orange-600"
          benefit="₱10,000"
          data={currentOcto}
          showClaimStatus
        />
        <BeneficiaryTable
          title="Current Nonagenarians (₱10,000 Benefit)"
          color="text-green-600"
          benefit="₱10,000"
          data={currentNona}
          showClaimStatus
        />
        <BeneficiaryTable
          title="Current Centenarians (₱100,000 Benefit)"
          color="text-purple-600"
          benefit="₱100,000"
          data={currentCente}
          showClaimStatus
        />

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

      {/* Modal */}
      {selectedPerson && (
        <ClaimStatusModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onMarkClaimed={handleMarkClaimed}
          onMarkNotClaimed={handleMarkNotClaimed}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
