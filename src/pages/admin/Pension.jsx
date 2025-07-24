import { useState } from "react";
import { FaIdCard, FaKeyboard, FaInfoCircle } from "react-icons/fa";
import { AiOutlineCheckCircle, AiOutlineWarning, AiOutlineCloseCircle } from "react-icons/ai";

const recentVerifications = [
  { name: "Maria Santos", id: "SC-2023-78945", barangay: "Poblacion", time: "10:45:12 AM", status: "Claimed" },
  { name: "Juan Dela Cruz", id: "SC-2023-12345", barangay: "Cahabaan", time: "10:42:33 AM", status: "Pending" },
  { name: "Pedro Reyes", id: "SC-2023-54321", barangay: "Calintaan", time: "10:38:15 AM", status: "Invalid" },
  { name: "Ana Gomez", id: "SC-2023-98765", barangay: "Itomang", time: "10:35:42 AM", status: "Claimed" },
  { name: "Jose Rizal", id: "SC-2023-24680", barangay: "Poblacion", time: "10:30:18 AM", status: "Claimed" },
  { name: "Elena Cruz", id: "SC-2023-13579", barangay: "San Isidro", time: "10:25:55 AM", status: "Invalid" },
];

const statusIcon = {
  Claimed: <AiOutlineCheckCircle className="text-green-600 text-lg inline" />,
  Pending: <AiOutlineWarning className="text-yellow-500 text-lg inline" />,
  Invalid: <AiOutlineCloseCircle className="text-red-600 text-lg inline" />,
};

const statusColor = {
  Claimed: "text-green-600",
  Pending: "text-yellow-600",
  Invalid: "text-red-600",
};

const Pension = () => {
  const [quarter, setQuarter] = useState("Quarter 2 Payout 2023");
  const [barangay, setBarangay] = useState("All Barangays");
  const [seniorId, setSeniorId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // For Firebase logic later
    console.log("Manual Search:", seniorId);
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Pension Management</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section */}
        <section className="w-full lg:w-1/3 bg-white rounded-xl shadow p-4 space-y-4">
          {/* Quarter & Barangay Select */}
          <div>
            <label className="block text-sm font-medium">Select Quarter</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="mt-1 w-full rounded border-gray-300 shadow-sm"
            >
              <option>Quarter 1 Payout 2023</option>
              <option>Quarter 2 Payout 2023</option>
              <option>Quarter 3 Payout 2023</option>
              <option>Quarter 4 Payout 2023</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Select Barangay</label>
            <select
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="mt-1 w-full rounded border-gray-300 shadow-sm"
            >
              <option>All Barangays</option>
              <option>Poblacion</option>
              <option>Cahabaan</option>
              <option>Calintaan</option>
              <option>Itomang</option>
              <option>San Isidro</option>
            </select>
          </div>

          {/* RFID Display */}
          <div className="text-center py-6 border rounded-lg bg-gray-50">
            <FaIdCard className="text-blue-500 mx-auto text-4xl mb-2" />
            <p className="font-medium text-gray-800">Tap RFID card to verify eligibility</p>
            <p className="text-sm text-gray-500">Place senior citizen ID card on the reader</p>
            <div className="mt-3 text-sm text-blue-600">● Reader active and waiting</div>
            <button className="mt-2 flex items-center mx-auto text-sm text-gray-600 hover:text-blue-600">
              <FaKeyboard className="mr-1" /> Manual ID entry
            </button>
          </div>

          {/* Manual Entry */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Enter Senior Citizen ID"
              className="w-full px-3 py-2 border rounded"
              value={seniorId}
              onChange={(e) => setSeniorId(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </form>
        </section>

        {/* Right Section */}
        <section className="w-full lg:w-2/3 bg-white rounded-xl shadow p-6 flex flex-col justify-center items-center text-center">
          <img src="/no-card.png" alt="No card" className="w-20 h-20 mb-4 opacity-60" />
          <h2 className="text-xl font-semibold mb-2">No card detected</h2>
          <p className="text-gray-500">
            Scan a senior citizen RFID card to view eligibility status and process benefit claims
          </p>
        </section>
      </div>

      {/* Table */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Recent Verifications</h2>
        <div className="overflow-auto rounded-lg shadow">
          <table className="min-w-full bg-white text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">ID Number</th>
                <th className="px-4 py-2">Barangay</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentVerifications.map((entry, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3">{entry.id}</td>
                  <td className="px-4 py-3">{entry.barangay}</td>
                  <td className="px-4 py-3">{entry.time}</td>
                  <td className={`px-4 py-3 font-medium ${statusColor[entry.status]}`}>
                    {statusIcon[entry.status]} <span className="ml-1">{entry.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <FaInfoCircle className="text-blue-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Pension;
