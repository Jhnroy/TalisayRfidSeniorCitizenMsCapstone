import React, { useEffect, useRef, useState } from "react";
import { FaSearch, FaLink, FaUserCircle, FaPrint, FaEdit } from "react-icons/fa";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { rtdb } from "../../router/Firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import TalisayLogo from "../../assets/Talisay-Logo.png";

/**
 * SeniorRfidBinding - Full revised with:
 * - Unbind RFID
 * - Edit profile picture
 * - Printable modal reflects updated picture
 */
export default function SeniorRfidBinding() {
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [rfidCode, setRfidCode] = useState("");
  const lastProcessedUIDRef = useRef("");
  const [bindings, setBindings] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [barangayFilter, setBarangayFilter] = useState("All Barangays");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  const [bindMessage, setBindMessage] = useState("");
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [hasScannedBefore, setHasScannedBefore] = useState(false);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  /* ------------------------------------------
     LISTEN TO RFID SCANNER
  -------------------------------------------- */
  useEffect(() => {
    const scannerRef = ref(rtdb, "device/scanner");
    const unsubscribe = onValue(scannerRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDeviceOnline(false);
        setRfidCode("");
        return;
      }
      const data = snapshot.val();
      setDeviceOnline(Boolean(data?.online));
      if (data?.lastUID) setHasScannedBefore(true);

      const lastUID = data?.lastUID || "";
      if (lastUID && lastUID !== lastProcessedUIDRef.current) {
        lastProcessedUIDRef.current = lastUID;
        setRfidCode(lastUID);
        setBindMessage("RFID card detected!");
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  /* ------------------------------------------
     FETCH ALL SENIORS
  -------------------------------------------- */
  useEffect(() => {
    const seniorsRef = ref(rtdb, "senior_citizens");
    const unsubscribe = onValue(seniorsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSeniors([]);
        return;
      }
      const data = snapshot.val();
      const arr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));

      arr.sort((a, b) => {
        const la = (a.lastName || "").toLowerCase();
        const lb = (b.lastName || "").toLowerCase();
        if (la < lb) return -1;
        if (la > lb) return 1;
        const fa = (a.firstName || "").toLowerCase();
        const fb = (b.firstName || "").toLowerCase();
        return fa < fb ? -1 : fa > fb ? 1 : 0;
      });

      setSeniors(arr);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  /* ------------------------------------------
     FETCH RFID BINDINGS
  -------------------------------------------- */
  useEffect(() => {
    const bindingsRef = ref(rtdb, "rfidBindings");
    const unsubscribe = onValue(bindingsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setBindings([]);
        return;
      }
      const data = snapshot.val();
      const arr = Object.keys(data).map((key) => ({ rfidCode: key, ...data[key] }));

      arr.forEach((a) => {
        a.firstName = a.firstName || a.name?.split(" ")?.[0] || "";
        a.lastName = a.lastName || a.name?.split(" ").slice(1).join(" ") || "";
      });

      setBindings(arr);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  /* ------------------------------------------
     SELECT SENIOR
  -------------------------------------------- */
  // const handleSelectSenior = (senior) => {
  //   setSelectedSenior(senior);
  //   setBindMessage("");
  // };

  /* ------------------------------------------
     START SCAN
  -------------------------------------------- */
  const handleStartScan = async () => {
    if (!deviceOnline) {
      setIsModalOpen(true);
      return;
    }
    try {
      const scannerRef = ref(rtdb, "device/scanner");
      await update(scannerRef, { startScan: true, lastUID: "", timestamp: Date.now() });
      setRfidCode("");
      lastProcessedUIDRef.current = "";
      setBindMessage("📡 Waiting for RFID scan...");
    } catch (err) {
      console.error("Error starting scan:", err);
      setBindMessage("❌ Failed to start scan.");
    }
  };

  /* ------------------------------------------
     BIND RFID
  -------------------------------------------- */
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
      const newBinding = { ...selectedSenior, rfidCode, dateBound: now, rfidStatus: "Bound" };

      await set(bindingRef, newBinding);
      await update(ref(rtdb, `senior_citizens/${selectedSenior.id}`), {
        rfid: rfidCode,
        rfidStatus: "Bound",
      });
      await update(ref(rtdb, "device/scanner"), { lastUID: "" });

      setBindMessage(`✅ RFID ${rfidCode} bound to ${selectedSenior.firstName} ${selectedSenior.lastName}`);
      setSelectedSenior(null);
      setRfidCode("");
      lastProcessedUIDRef.current = "";
    } catch (err) {
      console.error("Bind error:", err);
      setBindMessage("❌ Failed to bind RFID.");
    } finally {
      setIsBinding(false);
    }
  };

  /* ------------------------------------------
     FILTER UNBOUND SENIORS
  -------------------------------------------- */
  const filteredSeniors = seniors.filter((m) => {
    const matchBarangay = barangayFilter === "All Barangays" || (m.barangay || "") === barangayFilter;
    const q = (searchTerm || "").trim().toLowerCase();
    const matchSearch =
      !q ||
      (m.firstName || "").toLowerCase().includes(q) ||
      (m.lastName || "").toLowerCase().includes(q) ||
      (m.name || "").toLowerCase().includes(q);
    const isUnbound = !m.rfid;
    return matchBarangay && matchSearch && isUnbound;
  });

  /* ------------------------------------------
     PRINTABLE MODAL
  -------------------------------------------- */
  const openPrintModal = (binding) => {
    setPrintData(binding);
    setIsPrintModalOpen(true);
    setTimeout(() => {
      const el = document.getElementById("print-sheet");
      if (el) el.focus();
    }, 50);
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
    setPrintData(null);
  };

  const handlePrint = () => {
    window.print();
  };

  /* ------------------------------------------
     UNBIND RFID
  -------------------------------------------- */
  const handleUnbindRfid = async (binding) => {
    if (!window.confirm(`Are you sure you want to unbind RFID ${binding.rfidCode} from ${binding.firstName} ${binding.lastName}?`)) return;
    try {
      await set(ref(rtdb, `rfidBindings/${binding.rfidCode}`), null);
      await update(ref(rtdb, `senior_citizens/${binding.id}`), { rfid: null, rfidStatus: "Unbound" });
      setBindings((prev) => prev.filter((b) => b.rfidCode !== binding.rfidCode));
      alert(`✅ RFID ${binding.rfidCode} unbound successfully.`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to unbind RFID.");
    }
  };

  /* ------------------------------------------
     EDIT PROFILE PICTURE
  -------------------------------------------- */
  const handleEditProfilePicture = async (binding, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result;
      try {
        // Update both binding and senior record
        await update(ref(rtdb, `senior_citizens/${binding.id}`), { profilePicture: imageData });
        await update(ref(rtdb, `rfidBindings/${binding.rfidCode}`), { profilePicture: imageData });

        setBindings((prev) =>
          prev.map((b) => (b.rfidCode === binding.rfidCode ? { ...b, profilePicture: imageData } : b))
        );
        alert("✅ Profile picture updated successfully.");
      } catch (err) {
        console.error(err);
        alert("❌ Failed to update profile picture.");
      }
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------------------
     UTILITIES
  -------------------------------------------- */
  const formatDate = (iso) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return isNaN(d) ? iso.substring(0, 10) : d.toLocaleDateString();
    } catch {
      return iso.substring(0, 10);
    }
  };
  const barangays = Array.from(new Set(seniors.map((s) => s.barangay).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-sheet, #print-sheet * { visibility: visible !important; }
          #print-sheet { position: absolute; left: 0; top: 0; }
          @page { size: 180mm 50mm; margin: 0; }
        }
        .pvc-card { width: 90mm; height: 50mm; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; }
        .pvc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .print-sheet-wrapper { background: #f8fafc; padding: 12px; border-radius: 8px; }
        .pvc-card .text-xs { font-size: 10px; }
      `}</style>

      <h1 className="text-2xl font-bold text-gray-800">Senior Citizens ID Generator</h1>
      {/* <p className="text-gray-500">Bind RFID cards to registered seniors easily</p> */}

      
      {/* <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-3">RFID Scanner</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Selected Senior</p>
            <input
              type="text"
              disabled
              value={selectedSenior ? `${selectedSenior.firstName || ""} ${selectedSenior.lastName || ""}` : ""}
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">RFID Code</p>
            <input
              type="text"
              disabled
              placeholder={!hasScannedBefore ? "No RFID scans yet." : "Waiting for RFID scan..."}
              value={rfidCode}
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleStartScan} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Start Scan
          </button>
          <button
            onClick={handleBindRfid}
            disabled={!selectedSenior || !rfidCode || isBinding}
            className={`px-4 py-2 rounded-lg flex items-center ${
              !selectedSenior || !rfidCode || isBinding ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isBinding ? "Binding..." : <><FaLink className="mr-2" />Bind RFID</>}
          </button>
        </div>

        {bindMessage && <p className={`mt-3 text-sm ${bindMessage.includes("✅") ? "text-green-600" : "text-red-600"}`}>{bindMessage}</p>}
      </div> */}

      {/* UNBOUND SENIORS */}
      {/* <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h2 className="text-lg font-semibold">Available Seniors (Unbound)</h2>
          <div className="flex gap-3 w-full md:w-auto">
            <select value={barangayFilter} onChange={(e) => setBarangayFilter(e.target.value)} className="border rounded-lg p-2">
              <option>All Barangays</option>
              {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex items-center border rounded-lg px-2 flex-1 md:w-64">
              <FaSearch className="text-gray-400 mr-2" />
              <input aria-label="Search senior" type="text" placeholder="Search senior..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 outline-none" />
            </div>
          </div>
        </div>

        {filteredSeniors.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No unbound seniors found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSeniors.map((senior) => (
              <div key={senior.id} className={`border rounded-xl p-4 bg-gray-50 hover:shadow-md transition ${selectedSenior?.id === senior.id ? "ring-2 ring-blue-400" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <FaUserCircle className="text-gray-500 text-4xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{senior.firstName} {senior.lastName}</h3>
                    <p className="text-sm text-gray-500">{senior.barangay}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-1"><strong>Status:</strong> {senior.eligibility || "Eligible"}</p>

                <p className="text-sm text-gray-600 mb-2"><strong>RFID Status:</strong> {senior.rfid ? <span className="text-green-600 font-semibold">Bound</span> : <span className="text-red-500 font-semibold">Unbound</span>}</p>

                <button onClick={() => (selectedSenior?.id === senior.id ? setSelectedSenior(null) : handleSelectSenior(senior))} className={`w-full py-2 rounded-lg font-medium ${selectedSenior?.id === senior.id ? "bg-red-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
                  {selectedSenior?.id === senior.id ? "Unselect" : "Select"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* BOUND SENIORS */}
      {/* BOUND SENIORS */}
            <div className="bg-white shadow rounded-2xl p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">RFID Bound Seniors ({bindings.length})</h2>
                    {bindings.length === 0 ? (
                      <p className="text-center text-gray-400">No RFID bindings yet.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {bindings.map((b, i) => (
                          <div key={`${b.rfidCode}-${i}`} className="border rounded-xl bg-white shadow p-4 relative overflow-hidden hover:shadow-lg transition">
                            <div className="flex gap-3 mb-3">
                              <div className="w-20 h-24 bg-gray-200 border rounded overflow-hidden flex items-center justify-center">
                                {b.profilePicture ? <img src={b.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : <FaUserCircle className="w-full h-full text-gray-400" />}
                              </div>
            
                              <div className="flex-1 text-xs space-y-1">
                                <p><span className="font-semibold">Name: </span>{b.firstName} {b.lastName}</p>
                                <p><span className="font-semibold">Address: </span>{`${b.barangay || ""}${b.barangay ? ", " : ""}${b.municipality || ""}${b.municipality ? ", " : ""}${b.province || ""}`}</p>
                                                    <p><span className="font-semibold">Birthdate: </span>{b.dateOfBirth || "N/A"}</p>
                                <p><span className="font-semibold">Sex: </span>{b.gender || b.sex || "N/A"}</p>
                                <p><span className="font-semibold">Issued: </span>{b.dateBound ? formatDate(b.dateBound) : "N/A"}</p>
                              </div>
                            </div>
            
                            <div className="flex gap-2 mt-2">
                              {/* Edit Profile Picture */}
                              <label className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white text-xs py-1 rounded text-center cursor-pointer">
                                <FaEdit className="inline-block mr-1" /> Edit Picture
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleEditProfilePicture(b, e.target.files[0])}
                                />
                              </label>
            
                              {/* Unbind RFID */}
                              {/* <button
                                onClick={() => handleUnbindRfid(b)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 rounded text-xs font-semibold"
                              >
                                Unbind RFID
                              </button> */}
                            </div>
            
                            <div className="text-[10px] text-gray-500 border-t mt-3 pt-2 leading-tight text-center cursor-pointer" onClick={() => openPrintModal(b)}>
                              Click to open printable ID (front + back)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            
                  {/* OFFLINE MODAL */}
                  {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                      <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center border border-gray-200">
                        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
                        <h2 className="text-lg font-bold text-red-600 mb-2">No RFID Device Detected</h2>
                        <p className="text-gray-600 mb-4">Please make sure your RFID scanner is connected and try again.</p>
                        <button onClick={() => setIsModalOpen(false)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">OK</button>
                      </div>
                    </div>
                  )}
            
                  {/* PRINTABLE MODAL */}
                  {isPrintModalOpen && printData && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 relative">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Printable Senior ID</h3>
                          <div className="flex gap-2">
                            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                              <FaPrint /> Print / Save as PDF
                            </button>
                            <button onClick={closePrintModal} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md">Close</button>
                          </div>
                        </div>
            
                        <div className="flex justify-center print-sheet-wrapper">
                          <div id="print-sheet" tabIndex={-1} className="flex" style={{ gap: 20 }}>
            
                            {/* FRONT */}
                            
                            <div className="pvc-card bg-white border rounded-xl shadow p-4 flex flex-col">
                              {/* HEADER */}
                              <div className="flex items-center mb-3">
                                <div className="flex-shrink-0 mr-2">
                                  <img
                                    src={TalisayLogo}
                                    alt="Logo"
                                    style={{ width: 26, height: 26, objectFit: "contain" }}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <div className="text-xs font-bold">
                                    Municipality of {printData.municipality || "____"}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Office of the Senior Citizen Affairs (OSCA)
                                  </div>
                                </div>
                              </div>
            
                              {/* MAIN CONTENT WITH PROFILE PIC ON RIGHT */}
                              <div className="flex w-full gap-4 mb-2">
            
                                {/* 3-COLUMN INFORMATION */}
                                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
            
                                  {/* COLUMN 1 */}
                                  <div className="space-y-1">
                                    <p><span className="font-semibold">I.D Number:</span> {printData.seniorId}</p>
                                    <p><span className="font-semibold">Name:</span> {printData.firstName} {printData.lastName}</p>
                                  </div>
            
                                  {/* COLUMN 2 */}
                                  <div className="space-y-1">
                                    <p>
                                      <span className="font-semibold">Address:</span>{" "}
                                      {`${printData.barangay || ""}${printData.barangay ? ", " : ""}${printData.municipality || ""}${printData.municipality ? ", " : ""}${printData.province || ""}`}
                                    </p>
                                    <p><span className="font-semibold">Birthdate:</span> {printData.dateOfBirth || "N/A"}</p>
                                  </div>
            
                                  {/* COLUMN 3 */}
                                  <div className="space-y-1">
                                    <p><span className="font-semibold">Sex:</span> {printData.gender || printData.sex || "N/A"}</p>
                                    <p><span className="font-semibold">Issued:</span> {printData.dateBound ? formatDate(printData.dateBound) : "N/A"}</p>
                                  </div>
                                </div>
            
                                {/* PROFILE PIC — 1×1 */}
                                <div className="w-16 h-16 bg-gray-200 border rounded overflow-hidden flex items-center justify-center">
                                  {printData.profilePicture ? (
                                    <img
                                      src={printData.profilePicture}
                                      alt="Profile"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FaUserCircle className="w-full h-full text-gray-400" />
                                  )}
                                </div>
                              </div>
            
                              {/* SIGNATURE + THUMB BOX — MOVED UP */}
                              <div className="flex justify-between mt-0.5 items-start">
            
                                {/* SIGNATURE LINE */}
                                <div className="w-1/2 pr-4 flex flex-col">
                                  <div className="border-b border-black mb-0.5" style={{ height: 2 }}></div>
            
                                  <label className="text-xs mt-0">
                                    Signature over printed name:
                                  </label>
                                </div>
            
                                {/* THUMB BOX — MOVED UP */}
                                <div className="w-1/2 pl-4 flex flex-col items-center">
                                  <div
                                    style={{
                                      width: 65,
                                      height: 40,
                                      border: "1px solid #000",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#9ca3af",
                                      padding: 5,
                                      marginBottom: 5,
                                      marginTop: -25
                                    }}
                                  >
                                    Thumb
                                  </div>
                                </div>
            
                              </div>
                            </div>
            
            
            
            
            
                            {/* BACK */}
                            <div className="pvc-card bg-white border rounded-xl shadow p-4 flex flex-col justify-between">
                              <div>
                                <p className="text-xs"><strong>Control No.:</strong> {printData.rfidCode || "N/A"}</p>
                                <p className="text-xs mt-1"><strong>Validity:</strong> Lifetime</p>
                                <p className="text-xs mt-2">This ID certifies that the bearer is a registered senior citizen <br /> entitled to privileges and services provided by local and national laws.</p>
                              </div>
            
                              <div className="flex justify-between mt-6 items-center">
                                {/* Left side: OSCA Head */}
                                <div className="w-1/2 flex flex-col items-center">
                                  <label className="text-xs font-semibold mb-1 text-center">Armando M. Magana</label>
                                  <div className="border-b border-black w-3/4" style={{ height: 2 }} />
                                  <p className="text-[10px] mt-1 text-center">OSCA Head</p>
                                </div>
            
                                {/* Right side: Municipal Mayor */}
                                <div className="w-1/2 flex flex-col items-center">
                                  <label className="text-xs font-semibold mb-1 text-center">Donovan A. Mancenido</label>
                                  <div className="border-b border-black w-3/4" style={{ height: 2 }} />
                                  <p className="text-[10px] mt-1 text-center">Municipal Mayor</p>
                                </div>
                              </div>
            
            
                            </div>
                          </div>
                        </div>
            
                        <p className="text-xs text-gray-500 mt-3">
                          Preview: Clicking <strong>Print</strong> opens the browser print dialog. Choose "Save as PDF" to generate a PDF with dimensions 180mm × 50mm. Set margins to "None" in the print dialog for exact sizing.
                        </p>
                      </div>
                    </div>
                  )}


    </div>
  );
}
