import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dswdlogo from "../../assets/dswd-logo.png";

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
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
  return dateStr;
};

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
  const [sortOrder, setSortOrder] = useState("asc");
  const [quarterFilter, setQuarterFilter] = useState("All");

  // Fetch data
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
        const rfidInfo = Object.values(rfidData).find(
          (r) => r.seniorId === value.seniorId
        );
        const age = computeAge(value.dateOfBirth);
        const lastClaimFormatted = rfidInfo?.lastClaimDate
          ? formatDate(rfidInfo.lastClaimDate)
          : "Never";
        const quarter = determineQuarter(rfidInfo?.lastClaimDate);
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
          rfidStatus: rfidInfo ? "Bound" : "Unbound",
          rfidCode: rfidInfo?.rfidCode || "-",
          missed: rfidInfo?.missedConsecutive ?? 0,
          lastClaim: lastClaimFormatted,
          quarter,
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
      if (rfidSnapData) handleData(seniorsSnapData, rfidSnapData);
    });
    const unsubRfid = onValue(rfidRef, (snap) => {
      rfidSnapData = snap;
      if (seniorsSnapData) handleData(seniorsSnapData, rfidSnapData);
    });
    return () => {
      unsubSeniors();
      unsubRfid();
    };
  }, []);

  // Filtering
  useEffect(() => {
    if (loading) return;
    let data =
      activeTab === "overall"
        ? records.overall
        : activeTab === "pensioners"
        ? records.pensioners
        : activeTab === "pending"
        ? records.pending
        : records.members;
    let filtered = [...data];
    if (search.trim()) {
      filtered = filtered.filter((r) =>
        `${r.seniorId} ${r.surname}, ${r.firstName} ${r.middleName} ${r.extName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    if (barangayFilter !== "All")
      filtered = filtered.filter(
        (r) => r.barangay?.toLowerCase() === barangayFilter.toLowerCase()
      );
    if (statusFilter !== "All" && activeTab === "overall")
      filtered = filtered.filter(
        (r) => (r.status || "Active").toLowerCase() === statusFilter.toLowerCase()
      );
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
    filtered.sort((a, b) => {
      const nameA = `${a.surname} ${a.firstName}`.toLowerCase();
      const nameB = `${b.surname} ${b.firstName}`.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
    setFilteredRecords(filtered);
  }, [
    search,
    barangayFilter,
    statusFilter,
    ageFilter,
    activeTab,
    records,
    sortOrder,
    loading,
  ]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All");
    setStatusFilter("All");
    setAgeFilter("All");
    setActiveTab("overall");
    setSortOrder("asc");
  };
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  // ✅ Excel Report
  const generateReport = async () => {
    let eligibleBound = records.overall.filter(
      (r) => r.status === "Eligible" && r.rfidStatus === "Bound"
    );

    if (quarterFilter !== "All") {
      eligibleBound = eligibleBound.filter((r) => r.quarter === quarterFilter);
    }

    if (eligibleBound.length === 0) {
      alert(
        quarterFilter === "All"
          ? "No eligible and bound records found."
          : `No records found for ${quarterFilter}.`
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `${quarterFilter === "All" ? "All Quarters" : quarterFilter} Pensioners`
    );

    worksheet.columns = Array(11)
      .fill()
      .map(() => ({ width: 18 }));

    const response = await fetch(dswdlogo);
    const imageBuffer = await response.arrayBuffer();
    const imageId = workbook.addImage({ buffer: imageBuffer, extension: "png" });
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

    worksheet.addRow([]);
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
    headerRow.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E75B6" },
      };
      c.alignment = { vertical: "middle", horizontal: "center" };
    });

    eligibleBound.forEach((r) =>
      worksheet.addRow([
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
      ])
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split("T")[0];
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Pensioners_Report_${quarterFilter}_${today}.xlsx`
    );
  };

  // ✅ Print Report
  const printReport = () => {
    let eligibleBound = records.overall.filter(
      (r) => r.status === "Eligible" && r.rfidStatus === "Bound"
    );
    if (quarterFilter !== "All") {
      eligibleBound = eligibleBound.filter((r) => r.quarter === quarterFilter);
    }
    if (eligibleBound.length === 0) {
      alert(
        quarterFilter === "All"
          ? "No eligible and bound records found to print."
          : `No records found for ${quarterFilter}.`
      );
      return;
    }

    const printWindow = window.open("", "_blank");
    const today = new Date().toLocaleDateString();
    const tableRows = eligibleBound
      .map(
        (r) => `
        <tr>
          <td>${r.seniorId}</td>
          <td>${r.surname}, ${r.firstName} ${r.middleName || ""} ${
          r.extName || ""
        }</td>
          <td>${r.birthday}</td>
          <td>${r.age}</td>
          <td>${r.barangay}</td>
          <td>${r.status}</td>
          <td>${r.rfidStatus}</td>
          <td>${r.rfidCode}</td>
          <td>${r.quarter}</td>
          <td>${r.missed}</td>
          <td>${r.lastClaim}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Printable Pensioners Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h3 { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #444; padding: 6px; font-size: 12px; text-align: center; }
            th { background-color: #2E75B6; color: white; }
            img { display: block; margin: 0 auto 10px; height: 80px; }
          </style>
        </head>
        <body>
          <img src="${dswdlogo}" alt="DSWD Logo" />
          <h1>Department of Social Welfare and Development</h1>
          <h3>Pensioners Report - ${
            quarterFilter === "All" ? "All Quarters" : quarterFilter
          }</h3>
          <p><strong>Date:</strong> ${today}</p>
          <table>
            <thead>
              <tr>
                <th>ID Number</th>
                <th>Name</th>
                <th>Birthday</th>
                <th>Age</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>RFID Status</th>
                <th>RFID Code</th>
                <th>Quarter</th>
                <th>Missed</th>
                <th>Last Claim</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  

  const [reportType, setReportType] = useState("overall");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

//  Generate report based on selected type (overall, pensioners, members, pending)
const generateOverallReport = async () => {
  let selectedData = records[reportType] || [];

  // ✅ Optional Date Range Filtering
  if (startDate || endDate) {
    selectedData = selectedData.filter((r) => {
      if (!r.lastClaim || r.lastClaim === "Never") return false;

      const date = new Date(r.lastClaim);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) return date >= start && date <= end;
      if (start) return date >= start;
      if (end) return date <= end;
      return true;
    });

    if (selectedData.length === 0) {
      alert("No records found within the selected date range.");
      return;
    }
  }

  if (selectedData.length === 0) {
    alert(`No records found for ${reportType} report.`);
    return;
  }

  // ✅ Excel Workbook setup
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
  );

  worksheet.columns = Array(10)
    .fill()
    .map(() => ({ width: 18 }));

  // ✅ Add logo
  const response = await fetch(dswdlogo);
  const imageBuffer = await response.arrayBuffer();
  const imageId = workbook.addImage({ buffer: imageBuffer, extension: "png" });
  worksheet.addImage(imageId, {
    tl: { col: 2.5, row: 0.5 },
    ext: { width: 100, height: 100 },
  });

  // ✅ Header Title
  worksheet.mergeCells("C2", "H2");
  worksheet.getCell("C2").value =
    "Department of Social Welfare and Development";
  worksheet.getCell("C2").font = { size: 16, bold: true };
  worksheet.getCell("C2").alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  worksheet.addRow([]);
  worksheet.addRow([]);
  worksheet.addRow([]);

  // ✅ Table Headers
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
    "Last Claim",
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7030A0" },
    };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });
  let eligibleBound = records.overall.filter(
      (r) => r.status === "Eligible" && r.rfidStatus === "Bound"
    );
    if (quarterFilter !== "All") {
      eligibleBound = eligibleBound.filter((r) => r.quarter === quarterFilter);
    }
    if (eligibleBound.length === 0) {
      alert(
        quarterFilter === "All"
          ? "No eligible and bound records found to print."
          : `No records found for ${quarterFilter}.`
      );
      return;
    }

  // ✅ Add Data Rows
  selectedData.forEach((r) =>
    worksheet.addRow([
      r.seniorId,
      `${r.surname}, ${r.firstName} ${r.middleName || ""} ${r.extName || ""}`,
      r.birthday,
      r.age,
      r.barangay,
      r.status,
      r.rfidStatus,
      r.rfidCode,
      r.quarter,
      r.lastClaim,
    ])
  );

  // ✅ Save Excel File
  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().split("T")[0];
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${reportType}_Report_${today}.xlsx`
  );

  alert(
    `Generated ${selectedData.length} records ${
      startDate || endDate ? "within the selected date range" : ""
    }.`
  );
};

// Helper: check if a record date (string) is inside the selected range
const isWithinDateRange = (recordDate) => {
  // if no date filter selected -> include all
  if (!startDate && !endDate) return true;

  // if recordDate is "Never" or falsy, treat as excluded
  if (!recordDate || recordDate === "Never") return false;

  const date = new Date(recordDate);
  if (isNaN(date.getTime())) return false;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && end) return date >= start && date <= end;
  if (start) return date >= start;
  if (end) return date <= end;
  return true;
};


//  Function: Filter and generate report by date range
// const generateDateRangeReport = async () => {
//   if (!startDate && !endDate) {
//     alert("Please select a start or end date.");
//     return;
//   }

//   // Example: Filter your data source based on date
//   const filtered = records.overall.filter((r) => {
//     if (!r.lastClaim || r.lastClaim === "Never") return false;

//     const date = new Date(r.lastClaim);
//     const start = startDate ? new Date(startDate) : null;
//     const end = endDate ? new Date(endDate) : null;

//     if (start && end) return date >= start && date <= end;
//     if (start) return date >= start;
//     if (end) return date <= end;
//     return true;
//   });

//   if (filtered.length === 0) {
//     alert("No records found within the selected date range.");
//     return;
//   }

//   // 🧾 Optional: export to Excel or print (replace with your existing logic)
//   console.log("Filtered Data:", filtered);
//   alert(`Generated ${filtered.length} records within the selected date range.`);
// };

  //  Responsive UI
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow px-6 py-4 rounded-lg gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Masterlist</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Senior Citizens Records
          </p>
        </div>

           {/*  Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-1">From</label>
          <input
            type="date"
            className="border px-3 py-2 rounded-md text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-1">To</label>
          <input
            type="date"
            className="border px-3 py-2 rounded-md text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {/* <button
          onClick={generateDateRangeReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow text-sm sm:self-end"
        >
          Generate Date Range Report
        </button> */}
      </div>

      {/*  Report Type */}
      <div className="flex flex-col">
        <label className="text-gray-600 text-sm font-medium mb-1">Report Type</label>
        <select
          className="border px-3 py-2 rounded-md text-sm"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="overall">Overall List</option>
          <option value="pensioners">Pensioners</option>
          <option value="members">Members</option>
          <option value="pending">New Applicants</option>
        </select>
      </div>

      {/*  Quarter Filter */}
      <div className="flex flex-col">
        <label className="text-gray-600 text-sm font-medium mb-1">Quarter</label>
        <select
          className="border px-3 py-2 rounded-md text-sm"
          value={quarterFilter}
          onChange={(e) => setQuarterFilter(e.target.value)}
        >
          <option value="All">All Quarters</option>
          <option value="1st Quarter">1st Quarter</option>
          <option value="2nd Quarter">2nd Quarter</option>
          <option value="3rd Quarter">3rd Quarter</option>
          <option value="4th Quarter">4th Quarter</option>
        </select>
      </div>

      {/*  Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
        <button
          onClick={printReport}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium shadow text-sm"
        >
          Print Report
        </button>

        <button
          onClick={generateOverallReport}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium shadow text-sm"
        >
          Generate Type Report
        </button>
      </div>
    </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow p-4 rounded-lg flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-full sm:w-64"
        />
        <select
          className="border px-3 py-2 rounded-md w-full sm:w-auto"
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
        >
          <option value="All">All Barangays</option>
          {barangays.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        {activeTab === "overall" && (
          <>
            <select
              className="border px-3 py-2 rounded-md w-full sm:w-auto"
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
              className="border px-3 py-2 rounded-md w-full sm:w-auto"
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
          className="border border-gray-400 px-3 py-2 rounded-md hover:bg-gray-100 w-full sm:w-auto"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap">
        {[
          { key: "overall", label: "Overall List" },
          { key: "pensioners", label: "Pensioners" },
          { key: "members", label: "Members" },
          { key: "pending", label: "New Applicant" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base rounded-t-lg font-semibold ${
              activeTab === tab.key
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Records Table (same as before) */}
      <div className="shadow border border-gray-200 rounded-b-lg bg-white">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No records found.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">ID Number</th>
                    <th
                      className="px-4 py-2 cursor-pointer select-none"
                      onClick={toggleSortOrder}
                    >
                      Name{" "}
                      <span className="text-gray-500 text-xs">
                        ({sortOrder === "asc" ? "A–Z" : "Z–A"})
                      </span>
                    </th>
                    <th className="px-4 py-2">Birthday</th>
                    <th className="px-4 py-2">Age</th>
                    <th className="px-4 py-2">Barangay</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">RFID</th>
                    <th className="px-4 py-2">Quarter</th>
                    <th className="px-4 py-2">Missed</th>
                    <th className="px-4 py-2">Last Claim</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-gray-50 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-2">{r.seniorId}</td>
                      <td className="px-4 py-2">
                        {r.surname}, {r.firstName} {r.middleName} {r.extName}
                      </td>
                      <td className="px-4 py-2">{r.birthday}</td>
                      <td className="px-4 py-2 text-center">{r.age}</td>
                      <td className="px-4 py-2">{r.barangay}</td>
                      <td
                        className={`px-4 py-2 font-medium ${
                          r.status === "Eligible"
                            ? "text-green-600"
                            : r.status === "Pending"
                            ? "text-yellow-600"
                            : r.status === "Removed"
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                      >
                        {r.status}
                      </td>
                      <td
                        className={`px-4 py-2 ${
                          r.rfidStatus === "Bound"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.rfidCode}
                      </td>
                      <td className="px-4 py-2">{r.quarter}</td>
                      <td className="px-4 py-2 text-center">{r.missed}</td>
                      <td className="px-4 py-2">{r.lastClaim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-3 p-3">
              {filteredRecords.map((r, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2"
                >
                  <div className="font-bold text-lg text-gray-800">
                    {r.surname}, {r.firstName}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>ID:</strong> {r.seniorId}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Barangay:</strong> {r.barangay}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Age:</strong> {r.age}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-medium ${
                        r.status === "Eligible"
                          ? "text-green-600"
                          : r.status === "Pending"
                          ? "text-yellow-600"
                          : "text-gray-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>RFID:</strong>{" "}
                    <span
                      className={`${
                        r.rfidStatus === "Bound"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {r.rfidCode}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last Claim: {r.lastClaim} | {r.quarter}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Masterlist;
