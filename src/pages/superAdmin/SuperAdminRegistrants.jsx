import React, { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { rtdb } from "../../router/Firebase";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toISOString().split("T")[0];
};

const Registrant = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    houseNo: "",
    streetName: "",
    purok: "",
    barangay: "",
    municipality: "Talisay",
    province: "Camarines Norte",
    age: "",
    dateOfBirth: "",
    contactNumber: "",
    disability: "",
    consent: true,
    emergencyName: "",
    emergencyContact: "",
    emergencyRelationship: "",
    claimed: false,
    claimedDate: "",
    status: "Not Eligible",
    seniorId: "",
  };

  const [form, setForm] = useState(initialForm);

  // Fetch seniors in real-time
  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const unsubscribe = onValue(seniorsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setData([]);
        return;
      }
      const seniorsData = snapshot.val();
      const merged = Object.entries(seniorsData).map(([id, value]) => ({
        id,
        ...value,
      }));
      setData(merged);
    });
    return () => unsubscribe();
  }, []);

  // Filter data
  const filteredData = data.filter((item) => {
    const fullName = `${item.firstName} ${item.middleName || ""} ${item.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesBarangay = barangayFilter === "All" || item.barangay === barangayFilter;
    const matchesAge =
      ageFilter === "All" ||
      (ageFilter === "60-65" && item.age >= 60 && item.age <= 65) ||
      (ageFilter === "66-70" && item.age >= 66 && item.age <= 70) ||
      (ageFilter === "71+" && item.age >= 71);
    return matchesSearch && matchesBarangay && matchesAge;
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Ensure only numbers for contact fields, max 11
    if ((name === "contactNumber" || name === "emergencyContact") && value) {
      const numeric = value.replace(/\D/g, "");
      if (numeric.length <= 11) {
        setForm({ ...form, [name]: numeric });
      }
      return;
    }

    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await remove(ref(rtdb, `senior_citizens/${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const updates = { ...form };
        updates.status = editingItem.status;
        updates.municipality = "Talisay";
        updates.province = "Camarines Norte";
        await update(ref(rtdb, `senior_citizens/${editingItem.id}`), updates);
      } else {
        await push(ref(rtdb, "senior_citizens"), form);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Senior Citizens</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-64"
        />
        <select
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="All">All Barangays</option>
          {barangays.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="All">All Ages</option>
          <option value="60-65">60-65</option>
          <option value="66-70">66-70</option>
          <option value="71+">71+</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Barangay</th>
              <th className="px-4 py-2">Age</th>
              <th className="px-4 py-2">Birthdate</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{item.firstName} {item.middleName || ""} {item.lastName}</td>
                <td className="px-4 py-2">{item.barangay}</td>
                <td className="px-4 py-2">{item.age}</td>
                <td className="px-4 py-2">{formatDate(item.dateOfBirth)}</td>
                <td className="px-4 py-2 font-medium text-green-600">{item.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  <FaEdit className="cursor-pointer text-green-600" onClick={() => handleEdit(item)} />
                  <FaTrash className="cursor-pointer text-red-600" onClick={() => handleDelete(item.id)} />
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-4">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">{editingItem ? "Edit Senior" : "Add Senior"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="border p-2 rounded-lg w-full" required />
                <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle Name" className="border p-2 rounded-lg w-full" />
              </div>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="border p-2 rounded-lg w-full" required />
              <input name="gender" value={form.gender} onChange={handleChange} placeholder="Gender" className="border p-2 rounded-lg w-full" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input name="houseNo" value={form.houseNo} onChange={handleChange} placeholder="House No." className="border p-2 rounded-lg w-full" />
                
               <select
                  name="purok"
                  value={form.purok}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full"
                  required
                >
                  <option value="">Select Purok</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={`Purok ${num}`}>Purok {num}</option>
                  ))}
                </select>

                
              </div>

              <select name="barangay" value={form.barangay} onChange={handleChange} className="border p-2 rounded-lg w-full" required>
                <option value="">Select Barangay</option>
                {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>

              <input name="municipality" value="Talisay" readOnly className="border p-2 rounded-lg w-full bg-gray-100 cursor-not-allowed" />
              <input name="province" value="Camarines Norte" readOnly className="border p-2 rounded-lg w-full bg-gray-100 cursor-not-allowed" />

              <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="Age" className="border p-2 rounded-lg w-full" />
              <input type="date" name="dateOfBirth" value={formatDate(form.dateOfBirth)} onChange={handleChange} className="border p-2 rounded-lg w-full" />
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" className="border p-2 rounded-lg w-full" />
              <input name="disability" value={form.disability} onChange={handleChange} placeholder="Disability" className="border p-2 rounded-lg w-full" />
              <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} /> Consent
              <input name="emergencyName" value={form.emergencyName} onChange={handleChange} placeholder="Emergency Name" className="border p-2 rounded-lg w-full" />
              <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Emergency Contact" className="border p-2 rounded-lg w-full" />
              <input name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} placeholder="Emergency Relationship" className="border p-2 rounded-lg w-full" />
              <input type="checkbox" name="claimed" checked={form.claimed} onChange={handleChange} /> Claimed
              <input name="claimedDate" type="text" value={form.claimedDate} onChange={handleChange} placeholder="Claimed Date" className="border p-2 rounded-lg w-full" />
              <input name="status" value={form.status} readOnly className="border p-2 rounded-lg w-full bg-gray-100 cursor-not-allowed" />
              <input name="seniorId" value={form.seniorId} onChange={handleChange} placeholder="Senior ID" className="border p-2 rounded-lg w-full" />

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{editingItem ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registrant;
