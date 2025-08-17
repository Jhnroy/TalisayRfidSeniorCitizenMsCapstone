import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaArchive } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, remove, set } from "firebase/database";

// ===== Firebase configuration =====
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

// ===== Initialize Firebase =====
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

  // ===== READ from registered_uids =====
  const fetchUsers = () => {
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
    });
  };

  // ===== UPDATE =====
  const updateUser = (firebaseId, updatedData) => {
    update(ref(db, `registered_uids/${firebaseId}`), updatedData);
  };

  // ===== ARCHIVE (popup confirm) =====
  const confirmArchiveUser = (user) => {
    setEditData(user);
    setIsArchivePopupOpen(true);
  };

  const archiveUser = (firebaseId, userData) => {
    set(ref(db, `archivedSeniorCitizens/${firebaseId}`), userData).then(() => {
      remove(ref(db, `registered_uids/${firebaseId}`));
    });
  };

  // ===== FILTERING =====
  const filteredSeniorCitizens = seniorCitizens.filter((sc) => {
    const matchesSearch =
      sc.name.toLowerCase().includes(search.toLowerCase()) ||
      sc.firebaseId.toLowerCase().includes(search.toLowerCase()) ||
      (sc.barangay && sc.barangay.toLowerCase().includes(search.toLowerCase())) ||
      (sc.current_balance && sc.current_balance.toString().includes(search)) ||
      (sc.status && sc.status.toLowerCase().includes(search.toLowerCase())) ||
      (sc.age && sc.age.toString().includes(search));

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const statusStyles = {
    Active: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Suspended: "bg-red-100 text-red-700",
    Claimed: "bg-blue-100 text-blue-700",
    Unclaimed: "bg-gray-100 text-gray-700",
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Senior Citizens</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by UID, Name, Age, Barangay, Balance, or Status..."
          className="border p-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded"
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
          className="border p-2 rounded"
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
          className="border p-2 rounded"
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

      {/* Table */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
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
            {filteredSeniorCitizens.length > 0 ? (
              filteredSeniorCitizens.map((sc) => (
                <tr key={sc.firebaseId} className="border-t">
                  <td className="p-3">{sc.firebaseId}</td>
                  <td className="p-3 font-semibold">{sc.name}</td>
                  <td className="p-3">{sc.age}</td>
                  <td className="p-3">{sc.barangay}</td>
                  <td className="p-3">₱{sc.current_balance}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[sc.status]}`}
                    >
                      {sc.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 text-blue-600">
                    <FaEye className="cursor-pointer" />
                    <FaEdit
                      className="cursor-pointer text-yellow-600"
                      onClick={() => {
                        setEditData(sc);
                        setIsPopupOpen(true);
                      }}
                    />
                    <FaArchive
                      className="cursor-pointer text-gray-600"
                      onClick={() => confirmArchiveUser(sc)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-3 text-center text-gray-500">
                  No senior citizens found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Popup */}
      {isPopupOpen && editData && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 animate-slideDownBounceScale bg-white border rounded-lg shadow-lg p-6 w-[700px] z-50"
        >
          <h2 className="text-lg font-semibold mb-4">Edit Senior Citizen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">UID</label>
              <input className="border p-2 rounded w-full bg-gray-100" value={editData.firebaseId} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                className="border p-2 rounded w-full"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Age</label>
              <input
                type="number"
                className="border p-2 rounded w-full"
                value={editData.age}
                onChange={(e) => setEditData({ ...editData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Barangay</label>
              <select
                className="border p-2 rounded w-full"
                value={editData.barangay}
                onChange={(e) => setEditData({ ...editData, barangay: e.target.value })}
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
                value={editData.current_balance}
                onChange={(e) => setEditData({ ...editData, current_balance: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                className="border p-2 rounded w-full"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
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
              onClick={() => {
                updateUser(editData.firebaseId, {
                  name: editData.name,
                  age: Number(editData.age),
                  barangay: editData.barangay,
                  current_balance: Number(editData.current_balance),
                  status: editData.status,
                });
                setIsPopupOpen(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Archive Popup */}
      {isArchivePopupOpen && editData && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 animate-slideDownBounceScale bg-white border rounded-lg shadow-lg p-6 w-[500px] z-50"
        >
          <h2 className="text-lg font-semibold mb-4 text-red-600">Archive Senior Citizen</h2>
          <p>Are you sure you want to archive <span className="font-bold">{editData.name}</span>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => setIsArchivePopupOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={() => {
                archiveUser(editData.firebaseId, editData);
                setIsArchivePopupOpen(false);
              }}
            >
              Archive
            </button>
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
