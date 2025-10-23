import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";

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

// ✅ Format date safely
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

// ✅ Compute age
const getAge = (dateStr) => {
  if (!dateStr || dateStr === "Never") return "N/A";
  const today = new Date();
  const birthDate = new Date(dateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// ✅ Format full name
const formatFullName = (last, first, middle, ext) => {
  const middleInitial = middle ? `${middle.charAt(0)}.` : "";
  const suffix = ext ? ` ${ext}` : "";
  return `${last}, ${first} ${middleInitial}${suffix}`.trim();
};

// ✅ Determine quarter from date
const determineQuarter = (dateStr) => {
  if (!dateStr || dateStr === "Never") return "N/A";
  const month = new Date(dateStr).getMonth() + 1;
  if (month >= 1 && month <= 3) return "1st Quarter";
  if (month >= 4 && month <= 6) return "2nd Quarter";
  if (month >= 7 && month <= 9) return "3rd Quarter";
  if (month >= 10 && month <= 12) return "4th Quarter";
  return "N/A";
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
  const [ageFilter, setAgeFilter] = useState("All");
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

        const lastClaimDate = rfidInfo.lastClaimDate
          ? formatDate(rfidInfo.lastClaimDate)
          : "Never";
        const quarter = determineQuarter(rfidInfo.lastClaimDate);

        return {
          id,
          seniorId: value.seniorId || "",
          surname: value.lastName || "",
          firstName: value.firstName || "",
          middleName: value.middleName || "",
          suffix: value.suffix || "",
          barangay: value.barangay || "-",
          birthday: value.dateOfBirth || "",
          birthdayFormatted: formatDate(value.dateOfBirth),
          age: getAge(value.dateOfBirth),
          status: value.status || "Active",
          rfidStatus: rfidInfo.status || "Not Bound",
          rfidCode: rfidInfo.rfidCode || "-",
          quarter,
          missed: rfidInfo.missedConsecutive ?? 0,
          lastClaim: lastClaimDate,
          lastUpdated: value.lastUpdated || null,
        };
      });

      const overall = seniorsArray;
      const pensioners = seniorsArray.filter(
        (row) => row.status === "Eligible"
      );

      const now = new Date();
      const recent = seniorsArray.filter((row) => {
        if (!row.lastUpdated) return false;
        const updatedDate = new Date(row.lastUpdated);
        const diffDays = (now - updatedDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
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

  // ✅ Filtering logic
  useEffect(() => {
    if (loading) return;
    let sourceData = [];
    if (activeTab === "overall") sourceData = records.overall;
    else if (activeTab === "pensioners") sourceData = records.pensioners;
    else if (activeTab === "recent") sourceData = records.recent;

    let filtered = [...sourceData];

    if (search.trim() !== "")
      filtered = filtered.filter((row) =>
        formatFullName(
          row.surname,
          row.firstName,
          row.middleName,
          row.suffix
        )
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

    if (ageFilter !== "All") {
      filtered = filtered.filter((row) => {
        const age = row.age;
        if (age === "N/A") return false;

        switch (ageFilter) {
          case "60-69":
            return age >= 60 && age <= 69;
          case "70-79":
            return age >= 70 && age <= 79;
          case "80-89":
            return age >= 80 && age <= 89;
          case "90+":
            return age >= 90;
          default:
            return true;
        }
      });
    }

    setFilteredRecords(filtered);
  }, [search, barangayFilter, statusFilter, ageFilter, activeTab, records, loading]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All");
    setStatusFilter("All");
    setAgeFilter("All");
    setActiveTab("overall");
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
        <select
          className="border px-3 py-2 rounded-md"
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
        >
          <option value="All">All Ages</option>
          <option value="60-69">60–69</option>
          <option value="70-79">70–79</option>
          <option value="80-89">80–89</option>
          <option value="90+">90+</option>
        </select>
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

      {/* ✅ Table */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-b-lg">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No records found.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">ID Number</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Birthday</th>
                <th className="px-4 py-2">Age</th>
                <th className="px-4 py-2">Barangay</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">RFID Status</th>
                <th className="px-4 py-2">RFID Code</th>
                <th className="px-4 py-2 text-center">Quarter Claim</th>
                <th className="px-4 py-2 text-center">Missed</th>
                <th className="px-4 py-2 text-center">Last Claim</th>
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
                  <td className="px-4 py-2 font-mono text-gray-700">
                    {row.seniorId}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {formatFullName(
                      row.surname,
                      row.firstName,
                      row.middleName,
                      row.suffix
                    )}
                  </td>
                  <td className="px-4 py-2">{row.birthdayFormatted}</td>
                  <td className="px-4 py-2 text-center">{row.age}</td>
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
                  <td className="px-4 py-2 font-mono text-center">
                    {row.rfidCode}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-blue-600">
                    {row.quarter}
                  </td>
                  <td className="px-4 py-2 text-center">{row.missed}</td>
                  <td className="px-4 py-2 text-center">{row.lastClaim}</td>
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
