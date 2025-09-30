import { useState } from "react";
import { FaEye } from "react-icons/fa";

const Registrant = () => {
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("All Barangays");
  const [ageRange, setAgeRange] = useState("All Ages");
  const [pensionStatus, setPensionStatus] = useState("All Status");

  const data = [
    { name: "Maria Santos", address: "123 Main St, Poblacion", barangay: "Poblacion", age: 72, date: "Jan 15, 2024" },
    { name: "Juan dela Cruz", address: "456 Oak Ave, San Antonio", barangay: "San Antonio", age: 68, date: "Jan 20, 2024" },
    { name: "Rosa Mendoza", address: "789 Pine St, Barangay 1", barangay: "Barangay 1", age: 65, date: "Feb 01, 2024" },
    { name: "Pedro Reyes", address: "321 Elm St, Barangay 2", barangay: "Barangay 2", age: 74, date: "Feb 05, 2024" },
    { name: "Carmen Garcia", address: "654 Maple Dr, San Jose", barangay: "San Jose", age: 69, date: "Feb 10, 2024" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Senior Citizens</h1>
      <p className="text-gray-500 mb-6">Total: 1,247 member senior citizens</p>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg p-2 flex-1"
        />

        <select
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option>All Barangays</option>
          <option>Poblacion</option>
          <option>San Antonio</option>
          <option>Barangay 1</option>
          <option>Barangay 2</option>
          <option>San Jose</option>
        </select>

        <select
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option>All Ages</option>
          <option>60-65</option>
          <option>66-70</option>
          <option>71+</option>
        </select>

        <select
          value={pensionStatus}
          onChange={(e) => setPensionStatus(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option>All Status</option>
          <option>With Pension</option>
          <option>No Pension</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Name</th>
              <th className="p-3">Barangay</th>
              <th className="p-3">Age</th>
              <th className="p-3">Registration Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.address}</div>
                </td>
                <td className="p-3">{item.barangay}</td>
                <td className="p-3">{item.age}</td>
                <td className="p-3">{item.date}</td>
                <td className="p-3 text-blue-600 cursor-pointer">
                  <FaEye />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <span>Showing 1 to 10 of 1,247 results</span>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded-lg">&lt;</button>
          <button className="px-3 py-1 border rounded-lg bg-blue-500 text-white">1</button>
          <button className="px-3 py-1 border rounded-lg">2</button>
          <button className="px-3 py-1 border rounded-lg">3</button>
          <span className="px-2">...</span>
          <button className="px-3 py-1 border rounded-lg">125</button>
          <button className="px-2 py-1 border rounded-lg">&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default Registrant;
