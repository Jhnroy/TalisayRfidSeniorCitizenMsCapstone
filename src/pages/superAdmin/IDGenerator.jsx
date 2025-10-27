import React, { useState, useEffect } from "react";
import { FaSearch, FaLink, FaUserCircle } from "react-icons/fa";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, set, update, get } from "firebase/database";

export default function SeniorRfidBinding() {
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [rfidCode, setRfidCode] = useState("");
  const [lastProcessedUID, setLastProcessedUID] = useState("");
  const [bindings, setBindings] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  const [bindMessage, setBindMessage] = useState("");
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [hasScannedBefore, setHasScannedBefore] = useState(false);

  // 🔹 Listen to RFID Scanner
  useEffect(() => {
    const scannerRef = ref(rtdb, "device/scanner");
    const unsub = onValue(scannerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeviceOnline(data?.online || false);

        if (data?.lastUID) setHasScannedBefore(true);

        if (data?.lastUID && data.lastUID !== lastProcessedUID) {
          setRfidCode(data.lastUID);
          setLastProcessedUID(data.lastUID);
          setBindMessage("✅ RFID card detected!");
        }
      } else {
        setDeviceOnline(false);
        setRfidCode("");
      }
    });
    return () => unsub();
  }, [lastProcessedUID]);

  // 🔹 Fetch all seniors
  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    return onValue(seniorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSeniors(arr);
      } else setSeniors([]);
    });
  }, []);

  // 🔹 Fetch RFID bindings
  useEffect(() => {
    const bindingsRef = ref(rtdb, "rfidBindings");
    return onValue(bindingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          rfidCode: key,
          ...data[key],
        }));
        setBindings(arr);
      } else setBindings([]);
    });
  }, []);

  const handleSelectSenior = (senior) => {
    setSelectedSenior(senior);
    setBindMessage("");
  };

  const handleStartScan = async () => {
    if (!deviceOnline) {
      setIsModalOpen(true);
      return;
    }
    try {
      const scannerRef = ref(rtdb, "device/scanner");
      await update(scannerRef, { startScan: true, lastUID: "", timestamp: Date.now() });
      setRfidCode("");
      setLastProcessedUID("");
      setBindMessage("📡 Waiting for RFID scan...");
    } catch (err) {
      console.error("Error starting scan:", err);
      setBindMessage("❌ Failed to start scan.");
    }
  };

  const handleBindRfid = async () => {
    if (!selectedSenior || !rfidCode) {
      alert("⚠️ Please select a senior and scan an RFID first.");
      return;
    }

    setIsBinding(true);
    try {
      const bindingRef = ref(rtdb, `rfidBindings/${rfidCode}`);
      const existing = await get(bindingRef);

      if (existing.exists()) {
        setBindMessage("❌ This RFID card is already bound.");
        setIsBinding(false);
        return;
      }

      const now = new Date().toISOString();
      const newBinding = {
        ...selectedSenior,
        rfidCode,
        dateBound: now,
        rfidStatus: "Bound",
      };

      // Save binding record
      await set(bindingRef, newBinding);

      // Update the senior record
      await update(ref(rtdb, `senior_citizens/${selectedSenior.id}`), {
        rfid: rfidCode,
        rfidStatus: "Bound",
      });

      // Reset scanner UID
      await update(ref(rtdb, "device/scanner"), { lastUID: "" });

      setBindMessage(`✅ RFID ${rfidCode} bound to ${selectedSenior.firstName || selectedSenior.name}`);
      setSelectedSenior(null);
      setRfidCode("");
      setLastProcessedUID("");
    } catch (err) {
      console.error("Error binding RFID:", err);
      setBindMessage("❌ Failed to bind RFID.");
    } finally {
      setIsBinding(false);
    }
  };

  // 🔍 Filter only unbound seniors
  const filteredSeniors = seniors.filter((m) => {
    const matchesBarangay = barangayFilter === "All Barangays" || m.barangay === barangayFilter;
    const matchesSearch =
      m.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const isUnbound = !m.rfid;
    return matchesBarangay && matchesSearch && isUnbound;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Senior RFID Binding</h1>
      <p className="text-gray-500">Bind RFID cards to registered seniors easily</p>

      {/* 🔹 RFID Scanner Section */}
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-3">RFID Scanner</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Selected Senior</p>
            <input
              type="text"
              disabled
              value={
                selectedSenior
                  ? `${selectedSenior.firstName || ""} ${selectedSenior.lastName || ""}`
                  : ""
              }
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">RFID Code</p>
            <input
              type="text"
              disabled
              placeholder={
                !hasScannedBefore
                  ? "No RFID scans yet."
                  : "Waiting for RFID scan..."
              }
              value={rfidCode}
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleStartScan}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Start Scan
          </button>
          <button
            onClick={handleBindRfid}
            disabled={!selectedSenior || !rfidCode || isBinding}
            className={`px-4 py-2 rounded-lg flex items-center ${
              !selectedSenior || !rfidCode || isBinding
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isBinding ? "Binding..." : <><FaLink className="mr-2" />Bind RFID</>}
          </button>
        </div>

        {bindMessage && (
          <p
            className={`mt-3 text-sm ${
              bindMessage.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {bindMessage}
          </p>
        )}
      </div>

      {/* 🔹 Bound Seniors Section */}
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">RFID Bound Seniors ({bindings.length})</h2>
        {bindings.length === 0 ? (
          <p className="text-center text-gray-400">No RFID bindings yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bindings.map((b, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 bg-gray-50 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaUserCircle className="text-gray-500 text-3xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {b.firstName} {b.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{b.barangay}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>RFID:</strong> <span className="font-mono">{b.rfidCode}</span>
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Status:</strong> {b.status || "Eligible"}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>RFID Status:</strong>{" "}
                  {b.rfidCode ? (
                    <span className="text-green-600 font-semibold">Bound</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Unbound</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Unbound Seniors Section */}
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h2 className="text-lg font-semibold">Available Seniors (Unbound)</h2>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={barangayFilter}
              onChange={(e) => setBarangayFilter(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option>All Barangays</option>
              {[...new Set(seniors.map((m) => m.barangay))].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <div className="flex items-center border rounded-lg px-2 flex-1 md:w-64">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search senior..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
          </div>
        </div>

        {filteredSeniors.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No unbound seniors found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSeniors.map((senior) => (
              <div
                key={senior.id}
                className={`border rounded-xl p-4 bg-gray-50 hover:shadow-md transition ${
                  selectedSenior?.id === senior.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaUserCircle className="text-gray-500 text-4xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {senior.firstName} {senior.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{senior.barangay}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Status:</strong> {senior.eligibility || "Eligible"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>RFID Status:</strong>{" "}
                  {senior.rfid ? (
                    <span className="text-green-600 font-semibold">Bound</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Unbound</span>
                  )}
                </p>
                <button
                  onClick={() =>
                    selectedSenior?.id === senior.id
                      ? setSelectedSenior(null)
                      : handleSelectSenior(senior)
                  }
                  className={`w-full py-2 rounded-lg font-medium ${
                    selectedSenior?.id === senior.id
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {selectedSenior?.id === senior.id ? "Unselect" : "Select"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Modal if RFID Device Offline */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center border border-gray-200">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-600 mb-2">
              No RFID Device Detected
            </h2>
            <p className="text-gray-600 mb-4">
              Please make sure your RFID scanner is connected and try again.
            </p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
