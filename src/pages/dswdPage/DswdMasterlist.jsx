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
  const [records, setRecords] = useState({
    overall: [],
    pensioners: [],
    recent: [],
  });
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
        setRecords({ overall: [], pensioners: [], recent: [] });
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
          lastUpdated: value.lastUpdated || null,
        };
      });

      // Create subsets
      const overall = seniorsArray;
      const pensioners = seniorsArray.filter(
        (row) => row.status === "Eligible"
      );

      const now = new Date();
      const recent = seniorsArray.filter((row) => {
        if (!row.lastUpdated) return false;
        const updatedDate = new Date(row.lastUpdated);
        const diffDays = (now - updatedDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7; // ✅ Updated within last 7 days
      });

      setRecords({ overall, pensioners, recent });
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
    let sourceData = [];
    if (activeTab === "overall") sourceData = records.overall;
    else if (activeTab === "pensioners") sourceData = records.pensioners;
    else if (activeTab === "recent") sourceData = records.recent;

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

  // ✅ Validation with timestamp for recent tab
  const handleValidation = async (status) => {
    if (!selectedRecord) return;
    try {
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
      await update(recordRef, {
        status,
        lastUpdated: new Date().toISOString(), // ✅ add recent timestamp
      });
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
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-6 py-2 rounded-t-lg font-semibold ${
            activeTab === "recent"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Recent
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
                {activeTab === "recent" && (
                  <th className="px-4 py-2">Last Updated</th>
                )}
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
                  {activeTab === "recent" && (
                    <td>{row.lastUpdated ? formatDate(row.lastUpdated) : "-"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Masterlist;
