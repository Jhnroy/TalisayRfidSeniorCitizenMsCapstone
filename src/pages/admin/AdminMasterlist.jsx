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

// Safe date formatter
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

const Masterlist = () => {
  const [activeTab, setActiveTab] = useState("overall");
  const [records, setRecords] = useState({ overall: [], pensioners: [] });
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const rfidRef = ref(rtdb, "rfidBindings");

    let seniorsSnapData = null;
    let rfidSnapData = null;

    const handleData = (seniorsSnap, rfidSnap) => {
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
          surname: value.lastName || "",
          firstName: value.firstName || "",
          middleName: value.middleName || "",
          extName: value.extName || "",
          barangay: value.barangay || "-",
          birthday: formatDate(value.dateOfBirth),
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
      seniorsSnapData = snap;
      if (seniorsSnapData && rfidSnapData) {
        handleData(seniorsSnapData, rfidSnapData);
      }
    });

    const unsubRfid = onValue(rfidRef, (snap) => {
      rfidSnapData = snap;
      if (seniorsSnapData && rfidSnapData) {
        handleData(seniorsSnapData, rfidSnapData);
      }
    });

    return () => {
      unsubSeniors();
      unsubRfid();
    };
  }, []);

  // Filtering
  useEffect(() => {
    if (loading) return;

    let sourceData =
      activeTab === "overall" ? records.overall : records.pensioners;

    let filtered = [...sourceData];

    if (search.trim() !== "") {
      filtered = filtered.filter((row) =>
        `${row.surname}, ${row.firstName} ${row.middleName} ${row.extName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (barangayFilter !== "All") {
      filtered = filtered.filter(
        (row) => row.barangay?.toLowerCase() === barangayFilter.toLowerCase()
      );
    }

    if (statusFilter !== "All" && activeTab === "overall") {
      filtered = filtered.filter(
        (row) =>
          (row.status || "Active").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredRecords(filtered);
  }, [search, barangayFilter, statusFilter, activeTab, records, loading]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All");
    setStatusFilter("All");
    setActiveTab("overall");
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold">Masterlist</h1>
      <p className="text-gray-600 text-sm sm:text-base">
        Senior Citizens Records
      </p>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        />
        <select
          className="border px-3 py-2 rounded-md w-full"
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
            className="border px-3 py-2 rounded-md w-full"
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
          className="border border-gray-400 px-3 py-2 rounded-md w-full bg-gray-50 hover:bg-gray-100"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-col sm:flex-row">
        <button
          onClick={() => setActiveTab("overall")}
          className={`px-4 py-2 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none font-semibold text-sm sm:text-base ${
            activeTab === "overall"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Overall List
        </button>
        <button
          onClick={() => setActiveTab("pensioners")}
          className={`px-4 py-2 rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none font-semibold text-sm sm:text-base ${
            activeTab === "pensioners"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pensioners
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4 shadow border border-gray-200 rounded-lg">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No records found.</p>
        ) : (
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-2 sm:px-4 py-2">Name</th>
                <th className="px-2 sm:px-4 py-2">Birthday</th>
                <th className="px-2 sm:px-4 py-2">Barangay</th>
                <th className="px-2 sm:px-4 py-2">Status</th>
                <th className="px-2 sm:px-4 py-2">RFID Status</th>
                <th className="px-2 sm:px-4 py-2">RFID Code</th>
                <th className="px-2 sm:px-4 py-2">Pension Received</th>
                <th className="px-2 sm:px-4 py-2">Missed</th>
                <th className="px-2 sm:px-4 py-2">Last Claim</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                    {row.surname}, {row.firstName} {row.middleName || ""}{" "}
                    {row.extName || ""}
                  </td>
                  <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                    {row.birthday}
                  </td>
                  <td className="px-2 sm:px-4 py-2">{row.barangay}</td>
                  <td
                    className={`px-2 sm:px-4 py-2 font-medium ${
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
                    className={`px-2 sm:px-4 py-2 font-medium ${
                      row.rfidStatus === "Bound"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {row.rfidStatus}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-mono">
                    {row.rfidCode}
                  </td>
                  <td className="px-2 sm:px-4 py-2">{row.pensionReceived}</td>
                  <td className="px-2 sm:px-4 py-2">{row.missed}</td>
                  <td className="px-2 sm:px-4 py-2">{row.lastClaim}</td>
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
