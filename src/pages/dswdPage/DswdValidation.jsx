import React, { useState, useEffect } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, update, get, push } from "firebase/database";
import {
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCircle,
  FaTimes,
} from "react-icons/fa";

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

// Utility: Format Dates
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

// Utility: Calculate Age
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
  const [documentModal, setDocumentModal] = useState({
    show: false,
    url: "",
    title: "",
  });

  //  Fetch and Merge Data from Firebase
  useEffect(() => {
    console.log("🔍 Initializing Firebase Realtime Database fetch...");
    const seniorsRef = ref(rtdb, "senior_citizens");
    const rfidRef = ref(rtdb, "rfidBindings");

    let seniorsData = {};
    let rfidData = {};

    const fetchPensions = async (senior) => {
      const pensions = [];
      try {
        const pensionRef = ref(rtdb, `pensionAgencies/${senior.seniorId}`);
        const snapshot = await get(pensionRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.values(data).forEach((p) => {
            pensions.push({
              pensionSource: p.pensionSource ?? "",
              monthlyIncome: p.monthlyIncome ?? 0,
              monthlyPension: p.monthlyPension ?? 0,
              occupation: p.occupation ?? "N/A",
            });
          });
        }

        if (
          senior.monthlyPension &&
          Number(senior.monthlyPension) > 0 &&
          pensions.length === 0
        ) {
          pensions.push({
            pensionSource: senior.pensionSource || "",
            monthlyIncome: senior.monthlyIncome || 0,
            monthlyPension: senior.monthlyPension || 0,
            occupation: senior.occupation || "N/A",
          });
        }
      } catch (error) {
        console.error("❌ Error fetching pensions:", error);
      }
      return pensions;
    };

    const mergeAndSet = async () => {
      console.log("⚙️ Merging data...");
      const seniorsArray = await Promise.all(
        Object.entries(seniorsData).map(async ([id, value]) => {
          const rfidInfo =
            Object.values(rfidData).find((r) => r.seniorId === value.seniorId) || {};

          const pensions = await fetchPensions(value);
          const suffix = value.suffix ? ` ${value.suffix}` : "";

          return {
            id,
            seniorId: value.seniorId || "",
            name: `${value.lastName || ""}, ${value.firstName || ""} ${value.middleName || ""}${suffix}`.trim(),
            barangay: value.barangay || "-",
            birthday: value.dateOfBirth || "",
            age: getAge(value.dateOfBirth),
            eligibility: value.status || "Pending",
            registrationDate: formatDate(value.createdAt) || "N/A",
            rfid: rfidInfo.rfidCode ? "Yes" : "No",
            validationStatus: value.status || "Pending",
            rfidCode: rfidInfo.rfidCode || "-",
            birthCertificate: value.birthCertificate || null,
            barangayCertificate: value.barangayCertificate || null,
            profilePicture: value.profilePicture || null,
            hasPension: pensions.length > 0,
            pensions,
          };
        })
      );

      console.log("✅ Seniors Loaded:", seniorsArray.length);
      setRecords(seniorsArray);
      setFilteredData(seniorsArray);
      setLoading(false);
    };

    const unsubSeniors = onValue(seniorsRef, (snap) => {
      seniorsData = snap.exists() ? snap.val() : {};
      console.log("📥 Seniors Data Fetched:", Object.keys(seniorsData).length);
      mergeAndSet();
    });

    const unsubRfid = onValue(rfidRef, (snap) => {
      rfidData = snap.exists() ? snap.val() : {};
      console.log("📡 RFID Data Fetched:", Object.keys(rfidData).length);
      mergeAndSet();
    });

    return () => {
      console.log("🧹 Cleaning up listeners...");
      unsubSeniors();
      unsubRfid();
    };
  }, []);

  //  Filtering Logic
  useEffect(() => {
    if (loading) return;
    console.log(" Applying filters...");
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

    console.log(" Filtered Data:", data.length);
    setFilteredData(data);
  }, [search, barangayFilter, statusFilter, records, loading]);

  // Reset Filters
  const resetFilters = () => {
    console.log(" Resetting filters...");
    setSearch("");
    setBarangayFilter("All Barangays");
    setStatusFilter("All Statuses");
  };

  //  Validation Action
  const handleValidation = async (status) => {
    if (!selectedRecord) return;

    if (selectedRecord.hasPension && status === "Eligible") {
      alert("❌ This senior already has an existing pension and cannot be marked as Eligible.");
      return;
    }

    try {
      console.log(`📝 Updating status to ${status} for`, selectedRecord.seniorId);
      const recordRef = ref(rtdb, `senior_citizens/${selectedRecord.id}`);
      await update(recordRef, {
        status,
        lastUpdated: new Date().toISOString(),
      });

      const notifRef = ref(rtdb, `notifications/${selectedRecord.barangay}`);
      await push(notifRef, {
        message: `Senior ${selectedRecord.name} has been marked as ${status} by DSWD.`,
        read: false,
        timestamp: new Date().toISOString(),
        type: status === "Eligible" ? "success" : "info",
      });

      alert(` Successfully marked as ${status}.`);
      setSelectedRecord(null);
    } catch (error) {
      console.error("❌ Failed to update record:", error);
      alert("Failed to update record.");
    }
  };

  // 🔍 Document Modal Controls
  const openDocumentModal = (url, title) => {
    console.log(" Opening Document:", title, url);
    setDocumentModal({ show: true, url, title });
  };

  const closeDocumentModal = () => {
    console.log(" Closing Document Modal");
    setDocumentModal({ show: false, url: "", title: "" });
  };

  //  Render UI
  return (
    <div className="p-4 w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-1">Validation</h2>
      <p className="text-gray-500 mb-4">Validation of Senior Citizen Records</p>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-start md:items-center">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 w-full md:w-1/3"
        />
        <select
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg w-full md:w-1/4"
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
          className="px-3 py-2 border border-gray-300 rounded-lg w-full md:w-1/4"
        >
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Active</option>
          <option>Eligible</option>
          <option>Removed</option>
        </select>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="p-4 text-center text-gray-500 animate-pulse">
            ⏳ Loading records from Firebase...
          </p>
        ) : filteredData.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No matching records found.</p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b">ID Number</th>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Barangay</th>
                <th className="px-4 py-2 border-b">Age</th>
                <th className="px-4 py-2 border-b">Eligibility</th>
                <th className="px-4 py-2 border-b">Registration Date</th>
                <th className="px-4 py-2 border-b">RFID</th>
                <th className="px-4 py-2 border-b">Validation Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className={`cursor-pointer ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                  onClick={() => setSelectedRecord(item)}
                >
                  <td className="px-4 py-2">{item.seniorId}</td>
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
                  <td
                    className={`px-4 py-2 font-semibold ${
                      item.validationStatus === "Eligible"
                        ? "text-green-600"
                        : item.validationStatus === "Active"
                        ? "text-blue-600"
                        : "text-orange-500"
                    }`}
                  >
                    {item.validationStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Validation Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-20">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>

            <div className="flex flex-col items-center mb-4">
              {selectedRecord.profilePicture ? (
                <img
                  src={selectedRecord.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                />
              ) : (
                <FaUserCircle className="text-gray-400 text-7xl" />
              )}
            </div>

            <h2 className="text-lg font-bold mb-4 text-center">
              Validate Senior
            </h2>

            <p><strong>ID:</strong> {selectedRecord.seniorId}</p>
            <p><strong>Name:</strong> {selectedRecord.name}</p>
            <p><strong>Barangay:</strong> {selectedRecord.barangay}</p>
            <p><strong>Age:</strong> {selectedRecord.age}</p>

            {/* Pension Section */}
            {selectedRecord.hasPension && (
              <div className="text-red-600 mt-3 space-y-2 font-semibold">
                <p>This senior already has a pension:</p>
                {selectedRecord.pensions.map((p, i) => (
                  <div key={i} className="pl-2">
                    <p>• Pension Source: {p.pensionSource}</p>
                    <p>• Monthly Income: ₱{Number(p.monthlyIncome).toLocaleString()}</p>
                    <p>• Monthly Pension: ₱{Number(p.monthlyPension).toLocaleString()}</p>
                    <p>• Occupation: {p.occupation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Certificates */}
            <div className="mt-5 space-y-3 border-t border-gray-200 pt-3">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaFileAlt className="text-blue-500" /> Submitted Credentials
              </h3>

              {/* Birth Certificate */}
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  Birth Certificate:
                  {selectedRecord.birthCertificate ? (
                    <FaCheckCircle className="text-green-500" />
                  ) : (
                    <FaTimesCircle className="text-red-500" />
                  )}
                </span>
                {selectedRecord.birthCertificate ? (
                  <button
                    onClick={() =>
                      openDocumentModal(selectedRecord.birthCertificate, "Birth Certificate")
                    }
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View
                  </button>
                ) : (
                  <span className="text-red-500 text-sm">Not Uploaded</span>
                )}
              </div>

              {/* Valid ID */}
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  Valid ID:
                  {selectedRecord.barangayCertificate ? (
                    <FaCheckCircle className="text-green-500" />
                  ) : (
                    <FaTimesCircle className="text-red-500" />
                  )}
                </span>
                {selectedRecord.barangayCertificate ? (
                  <button
                    onClick={() =>
                      openDocumentModal(selectedRecord.barangayCertificate, "Valid ID")
                    }
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View
                  </button>
                ) : (
                  <span className="text-red-500 text-sm">Not Uploaded</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              <button
                onClick={() => handleValidation("Eligible")}
                disabled={selectedRecord.hasPension}
                className={`px-3 py-2 rounded text-white ${
                  selectedRecord.hasPension
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                Mark Eligible
              </button>
              <button
                onClick={() => handleValidation("Active")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
              >
                Mark Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {documentModal.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[50%] max-h-[90vh] overflow-auto relative">
            <button
              onClick={closeDocumentModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <FaTimes size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-3">{documentModal.title}</h2>
            {documentModal.url.endsWith(".pdf") ? (
              <iframe
                src={documentModal.url}
                title="Document Viewer"
                className="w-full h-[70vh] border"
              />
            ) : (
              <img
                src={documentModal.url}
                alt="Document"
                className="w-full h-auto rounded shadow-md object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DswdValidation;
