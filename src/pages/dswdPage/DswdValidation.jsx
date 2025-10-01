import React, { useState, useEffect } from "react";

// Example data - replace this with your real API or Firebase data
const sampleData = [
  {
    name: "Isabela Morales",
    barangay: "Barangay Binanuun",
    age: 60,
    eligibility: "Pending",
    registrationDate: "11/01/2023",
    rfid: "No",
    validationStatus: "Under Review",
  },
  {
    name: "Roberto Mendoza",
    barangay: "Barangay Caawigan",
    age: 60,
    eligibility: "Pending",
    registrationDate: "11/01/2023",
    rfid: "No",
    validationStatus: "Under Review",
  },
  // Add more data here...
];

const DswdValidation = () => {
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [filteredData, setFilteredData] = useState(sampleData);

  // Complete list of barangays
  const allBarangays = [
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
    "Sto. Niño"
  ];

  useEffect(() => {
    let data = sampleData;

    // Search by name
    if (search) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by barangay
    if (barangayFilter !== "All Barangays") {
      data = data.filter((item) => item.barangay === `Barangay ${barangayFilter}`);
    }

    // Filter by status
    if (statusFilter !== "All Statuses") {
      data = data.filter((item) => item.validationStatus === statusFilter);
    }

    setFilteredData(data);
  }, [search, barangayFilter, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setBarangayFilter("All Barangays");
    setStatusFilter("All Statuses");
  };

  // Get unique barangays for filter dropdown - use the complete list
  const barangays = allBarangays;
  const statuses = ["All Statuses", ...new Set(sampleData.map((d) => d.validationStatus))];

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
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2">{item.barangay}</td>
                <td className="px-4 py-2">{item.age}</td>
                <td className="px-4 py-2 text-yellow-600">{item.eligibility}</td>
                <td className="px-4 py-2">{item.registrationDate}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.rfid === "No" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
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
      </div>
    </div>
  );
};

export default DswdValidation;