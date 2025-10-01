import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase"; // ✅ Firebase RTDB
import { ref, onValue, off } from "firebase/database";

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

// ✅ Normalize names
const normalizeName = (first, middle, surname, extName = "") => {
  return `${(first || "").trim()} ${(middle || "").trim()} ${(surname || "").trim()} ${(extName || "").trim()}`
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ✅ Format date (handles Jul-28-1953 style)
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

    // fallback manual parsing for "MMM-DD-YYYY"
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${month} ${day}, ${year}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
};

// ✅ Merge function
const mergeData = (masterData, eligibleData, rfidData) => {
  const eligibleMap = eligibleData.map((e) => ({
    ...e,
    normName: normalizeName(e.firstName, e.middleName, e.surname, e.extName),
  }));

  const mergedOverall = masterData.map((person) => {
    const normMaster = normalizeName(
      person.firstName,
      person.middleName,
      person.surname,
      person.extName
    );

    const isEligible = eligibleMap.some((e) => e.normName === normMaster);
    const rfidMatch = rfidData.find((r) => r.normName === normMaster);

    return {
      ...person,
      status: isEligible ? "Eligible" : (person.status || "Active"),
      rfidStatus: rfidMatch?.status || "Not Bound",
      rfidCode: rfidMatch?.rfidCode || "-",
      pensionReceived: rfidMatch?.pensionReceived ? "Yes" : "No",
      missed: rfidMatch?.missedConsecutive ?? 0,
      lastClaim: rfidMatch?.lastClaimDate
        ? formatDate(rfidMatch.lastClaimDate)
        : "Never",
      birthday: person.birthDate ? formatDate(person.birthDate) : "-", // ✅ Corrected field
    };
  });

  const pensionersOnly = mergedOverall.filter(
    (row) => row.status === "Eligible"
  );

  return { overall: mergedOverall, pensioners: pensionersOnly };
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
    const masterRef = ref(rtdb, "masterlist");
    const eligibleRef = ref(rtdb, "eligible");
    const rfidBindingsRef = ref(rtdb, "rfidBindings");

    let masterData = [];
    let eligibleData = [];
    let rfidData = [];

    const update = () => {
      const merged = mergeData(masterData, eligibleData, rfidData);
      setRecords(merged);
      setFilteredRecords(merged.overall);
      setLoading(false);
    };

    const handleMaster = onValue(masterRef, (snapshot) => {
      masterData = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }))
        : [];
      update();
    });

    const handleEligible = onValue(eligibleRef, (snapshot) => {
      eligibleData = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }))
        : [];
      update();
    });

    const handleRfid = onValue(rfidBindingsRef, (snapshot) => {
      rfidData = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...data,
            normName: normalizeName(
              data.firstName,
              data.middleName,
              data.surname,
              data.extName
            ),
          }))
        : [];
      update();
    });

    return () => {
      off(masterRef, "value", handleMaster);
      off(eligibleRef, "value", handleEligible);
      off(rfidBindingsRef, "value", handleRfid);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    let sourceData =
      activeTab === "overall" ? records.overall || [] : records.pensioners || [];

    let filtered = [...sourceData];

    if (search.trim() !== "") {
      filtered = filtered.filter((row) => {
        const fullName = normalizeName(
          row.firstName,
          row.middleName,
          row.surname,
          row.extName
        );
        return fullName.includes(search.toLowerCase());
      });
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
    <div className="p-6">
      <h1 className="text-2xl font-bold">Masterlist</h1>
      <p className="text-gray-600">Official Validated Senior Citizens</p>

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
                <tr key={row.id || idx} className="border-t">
                  <td className="px-4 py-2">
                    {row.surname}, {row.firstName} {row.middleName || ""}{" "}
                    {row.extName || ""}
                  </td>
                  <td className="px-4 py-2">{row.birthday}</td>
                  <td className="px-4 py-2">{row.barangay || "-"}</td>
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
                  <td className="px-4 py-2 font-mono">
                    {row.rfidCode || "-"}
                  </td>
                  <td>{row.pensionReceived}</td>
                  <td>{row.missed}</td>
                  <td>{row.lastClaim}</td>
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
