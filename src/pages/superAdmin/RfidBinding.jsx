import React, { useState, useEffect } from "react";
import { FaSearch, FaLink } from "react-icons/fa";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { rtdb } from "../../router/Firebase"; // ✅ RTDB lang gagamitin
import { ref, onValue, set, update, get } from "firebase/database";

const RfidBinding = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [rfidCode, setRfidCode] = useState("");
  const [bindings, setBindings] = useState([]);
  const [members, setMembers] = useState([]);
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBinding, setIsBinding] = useState(false);
  const [bindMessage, setBindMessage] = useState("");

  const [deviceOnline, setDeviceOnline] = useState(false);

  // ✅ Listen to device scanner (RTDB)
  useEffect(() => {
    const scannerRef = ref(rtdb, "device/scanner");
    const unsub = onValue(scannerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeviceOnline(data?.online || false);
        if (data?.lastUID) {
          setRfidCode(data.lastUID);
        }
      }
    });

    return () => unsub();
  }, []);

  // ✅ Fetch eligible members (RTDB)
  useEffect(() => {
    const membersRef = ref(rtdb, "eligible");
    const unsub = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMembers(arr);
      } else {
        setMembers([]);
      }
    });

    return () => unsub();
  }, []);

  // ✅ Fetch bindings (RTDB)
  useEffect(() => {
    const bindingsRef = ref(rtdb, "rfidBindings");
    const unsub = onValue(bindingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          rfidCode: key,
          ...data[key],
        }));
        setBindings(arr);
      } else {
        setBindings([]);
      }
    });

    return () => unsub();
  }, []);

  // ✅ Cleanup orphaned member.rfidCode kapag wala na sa bindings
  useEffect(() => {
    members.forEach((m) => {
      if (m.rfidCode && !bindings.some((b) => b.rfidCode === m.rfidCode)) {
        update(ref(rtdb, `eligible/${m.id}`), { rfidCode: null });
      }
    });
  }, [members, bindings]);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setBindMessage("");
    setRfidCode("");
  };

  // ✅ Start Scan (RTDB)
  const handleStartScan = async () => {
    if (!deviceOnline) {
      setIsModalOpen(true);
      return;
    }

    try {
      const scannerRef = ref(rtdb, "device/scanner");
      await update(scannerRef, {
        startScan: true,
        lastUID: "",
        timestamp: Date.now(),
      });

      setBindMessage("📡 Waiting for RFID scan...");
    } catch (err) {
      console.error("❌ Failed to request scan:", err);
      setBindMessage("❌ Error starting scan.");
    }
  };

  // ✅ Bind RFID (with error handling)
  const handleBindRfid = async () => {
    if (!selectedMember || !rfidCode) return;

    setIsBinding(true);
    setBindMessage("");

    try {
      // Check if RFID already exists
      const bindingRef = ref(rtdb, `rfidBindings/${rfidCode}`);
      const existingBinding = await get(bindingRef);

      if (existingBinding.exists()) {
        setBindMessage("❌ This RFID card is already bound to another member.");
        setIsBinding(false);
        return;
      }

      // Check if member already has RFID
      if (selectedMember.rfidCode) {
        setBindMessage("❌ This member already has an RFID card.");
        setIsBinding(false);
        return;
      }

      const newBinding = {
        ...selectedMember,
        rfidCode,
        date: new Date().toISOString(),
        status: "Bound",
        pensionReceived: false,
        missedConsecutive: 0,
        lastClaimDate: null,
      };

      // Save binding by RFID code
      await set(bindingRef, newBinding);

      // Update member
      await update(ref(rtdb, `eligible/${selectedMember.id}`), {
        rfidCode,
      });

      // Clear scanner lastUID
      await update(ref(rtdb, "device/scanner"), { lastUID: "" });

      setBindMessage("✅ RFID successfully bound!");
      setSelectedMember(null);
      setRfidCode("");
    } catch (err) {
      console.error("❌ Failed to bind RFID:", err);
      setBindMessage("❌ Error binding RFID. Check console.");
    } finally {
      setIsBinding(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesBarangay =
      barangayFilter === "All Barangays" || m.barangay === barangayFilter;
    const matchesSearch =
      m.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.surname?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBarangay && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">RFID Binding (RTDB Only)</h1>
      <p className="text-gray-500">
        Bind RFID cards to validated senior citizens
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* RFID Form */}
        <div className="bg-white shadow rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">RFID Scanning Form</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-600">Selected Member</label>
            <input
              type="text"
              value={
                selectedMember
                  ? `${selectedMember.firstName} ${selectedMember.surname}`
                  : ""
              }
              disabled
              className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
            />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-600">RFID Scanner Field</label>
            <input
              type="text"
              placeholder="Scanned RFID code will appear here"
              value={rfidCode}
              disabled
              className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
            />
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleStartScan}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Start RFID Scan
            </button>
            <button
              onClick={handleBindRfid}
              disabled={!selectedMember || !rfidCode || isBinding}
              className={`px-4 py-2 rounded-lg flex items-center ${
                !selectedMember || !rfidCode || isBinding
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isBinding ? (
                <span className="animate-pulse">⏳ Binding...</span>
              ) : (
                <>
                  <FaLink className="mr-2" /> Bind RFID
                </>
              )}
            </button>
          </div>

          {bindMessage && (
            <p
              className={`mt-3 text-sm ${
                bindMessage.includes("✅")
                  ? "text-green-600"
                  : "text-red-600 font-semibold"
              }`}
            >
              {bindMessage}
            </p>
          )}
        </div>

        {/* Bindings Table */}
        <div className="bg-white shadow rounded-xl p-5 overflow-x-auto">
          <h2 className="font-semibold text-lg mb-4">
            RFID Bindings ({bindings.length} records)
          </h2>
          {bindings.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p>No RFID bindings yet</p>
              <p className="text-sm">
                Start by selecting a member and scanning RFID
              </p>
            </div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Barangay</th>
                  <th className="p-2 border">RFID Code</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Pension Received</th>
                  <th className="p-2 border">Missed Consecutive</th>
                  <th className="p-2 border">Last Claim Date</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b, i) => (
                  <tr key={i}>
                    <td className="p-2 border">
                      {b.firstName} {b.surname}
                    </td>
                    <td className="p-2 border">{b.barangay}</td>
                    <td className="p-2 border font-mono">{b.rfidCode}</td>
                    <td className="p-2 border">
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      {b.pensionReceived ? "Yes" : "No"}
                    </td>
                    <td className="p-2 border text-red-600">
                      {b.missedConsecutive || 0}
                    </td>
                    <td className="p-2 border">
                      {b.lastClaimDate
                        ? new Date(b.lastClaimDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td
                      className={`p-2 border ${
                        b.status === "Bound"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {b.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Eligible Members */}
      <div className="bg-white shadow rounded-xl p-5 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Eligible Members</h2>
          <select
            className="border rounded-lg p-2"
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
          >
            <option>All Barangays</option>
            {[...new Set(members.map((m) => m.barangay))].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center border rounded-lg mb-4 p-2">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none"
          />
        </div>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Barangay</th>
              <th className="p-2 border">RFID Status</th>
              <th className="p-2 border">Pension Received</th>
              <th className="p-2 border">Missed Consecutive</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m) => {
              const isBound =
                m.rfidCode && bindings.some((b) => b.rfidCode === m.rfidCode);

              return (
                <tr key={m.id}>
                  <td className="p-2 border">
                    {m.firstName} {m.surname}
                  </td>
                  <td className="p-2 border">{m.barangay}</td>
                  <td
                    className={`p-2 border ${
                      isBound ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {isBound ? "Bound" : "Eligible"}
                  </td>
                  <td className="p-2 border">
                    {m.pensionReceived ? "Yes" : "No"}
                  </td>
                  <td className="p-2 border text-red-600">
                    {m.missedConsecutive || 0}
                  </td>
                  <td className="p-2 border">
                    {isBound ? (
                      <span className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-600 border">
                        Already Bound
                      </span>
                    ) : selectedMember?.id === m.id ? (
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="px-3 py-1 rounded-lg text-sm bg-red-100 text-red-600 border border-red-400"
                      >
                        Unselect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectMember(m)}
                        className="px-3 py-1 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600"
                      >
                        Select
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-gray-400 py-4">
                  No eligible members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ⚠️ Modal Warning */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
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
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RfidBinding;
