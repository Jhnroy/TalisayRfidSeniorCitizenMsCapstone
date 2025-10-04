import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, update, get } from "firebase/database";

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

const Masterlist = () => {
  const [activeTab, setActiveTab] = useState("overall");
  const [records, setRecords] = useState({ overall: [], pensioners: [] });
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const rfidRef = ref(rtdb, "rfidBindings");

    let seniorsSnap = null;
    let rfidSnap = null;

    const mergeData = (seniorsSnap, rfidSnap) => {
      if (!seniorsSnap.exists()) {
        setRecords({ overall: [], pensioners: [] });
        setFilteredRecords([]);
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
          surname: value.lastName || "",
          firstName: value.firstName || "",
          middleName: value.middleName || "",
          extName: value.extName || "",
          barangay: value.barangay || "-",
          birthday: value.dateOfBirth || "",
          birthdayFormatted: formatDate(value.dateOfBirth),
          status: value.status || "Active",
          rfidStatus: rfidInfo.status || "Not Bound",
          rfidCode: rfidInfo.rfidCode || "-",
          pensionReceived: rfidInfo.pensionReceived ? "Yes" : "No",
          missed: rfidInfo.missedConsecutive ?? 0,
          lastClaim: rfidInfo.lastClaimDate
            ? formatDate(rfidInfo.lastClaimDate)
            : "Never",
        };
      });

      const overall = seniorsArray;
      const pensioners = seniorsArray.filter(
        (row) => row.status === "Eligible"
      );

      setRecords({ overall, pensioners });
      setFilteredRecords(overall);
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
    let sourceData =
      activeTab === "overall" ? records.overall : records.pensioners;
    let filtered = [...sourceData];

    if (search.trim() !== "")
      filtered = filtered.filter((row) =>
        `${row.surname}, ${row.firstName} ${row.middleName} ${row.extName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );

    if (barangayFilter !== "All")
      filtered = filtered.filter(
        (row) => row.barangay?.toLowerCase() === barangayFilter.toLowerCase()
      );

    if (statusFilter !== "All" && activeTab === "overall")
      filtered = filtered.filter(
        (row) =>
          (row.status || "Active").toLowerCase() ===
          statusFilter.toLowerCase()
      );

    setFilteredRecords(filtered);
  }, [search, barangayFilter, statusFilter, activeTab, records, loading]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All");
    setStatusFilter("All");
    setActiveTab("overall");
  };

  // ✅ Eligibility check against pensionAgencies
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Masterlist</h1>
      <p className="text-gray-600">Senior Citizens Records</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-64"
        />
        <select
          className="border px-3 py-2 rounded-md"
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
        >
          <option value="All">All Barangays</option>
          {barangays.map((brgy) => (
            <option key={brgy} value={brgy}>
              {brgy}
            </option>
          ))}
        </select>
        {activeTab === "overall" && (
          <select
            className="border px-3 py-2 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Eligible">Eligible</option>
            <option value="Active">Active</option>
            <option value="Removed">Removed</option>
          </select>
        )}
        <button
          className="border border-gray-400 px-3 py-2 rounded-md"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex">
        <button
          onClick={() => setActiveTab("overall")}
          className={`px-6 py-2 rounded-t-lg font-semibold ${
            activeTab === "overall"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Overall List
        </button>
        <button
          onClick={() => setActiveTab("pensioners")}
          className={`px-6 py-2 rounded-t-lg font-semibold ${
            activeTab === "pensioners"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pensioners
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-b-lg">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No records found.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Birthday</th>
                <th className="px-4 py-2">Barangay</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">RFID Status</th>
                <th className="px-4 py-2">RFID Code</th>
                <th className="px-4 py-2">Pension Received</th>
                <th className="px-4 py-2">Missed Consecutive</th>
                <th className="px-4 py-2">Last Claim Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRecord(row)}
                >
                  <td className="px-4 py-2">
                    {row.surname}, {row.firstName} {row.middleName || ""}{" "}
                    {row.extName || ""}
                  </td>
                  <td className="px-4 py-2">{row.birthdayFormatted}</td>
                  <td className="px-4 py-2">{row.barangay}</td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      row.status === "Eligible"
                        ? "text-green-600"
                        : row.status === "Active"
                        ? "text-blue-600"
                        : row.status === "Removed"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {row.status}
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      row.rfidStatus === "Bound"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {row.rfidStatus}
                  </td>
                  <td className="px-4 py-2 font-mono">{row.rfidCode}</td>
                  <td>{row.pensionReceived}</td>
                  <td>{row.missed}</td>
                  <td>{row.lastClaim}</td>
                </tr>
              ))}
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
              <strong>Name:</strong> {selectedRecord.surname},{" "}
              {selectedRecord.firstName} {selectedRecord.middleName}{" "}
              {selectedRecord.extName}
            </p>
            <p>
              <strong>Barangay:</strong> {selectedRecord.barangay}
            </p>
            <p>
              <strong>Birthday:</strong> {formatDate(selectedRecord.birthday)}
            </p>
            <p>
              <strong>Age:</strong> {getAge(selectedRecord.birthday)}
            </p>
            <p>
              <strong>Status:</strong> {selectedRecord.status}
            </p>
            <p>
              <strong>RFID Status:</strong> {selectedRecord.rfidStatus}
            </p>
            <p>
              <strong>RFID Code:</strong> {selectedRecord.rfidCode}
            </p>
            <p>
              <strong>Pension Received:</strong> {selectedRecord.pensionReceived}
            </p>
            <p>
              <strong>Missed Consecutive:</strong> {selectedRecord.missed}
            </p>
            <p className="mb-4">
              <strong>Last Claim Date:</strong> {selectedRecord.lastClaim}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
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
              {/* <button
                onClick={() => handleValidation("Removed")}
                className="bg-red-500 text-white px-3 py-2 rounded"
              >
                Reject
              </button> */}

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

export default Masterlist;
