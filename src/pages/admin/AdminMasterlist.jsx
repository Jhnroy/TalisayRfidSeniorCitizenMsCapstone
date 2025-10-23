import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dswdlogo from "../../assets/dswd-logo.png"; // ✅ logo import

// Barangay List
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

// ✅ Format date
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
const computeAge = (birthdate) => {
  if (!birthdate || birthdate === "Never") return "-";
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ✅ Determine quarter based on last claim month
const determineQuarter = (lastClaimDate) => {
  if (!lastClaimDate || lastClaimDate === "Never") return "No Claim Yet";
  const date = new Date(lastClaimDate);
  if (isNaN(date.getTime())) return "Invalid Date";
  const month = date.getMonth() + 1;
  if (month >= 1 && month <= 3) return "1st Quarter";
  if (month >= 4 && month <= 6) return "2nd Quarter";
  if (month >= 7 && month <= 9) return "3rd Quarter";
  return "4th Quarter";
};

const Masterlist = () => {
  const [activeTab, setActiveTab] = useState("overall");
  const [records, setRecords] = useState({
    overall: [],
    pensioners: [],
    pending: [],
    members: [],
  });
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  // ✅ Fetch data from Firebase
  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const rfidRef = ref(rtdb, "rfidBindings");

    let seniorsSnapData = null;
    let rfidSnapData = null;

    const handleData = (seniorsSnap, rfidSnap) => {
      if (!seniorsSnap.exists()) {
        setRecords({ overall: [], pensioners: [], pending: [], members: [] });
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

        const age = computeAge(value.dateOfBirth);
        const lastClaimFormatted = rfidInfo.lastClaimDate
          ? formatDate(rfidInfo.lastClaimDate)
          : "Never";
        const quarter = determineQuarter(rfidInfo.lastClaimDate);

        return {
          id,
          seniorId: value.seniorId || "-",
          surname: value.lastName || "",
          firstName: value.firstName || "",
          middleName: value.middleName || "",
          extName: value.extName || "",
          barangay: value.barangay || "-",
          birthday: formatDate(value.dateOfBirth),
          age,
          status: value.status || "Pending",
          validated: value.validated || false,
          rfidStatus: rfidInfo.status || "Not Bound",
          rfidCode: rfidInfo.rfidCode || "-",
          missed: rfidInfo.missedConsecutive ?? 0,
          lastClaim: lastClaimFormatted,
          quarter: quarter,
        };
      });

      const overall = seniorsArray;
      const pensioners = seniorsArray.filter((r) => r.status === "Eligible");
      const pending = seniorsArray.filter(
        (r) => r.status === "Pending" && !r.validated
      );
      const members = seniorsArray.filter((r) => r.status === "Active");

      setRecords({ overall, pensioners, pending, members });
      setFilteredRecords(overall);
      setLoading(false);
    };

    const unsubSeniors = onValue(seniorsRef, (snap) => {
      seniorsSnapData = snap;
      if (seniorsSnapData && rfidSnapData)
        handleData(seniorsSnapData, rfidSnapData);
    });

    const unsubRfid = onValue(rfidRef, (snap) => {
      rfidSnapData = snap;
      if (seniorsSnapData && rfidSnapData)
        handleData(seniorsSnapData, rfidSnapData);
    });

    return () => {
      unsubSeniors();
      unsubRfid();
    };
  }, []);

  // ✅ Apply filters
  useEffect(() => {
    if (loading) return;

    let data;
    if (activeTab === "overall") data = records.overall;
    else if (activeTab === "pensioners") data = records.pensioners;
    else if (activeTab === "pending") data = records.pending;
    else data = records.members;

    let filtered = [...data];

    if (search.trim()) {
      filtered = filtered.filter(
        (r) =>
          `${r.seniorId} ${r.surname}, ${r.firstName} ${r.middleName} ${r.extName}`
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (barangayFilter !== "All") {
      filtered = filtered.filter(
        (r) => r.barangay?.toLowerCase() === barangayFilter.toLowerCase()
      );
    }

    if (statusFilter !== "All" && activeTab === "overall") {
      filtered = filtered.filter(
        (r) => (r.status || "Active").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (ageFilter !== "All") {
      filtered = filtered.filter((r) => {
        if (r.age === "-" || isNaN(r.age)) return false;
        const age = parseInt(r.age);
        if (ageFilter === "60–69") return age >= 60 && age <= 69;
        if (ageFilter === "70–79") return age >= 70 && age <= 79;
        if (ageFilter === "80–89") return age >= 80 && age <= 89;
        if (ageFilter === "90+") return age >= 90;
        return true;
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

  // ✅ Generate Excel Report (with Quarter)
  const generateReport = async () => {
    const eligibleBound = records.overall.filter(
      (r) => r.status === "Eligible" && r.rfidStatus === "Bound"
    );

    if (eligibleBound.length === 0) {
      alert("No eligible and bound records found.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quarterly Pensioners Report");

    worksheet.columns = Array(11)
      .fill()
      .map(() => ({ width: 18 }));

    const response = await fetch(dswdlogo);
    const imageBuffer = await response.arrayBuffer();
    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png",
    });

    worksheet.addImage(imageId, {
      tl: { col: 2.5, row: 0.5 },
      ext: { width: 100, height: 100 },
    });

    worksheet.mergeCells("C2", "H2");
    worksheet.getCell("C2").value =
      "Department of Social Welfare and Development";
    worksheet.getCell("C2").font = { size: 16, bold: true };
    worksheet.getCell("C2").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.mergeCells("C3", "H3");
    worksheet.getCell("C3").value = "Regional Field Office V";
    worksheet.getCell("C3").font = { size: 13, bold: true };
    worksheet.getCell("C3").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.mergeCells("C4", "H4");
    worksheet.getCell("C4").value = `Generated on: ${new Date().toLocaleDateString()}`;
    worksheet.getCell("C4").font = { italic: true, size: 11 };
    worksheet.getCell("C4").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.addRow([]);
    worksheet.addRow([]);

    const headers = [
      "ID Number",
      "Name",
      "Birthday",
      "Age",
      "Barangay",
      "Status",
      "RFID Status",
      "RFID Code",
      "Quarter",
      "Missed Consecutive",
      "Last Claim Date",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E75B6" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    eligibleBound.forEach((r) => {
      const dataRow = worksheet.addRow([
        r.seniorId,
        `${r.surname}, ${r.firstName} ${r.middleName || ""} ${r.extName || ""}`,
        r.birthday,
        r.age,
        r.barangay,
        r.status,
        r.rfidStatus,
        r.rfidCode,
        r.quarter,
        r.missed,
        r.lastClaim,
      ]);

      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    worksheet.addRow([]);
    worksheet.addRow(["Generated by Talisay SDO System"]).getCell(1).font = {
      italic: true,
      color: { argb: "FF888888" },
    };

    const today = new Date().toISOString().split("T")[0];
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Quarterly_Pensioners_Report_${today}.xlsx`
    );
  };

  // ✅ UI
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white shadow px-6 py-4 rounded-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Masterlist</h1>
          <p className="text-gray-600">Senior Citizens Records</p>
        </div>
        <button
          onClick={generateReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow"
        >
          Generate Excel Report
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow p-4 rounded-lg flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by ID or name..."
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
          <>
            <select
              className="border px-3 py-2 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Active">Active</option>
              <option value="Removed">Removed</option>
              <option value="Pending">Pending</option>
              <option value="Member">Member</option>
            </select>

            <select
              className="border px-3 py-2 rounded-md"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="All">All Ages</option>
              <option value="60–69">60–69</option>
              <option value="70–79">70–79</option>
              <option value="80–89">80–89</option>
              <option value="90+">90+</option>
            </select>
          </>
        )}
        <button
          className="border border-gray-400 px-3 py-2 rounded-md hover:bg-gray-100"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex">
        {[
          { key: "overall", label: "Overall List" },
          { key: "pensioners", label: "Pensioners" },
          { key: "members", label: "Members" },
          { key: "pending", label: "New Applicant" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2 rounded-t-lg font-semibold ${
              activeTab === tab.key
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-b-lg bg-white">
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
                <th className="px-4 py-2">Quarter Claim</th>
                <th className="px-4 py-2">Missed Consecutive</th>
                <th className="px-4 py-2">Last Claim Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, i) => (
                <tr key={r.id || i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-700">
                    {r.seniorId}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {r.surname}, {r.firstName} {r.middleName || ""}{" "}
                    {r.extName || ""}
                  </td>
                  <td className="px-4 py-2">{r.birthday}</td>
                  <td className="px-4 py-2 text-center">{r.age}</td>
                  <td className="px-4 py-2">{r.barangay}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      r.status === "Eligible"
                        ? "text-green-600"
                        : r.status === "Active"
                        ? "text-blue-600"
                        : r.status === "Pending"
                        ? "text-yellow-600"
                        : r.status === "Member"
                        ? "text-purple-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.status}
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      r.rfidStatus === "Bound"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.rfidStatus}
                  </td>
                  <td className="px-4 py-2 text-center">{r.rfidCode}</td>
                  <td className="px-4 py-2 text-center font-semibold text-blue-600">
                    {r.quarter}
                  </td>
                  <td className="px-4 py-2 text-center">{r.missed}</td>
                  <td className="px-4 py-2 text-center">{r.lastClaim}</td>
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
