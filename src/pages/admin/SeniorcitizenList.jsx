import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";

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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    barangay: "",
    status: "",
  });

  // ===== READ =====
  const fetchUsers = () => {
    const seniorRef = ref(db, "seniorCitizens");
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

  // ===== CREATE =====
  const handleAddSenior = () => {
    if (!formData.name || !formData.age || !formData.barangay || !formData.status) {
      alert("Please fill in all fields.");
      return;
    }

    const newSenior = {
      id: `SC${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
      name: formData.name,
      age: parseInt(formData.age, 10),
      barangay: formData.barangay,
      status: formData.status,
    };

    push(ref(db, "seniorCitizens"), newSenior);
    setFormData({ name: "", age: "", barangay: "", status: "" });
    setShowModal(false);
  };

  // ===== UPDATE =====
  const updateUser = (firebaseId, updatedData) => {
    update(ref(db, `seniorCitizens/${firebaseId}`), updatedData);
  };

  // ===== DELETE =====
  const deleteUser = (firebaseId) => {
    if (window.confirm("Are you sure you want to delete this senior citizen?")) {
      remove(ref(db, `seniorCitizens/${firebaseId}`));
    }
  };

  // ===== FILTERING =====
  const filteredSeniorCitizens = seniorCitizens.filter((sc) => {
    const matchesSearch =
      sc.name.toLowerCase().includes(search.toLowerCase()) ||
      sc.id.toLowerCase().includes(search.toLowerCase());

    const matchesBarangay =
      barangayFilter === "All Barangays" || sc.barangay === barangayFilter;

    const matchesPensionStatus =
      pensionStatusFilter === "All Status" || sc.status === pensionStatusFilter;

    const matchesAgeRange =
      ageRangeFilter === "All Ages" ||
      (ageRangeFilter === "60-69" && sc.age >= 60 && sc.age <= 69) ||
      (ageRangeFilter === "70-79" && sc.age >= 70 && sc.age <= 79) ||
      (ageRangeFilter === "80+" && sc.age >= 80);

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
  };

  const CustomButton = ({ children, className = "", ...props }) => (
    <button
      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Senior Citizens</h1>
        <CustomButton onClick={() => setShowModal(true)}>+ Add Senior Citizen</CustomButton>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID..."
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
          <option>Poblacion</option>
          <option>Calintaan</option>
          <option>Poblacion 3</option>
        </select>
        <select
          className="border p-2 rounded"
          value={ageRangeFilter}
          onChange={(e) => setAgeRangeFilter(e.target.value)}
        >
          <option>All Ages</option>
          <option>60-69</option>
          <option>70-79</option>
          <option>80+</option>
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
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Age</th>
              <th className="p-3 font-medium">Barangay</th>
              <th className="p-3 font-medium">Pension Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSeniorCitizens.length > 0 ? (
              filteredSeniorCitizens.map((sc) => (
                <tr key={sc.firebaseId} className="border-t">
                  <td className="p-3">{sc.id}</td>
                  <td className="p-3 font-semibold">{sc.name}</td>
                  <td className="p-3">{sc.age}</td>
                  <td className="p-3">{sc.barangay}</td>
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
                        const newName = prompt("Enter new name", sc.name);
                        if (newName) updateUser(sc.firebaseId, { name: newName });
                      }}
                    />
                    <FaTrash
                      className="cursor-pointer text-red-600"
                      onClick={() => deleteUser(sc.firebaseId)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  No senior citizens found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add Senior Citizen</h2>

            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="text"
              name="barangay"
              placeholder="Barangay"
              value={formData.barangay}
              onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              className="w-full border p-2 mb-2 rounded"
            />
            <select
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border p-2 mb-4 rounded"
            >
              <option value="">Select Pension Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleAddSenior}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SeniorcitizenList;
