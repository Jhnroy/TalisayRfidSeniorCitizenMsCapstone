import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, update, get } from "firebase/database";

const barangays = [
  "All Barangays",
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

// Format date safely
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "Never") return "Never";
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Compute age
const getAge = (dateStr) => {
  if (!dateStr || dateStr === "Never") return "N/A";
  const today = new Date();
  const birthDate = new Date(dateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const DswdValidation = () => {
  const [records, setRecords] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const rfidRef = ref(rtdb, "rfidBindings");

    let seniorsSnap = null;
    let rfidSnap = null;

    const mergeData = (seniorsSnap, rfidSnap) => {
      if (!seniorsSnap.exists()) {
        setRecords([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }

      const seniorsData = seniorsSnap.val();
      const rfidData = rfidSnap.exists() ? rfidSnap.val() : {};

      const seniorsArray = Object.entries(seniorsData).map(([id, value]) => {
        const rfidInfo =
          Object.values(rfidData).find((r) => r.seniorId === value.seniorId) ||
          {};

        return {
          id,
          seniorId: value.seniorId || "",
          name: `${value.lastName || ""}, ${value.firstName || ""} ${
            value.middleName || ""
          } ${value.extName || ""}`.trim(),
          barangay: value.barangay || "-",
          birthday: value.dateOfBirth || "",
          age: getAge(value.dateOfBirth),
          eligibility: value.status || "Active",
          registrationDate: formatDate(value.createdAt) || "N/A",
          rfid: rfidInfo.rfidCode ? "Yes" : "No",
          validationStatus: rfidInfo.status || "Not Bound",
          rfidCode: rfidInfo.rfidCode || "-",
        };
      });

      setRecords(seniorsArray);
      setFilteredData(seniorsArray);
      setLoading(false);
    };

    const unsubSeniors = onValue(seniorsRef, (snap) => {
      seniorsSnap = snap;
      if (seniorsSnap && rfidSnap) mergeData(seniorsSnap, rfidSnap);
    });

    const unsubRfid = onValue(rfidRef, (snap) => {
      rfidSnap = snap;
      if (seniorsSnap && rfidSnap) mergeData(seniorsSnap, rfidSnap);
    });

    return () => {
      unsubSeniors();
      unsubRfid();
    };
  }, []);

  // Filters
  useEffect(() => {
    if (loading) return;
    let data = [...records];

    if (search.trim() !== "")
      data = data.filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase())
      );

    if (barangayFilter !== "All Barangays")
      data = data.filter(
        (row) => row.barangay?.toLowerCase() === barangayFilter.toLowerCase()
      );

    if (statusFilter !== "All Statuses")
      data = data.filter((row) => row.validationStatus === statusFilter);

    setFilteredData(data);
  }, [search, barangayFilter, statusFilter, records, loading]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All Barangays");
    setStatusFilter("All Statuses");
  };

  // ✅ Update status
  const handleValidation = async (status) => {
    if (!selectedRecord) return;
    try {
      // Check existing pensions
      const agencies = ["AFP", "GSIS", "PVAO", "SSS"];
      let hasExistingPension = false;

      for (const agency of agencies) {
        const agencyRef = ref(
          rtdb,
          `pensionAgencies/${agency}/${selectedRecord.seniorId}`
        );
        const snapshot = await get(agencyRef);
        if (snapshot.exists()) {
          hasExistingPension = true;
          break;
        }
      }

      if (status === "Eligible" && hasExistingPension) {
        alert(
          "❌ This senior already has an existing pension from another agency. Cannot mark as Eligible."
        );
        return;
      }

      const recordRef = ref(rtdb, `senior_citizens/${selectedRecord.id}`);
      await update(recordRef, { status });
      alert(`✅ Record updated to ${status}`);
      setSelectedRecord(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update record.");
    }
  };

  const statuses = [
    "All Statuses",
    ...new Set(records.map((d) => d.validationStatus)),
  ];

  return (
    <div className="p-4 w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-1">Validation</h2>
      <p className="text-gray-500 mb-4">Validation Of Records</p>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-start md:items-center">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-1/3"
        />

        <select
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-1/4"
        >
          {barangays.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-1/4"
        >
          {statuses.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading records...</p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Barangay</th>
                <th className="px-4 py-2 border-b">Age</th>
                <th className="px-4 py-2 border-b">Eligibility</th>
                <th className="px-4 py-2 border-b">Registration Date</th>
                <th className="px-4 py-2 border-b">RFID Binded</th>
                <th className="px-4 py-2 border-b">Validation Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className={`cursor-pointer ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                  onClick={() => setSelectedRecord(item)}
                >
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2">{item.barangay}</td>
                  <td className="px-4 py-2">{item.age}</td>
                  <td className="px-4 py-2">{item.eligibility}</td>
                  <td className="px-4 py-2">{item.registrationDate}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.rfid === "No"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.rfid}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-orange-500 font-semibold">
                    {item.validationStatus}
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-10 bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Validate Senior</h2>
            <p>
              <strong>Name:</strong> {selectedRecord.name}
            </p>
            <p>
              <strong>Barangay:</strong> {selectedRecord.barangay}
            </p>
            <p>
              <strong>Age:</strong> {selectedRecord.age}
            </p>
            <p>
              <strong>Eligibility:</strong> {selectedRecord.eligibility}
            </p>
            <p>
              <strong>Registration Date:</strong>{" "}
              {selectedRecord.registrationDate}
            </p>
            <p>
              <strong>RFID Code:</strong> {selectedRecord.rfidCode}
            </p>
            <p>
              <strong>Status:</strong> {selectedRecord.validationStatus}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => handleValidation("Eligible")}
                className="bg-green-500 text-white px-3 py-2 rounded"
              >
                Mark Eligible
              </button>
              <button
                onClick={() => handleValidation("Active")}
                className="bg-blue-500 text-white px-3 py-2 rounded"
              >
                Mark Active
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="ml-auto bg-gray-300 px-3 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DswdValidation;
