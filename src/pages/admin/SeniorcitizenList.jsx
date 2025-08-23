import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaArchive } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set,
  off,
} from "firebase/database";

// ===== Firebase configuration =====
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

// ===== Initialize Firebase (guard against re-init in hot reloads) =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const SeniorcitizenList = () => {
  const [seniorCitizens, setSeniorCitizens] = useState([]);
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [ageRangeFilter, setAgeRangeFilter] = useState("All Ages");
  const [pensionStatusFilter, setPensionStatusFilter] = useState("All Status");

  // Popup edit & archive state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isArchivePopupOpen, setIsArchivePopupOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Loading state (optional UX)
  const [loading, setLoading] = useState(true);

  // ===== READ from registered_uids =====
  useEffect(() => {
    const seniorRef = ref(db, "registered_uids");
    onValue(seniorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          firebaseId: key,
          ...data[key],
        }));
        setSeniorCitizens(list);
      } else {
        setSeniorCitizens([]);
      }
      setLoading(false);
    });

    // cleanup listener on unmount
    return () => off(seniorRef);
  }, []);

  // ===== UPDATE =====
  const updateUser = (firebaseId, updatedData) => {
    return update(ref(db, `registered_uids/${firebaseId}`), updatedData);
  };

  // ===== ARCHIVE =====
  const confirmArchiveUser = (user) => {
    setEditData(user);
    setIsArchivePopupOpen(true);
  };

  const archiveUser = (firebaseId, userData) => {
    return set(ref(db, `archivedSeniorCitizens/${firebaseId}`), userData).then(
      () => remove(ref(db, `registered_uids/${firebaseId}`))
    );
  };

  // ===== FILTERING =====
  const filteredSeniorCitizens = seniorCitizens.filter((sc) => {
    const srch = search.trim().toLowerCase();

    const matchesSearch =
      !srch ||
      sc.name?.toLowerCase().includes(srch) ||
      sc.firebaseId?.toLowerCase().includes(srch) ||
      sc.barangay?.toLowerCase().includes(srch) ||
      String(sc.current_balance ?? "").toLowerCase().includes(srch) ||
      sc.status?.toLowerCase().includes(srch) ||
      String(sc.age ?? "").toLowerCase().includes(srch);

    const matchesBarangay =
      barangayFilter === "All Barangays" || sc.barangay === barangayFilter;

    const matchesPensionStatus =
      pensionStatusFilter === "All Status" || sc.status === pensionStatusFilter;

    const matchesAgeRange =
      ageRangeFilter === "All Ages" ||
      (ageRangeFilter === "60-69" && sc.age >= 60 && sc.age <= 69) ||
      (ageRangeFilter === "70-79" && sc.age >= 70 && sc.age <= 79) ||
      (ageRangeFilter === "80-89" && sc.age >= 80 && sc.age <= 89) ||
      (ageRangeFilter === "90-100+" && sc.age >= 90);

    return (
      matchesSearch && matchesBarangay && matchesPensionStatus && matchesAgeRange
    );
  });

  // ===== STATUS STYLE MAPPING =====
  const statusStyles = {
    Active: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Suspended: "bg-red-100 text-red-700",
    Claimed: "bg-blue-100 text-blue-700",
    Unclaimed: "bg-gray-100 text-gray-700",
  };

  // ===== Helpers =====
  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatPHP = (val) => {
    const n = Number(val ?? 0);
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      // Fallback if Intl not available
      return `₱${n.toFixed(2)}`;
    }
  };

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Senior Citizens</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by UID, Name, Age, Barangay, Balance, or Status..."
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded w-full"
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
        >
          <option>All Barangays</option>
          <option>Binanuun</option>
          <option>Caawigan</option>
          <option>Cahabaan</option>
          <option>Calintaan</option>
          <option>Del Carmen</option>
          <option>Gabon</option>
          <option>Itomang</option>
          <option>Poblacion</option>
          <option>San Francisco</option>
          <option>San Isidro</option>
          <option>San Jose</option>
          <option>San Nicolas</option>
          <option>Sta. Cruz</option>
          <option>Sta. Elena</option>
          <option>Sto. Niño</option>
        </select>
        <select
          className="border p-2 rounded w-full"
          value={ageRangeFilter}
          onChange={(e) => setAgeRangeFilter(e.target.value)}
        >
          <option>All Ages</option>
          <option>60-69</option>
          <option>70-79</option>
          <option>80-89</option>
          <option>90-100+</option>
        </select>
        <select
          className="border p-2 rounded w-full"
          value={pensionStatusFilter}
          onChange={(e) => setPensionStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Suspended</option>
          <option>Claimed</option>
          <option>Unclaimed</option>
        </select>
      </div>

      {/* ===== Mobile Card View (shown on < md) ===== */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-6">Loading…</div>
        ) : filteredSeniorCitizens.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No senior citizens found.
          </div>
        ) : (
          filteredSeniorCitizens.map((sc) => (
            <div
              key={sc.firebaseId}
              className="bg-white rounded shadow border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500">UID</div>
                  <div className="font-semibold break-all">{sc.firebaseId}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium h-fit ${
                    statusStyles[sc.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {sc.status || "—"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Name</div>
                  <div className="font-medium">{sc.name || "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Age</div>
                  <div className="font-medium">{sc.age ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Barangay</div>
                  <div className="font-medium">{sc.barangay || "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Balance</div>
                  <div className="font-medium">
                    {formatPHP(sc.current_balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-blue-600">
                <button
                  className="flex items-center gap-2"
                  title="View"
                  type="button"
                >
                  <FaEye />
                  <span className="text-sm">View</span>
                </button>
                <button
                  className="flex items-center gap-2 text-yellow-600"
                  title="Edit"
                  type="button"
                  onClick={() => {
                    setEditData(sc);
                    setIsPopupOpen(true);
                  }}
                >
                  <FaEdit />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  className="flex items-center gap-2 text-gray-700"
                  title="Archive"
                  type="button"
                  onClick={() => confirmArchiveUser(sc)}
                >
                  <FaArchive />
                  <span className="text-sm">Archive</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Desktop/Tablet Table View (shown on ≥ md) ===== */}
      <div className="hidden md:block bg-white shadow rounded overflow-x-auto mt-4">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs md:text-sm">
            <tr>
              <th className="p-3 font-medium">UID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Age</th>
              <th className="p-3 font-medium">Barangay</th>
              <th className="p-3 font-medium">Balance</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filteredSeniorCitizens.length > 0 ? (
              filteredSeniorCitizens.map((sc) => (
                <tr key={sc.firebaseId} className="border-t text-xs md:text-sm">
                  <td className="p-3 break-all">{sc.firebaseId}</td>
                  <td className="p-3 font-semibold">{sc.name || "—"}</td>
                  <td className="p-3">{sc.age ?? "—"}</td>
                  <td className="p-3">{sc.barangay || "—"}</td>
                  <td className="p-3">{formatPHP(sc.current_balance)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusStyles[sc.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sc.status || "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-lg">
                      <button className="text-blue-600" title="View">
                        <FaEye />
                      </button>
                      <button
                        className="text-yellow-600"
                        title="Edit"
                        onClick={() => {
                          setEditData(sc);
                          setIsPopupOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-gray-700"
                        title="Archive"
                        onClick={() => confirmArchiveUser(sc)}
                      >
                        <FaArchive />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="p-3 text-center text-gray-500 text-sm"
                >
                  No senior citizens found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Edit Popup ===== */}
      {isPopupOpen && editData && (
        <div className="fixed inset-0 flex justify-center items-start bg-black/40 z-50 p-4 overflow-y-auto">
          <div className="bg-white border rounded-lg shadow-lg p-6 w-full max-w-3xl animate-slideDownBounceScale">
            <h2 className="text-lg font-semibold mb-4">Edit Senior Citizen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">UID</label>
                <input
                  className="border p-2 rounded w-full bg-gray-100"
                  value={editData.firebaseId}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="border p-2 rounded w-full"
                  value={editData.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Birthdate</label>
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={editData.birthdate || ""}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const birthdate = e.target.value;
                    const age = calculateAge(birthdate);
                    if (age < 60) {
                      alert("Senior citizen must be at least 60 years old.");
                      return;
                    }
                    setEditData({ ...editData, birthdate, age });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Age</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full bg-gray-100"
                  value={editData.age || ""}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <select
                  className="border p-2 rounded w-full"
                  value={editData.barangay || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, barangay: e.target.value })
                  }
                >
                  <option>Binanuun</option>
                  <option>Caawigan</option>
                  <option>Cahabaan</option>
                  <option>Calintaan</option>
                  <option>Del Carmen</option>
                  <option>Gabon</option>
                  <option>Itomang</option>
                  <option>Poblacion</option>
                  <option>San Francisco</option>
                  <option>San Isidro</option>
                  <option>San Jose</option>
                  <option>San Nicolas</option>
                  <option>Sta. Cruz</option>
                  <option>Sta. Elena</option>
                  <option>Sto. Niño</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Balance</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={editData.current_balance ?? 0}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      current_balance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  className="border p-2 rounded w-full"
                  value={editData.status || "Active"}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Suspended</option>
                  <option>Claimed</option>
                  <option>Unclaimed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={async () => {
                  await updateUser(editData.firebaseId, {
                    name: editData.name || "",
                    birthdate: editData.birthdate || "",
                    age: Number(editData.age) || null,
                    barangay: editData.barangay || "",
                    current_balance:
                      editData.current_balance === "" ||
                      editData.current_balance === null ||
                      isNaN(Number(editData.current_balance))
                        ? 0
                        : Number(editData.current_balance),
                    status: editData.status || "Active",
                  });
                  setIsPopupOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Archive Popup ===== */}
      {isArchivePopupOpen && editData && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50 p-4 overflow-y-auto">
          <div className="bg-white border rounded-lg shadow-lg p-6 w-full max-w-lg animate-slideDownBounceScale">
            <h2 className="text-lg font-semibold mb-4 text-red-600">
              Archive Senior Citizen
            </h2>
            <p>
              Are you sure you want to archive{" "}
              <span className="font-bold">{editData.name}</span>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setIsArchivePopupOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={async () => {
                  await archiveUser(editData.firebaseId, editData);
                  setIsArchivePopupOpen(false);
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        .animate-slideDownBounceScale {
          animation: slideDownBounceScale 0.5s ease-in-out;
        }
        @keyframes slideDownBounceScale {
          0% {
            opacity: 0;
            transform: translateY(-40px) scale(0.95);
          }
          60% {
            opacity: 1;
            transform: translateY(10px) scale(1.02);
          }
          80% {
            transform: translateY(-5px) scale(0.99);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
};

export default SeniorcitizenList;
