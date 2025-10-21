import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import logo from "../../assets/Talisay-Logo.png"; // ✅ logo import

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

  // ✅ Fetch data
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
      const pending = seniorsArray.filter((row) => row.status === "Pending");
      const members = seniorsArray.filter((row) => row.status === "Member");

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

  // ✅ Filters
  useEffect(() => {
    if (loading) return;

    let sourceData;
    if (activeTab === "overall") sourceData = records.overall;
    else if (activeTab === "pensioners") sourceData = records.pensioners;
    else if (activeTab === "pending") sourceData = records.pending;
    else sourceData = records.members;

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

  // ✅ Generate Excel Report (same as before)
  const generateReport = async () => {
    const eligibleBound = records.overall.filter(
      (row) => row.status === "Eligible" && row.rfidStatus === "Bound"
    );

    if (eligibleBound.length === 0) {
      alert("No eligible and bound records found.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Eligible Pensioners");

    worksheet.columns = Array(9)
      .fill()
      .map(() => ({ width: 18 }));

    const response = await fetch(logo);
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
    const titleCell = worksheet.getCell("C2");
    titleCell.value = "Municipality of Talisay - Senior Citizen Office";
    titleCell.font = { size: 16, bold: true, color: { argb: "FF1F497D" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("C3", "H3");
    const subCell = worksheet.getCell("C3");
    subCell.value = "Eligible Pensioners Report";
    subCell.font = { size: 13, bold: true };
    subCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("C4", "H4");
    const dateCell = worksheet.getCell("C4");
    dateCell.value = `Generated on: ${new Date().toLocaleDateString()}`;
    dateCell.font = { italic: true, size: 11, color: { argb: "FF555555" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.addRow([]);
    worksheet.addRow([]);

    const headers = [
      "Name",
      "Birthday",
      "Barangay",
      "Status",
      "RFID Status",
      "RFID Code",
      "Pension Received",
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
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    eligibleBound.forEach((row) => {
      const dataRow = worksheet.addRow([
        `${row.surname}, ${row.firstName} ${row.middleName || ""} ${
          row.extName || ""
        }`,
        row.birthday,
        row.barangay,
        row.status,
        row.rfidStatus,
        row.rfidCode,
        row.pensionReceived,
        row.missed,
        row.lastClaim,
      ]);

      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    worksheet.addRow([]);
    worksheet.addRow([]);
    const footer = worksheet.addRow(["Generated by Talisay SDO System"]);
    footer.getCell(1).font = { italic: true, color: { argb: "FF888888" } };

    const today = new Date().toISOString().split("T")[0];
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Eligible_Pensioners_Report_${today}.xlsx`
    );
  };

  // ✅ JSX Layout
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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

      <div className="mt-4 bg-white shadow p-4 rounded-lg flex flex-wrap gap-3 items-center">
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
            <option value="Pending">Pending</option>
            <option value="Member">Member</option>
          </select>
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
          onClick={() => setActiveTab("members")}
          className={`px-6 py-2 rounded-t-lg font-semibold ${
            activeTab === "members"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-2 rounded-t-lg font-semibold ${
            activeTab === "pending"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending
        </button>
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
                <tr key={row.id || idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {row.surname}, {row.firstName} {row.middleName || ""}{" "}
                    {row.extName || ""}
                  </td>
                  <td className="px-4 py-2">{row.birthday}</td>
                  <td className="px-4 py-2">{row.barangay}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      row.status === "Eligible"
                        ? "text-green-600"
                        : row.status === "Active"
                        ? "text-blue-600"
                        : row.status === "Pending"
                        ? "text-yellow-600"
                        : row.status === "Member"
                        ? "text-purple-600"
                        : "text-red-600"
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
                  <td className="px-4 py-2 font-mono text-gray-700">
                    {row.rfidCode}
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
