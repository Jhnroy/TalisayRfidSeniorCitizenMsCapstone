import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, get, set, remove } from "firebase/database";
import { FaIdCard, FaKeyboard, FaInfoCircle } from "react-icons/fa";
import {
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineCloseCircle,
} from "react-icons/ai";

/**
 * Revised full Pension.jsx
 * - Pure React (JSX)
 * - Peso formatting (₱2,000.00)
 * - Responsive: table visible on sm+; card list visible on mobile
 * - Keeps original Firebase listeners + behavior
 */

/* ====== Utilities ====== */
// Format amounts to ₱2,000.00. Accepts numbers or numeric strings.
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") return "-";
  const num = Number(amount);
  if (isNaN(num)) return amount; // fallback
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(num);
};

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

// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyChxzDRb2g3V2c6IeP8WF3baunT-mnnR68",
  authDomain: "rfidseniorcitizenms.firebaseapp.com",
  databaseURL:
    "https://rfidseniorcitizenms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidseniorcitizenms",
  storageBucket: "rfidseniorcitizenms.firebasestorage.app",
  messagingSenderId: "412368953505",
  appId: "1:412368953505:web:43c8b2f607e50b9fde10e0",
  measurementId: "G-KGRDKXYP4S",
};

const app = initializeApp(firebaseConfig);

const statusIcon = {
  Claimed: <AiOutlineCheckCircle className="text-green-600 text-lg inline" />,
  Pending: <AiOutlineWarning className="text-yellow-500 text-lg inline" />,
  Invalid: <AiOutlineCloseCircle className="text-red-600 text-lg inline" />,
  Active: <AiOutlineCheckCircle className="text-green-600 text-lg inline" />,
  Suspended: <AiOutlineCloseCircle className="text-red-600 text-lg inline" />,
  Unclaimed: <AiOutlineWarning className="text-yellow-500 text-lg inline" />,
};

const statusColor = {
  Claimed: "text-green-600",
  Pending: "text-yellow-600",
  Invalid: "text-red-600",
  Active: "text-green-600",
  Suspended: "text-red-600",
  Unclaimed: "text-yellow-600",
};

const headerCell =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600";
const dataCell = "px-3 py-2 text-sm";

/* Helpers */
const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const computeAge = (isoBirthdate) => {
  if (!isoBirthdate) return null;
  const today = new Date();
  const dob =
    isoBirthdate instanceof Date
      ? isoBirthdate
      : new Date(`${isoBirthdate}T00:00:00`);
  if (isNaN(dob.getTime())) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const Pension = () => {
  // Filters
  const [quarter, setQuarter] = useState("Quarter 2 Payout 2023");
  const [barangay, setBarangay] = useState("All Barangays");

  // Scanner + recent logs
  const [seniorId, setSeniorId] = useState("");
  const [recentVerifications, setRecentVerifications] = useState([]);

  // Unregistered + Registered
  const [unregisteredUIDs, setUnregisteredUIDs] = useState([]); // array of {key, uid}
  const [registeredSeniors, setRegisteredSeniors] = useState([]); // array of {uid, ...data}

  // Register modal + form
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    uid: "",
    name: "",
    age: "",
    barangay: "",
    status: "Unclaimed",
    current_balance: "",
    birthdate: "",
  });

  // Field warnings / errors
  const [nameWarning, setNameWarning] = useState(""); // orange warning (not blocking)
  const [birthdateError, setBirthdateError] = useState(""); // red error (blocking)
  const [saving, setSaving] = useState(false);

  // Search + Sort
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'

  // Input ref for manual focus
  const manualInputRef = useRef(null);

  // ====== Date limits (block picking <60yo) ======
  const today = new Date();
  const sixtyYearsAgo = new Date(
    today.getFullYear() - 60,
    today.getMonth(),
    today.getDate()
  );
  const maxBirthdateISO = toISODate(sixtyYearsAgo);
  const minBirthdateISO = "1900-01-01";

  // ========= Realtime listeners (with cleanup) =========
  useEffect(() => {
    const db = getDatabase(app);

    const scannedRef = ref(db, "scanned_uid");
    const unregisterRef = ref(db, "unregister_uid");
    const regRef = ref(db, "registered_uids");

    const unsubScanned = onValue(scannedRef, async (snapshot) => {
      const uid = snapshot.val();
      if (uid) {
        await verifyUID(uid);
        set(scannedRef, ""); // auto-clear
      }
    });

    const unsubUnreg = onValue(unregisterRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUnregisteredUIDs([]);
        return;
      }
      const list = Object.keys(data).map((k) => ({
        key: k,
        uid: typeof data[k] === "string" ? data[k] : k,
      }));
      setUnregisteredUIDs(list);
    });

    const unsubReg = onValue(regRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRegisteredSeniors([]);
        return;
      }
      const list = Object.keys(data).map((uid) => ({
        uid,
        ...data[uid],
      }));
      setRegisteredSeniors(list);
    });

    return () => {
      try {
        unsubScanned && unsubScanned();
        unsubUnreg && unsubUnreg();
        unsubReg && unsubReg();
      } catch {}
    };
  }, []);

  // ========= Verify UID =========
  const verifyUID = async (uid) => {
    const db = getDatabase(app);
    try {
      // Check registered_uids
      const regSnap = await get(ref(db, `registered_uids/${uid}`));
      if (regSnap.exists()) {
        const data = regSnap.val();
        addToRecent({
          name: data.name || "Unknown",
          id: uid,
          barangay: data.barangay || "Unknown",
          time: new Date().toLocaleTimeString(),
          status: data.status || "Pending",
          balance: data.current_balance ?? 0,
        });
        return;
      }

      // Check unregister_uid
      const unregSnap = await get(ref(db, `unregister_uid/${uid}`));
      if (unregSnap.exists()) {
        addToRecent({
          name: "Unknown User",
          id: uid,
          barangay: "Unknown",
          time: new Date().toLocaleTimeString(),
          status: "Invalid",
          balance: "-",
        });
      } else {
        // Neither registered nor unregistered (still flag as invalid)
        addToRecent({
          name: "Unknown User",
          id: uid,
          barangay: "Unknown",
          time: new Date().toLocaleTimeString(),
          status: "Invalid",
          balance: "-",
        });
      }
    } catch (err) {
      console.error("verifyUID error:", err);
      addToRecent({
        name: "Unknown (error)",
        id: uid,
        barangay: "Unknown",
        time: new Date().toLocaleTimeString(),
        status: "Invalid",
        balance: "-",
      });
    }
  };

  const addToRecent = (entry) => {
    setRecentVerifications((prev) => [entry, ...prev].slice(0, 10));
  };

  // ========= Manual form submit (scanner text field) =========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seniorId.trim()) return;
    await verifyUID(seniorId.trim());
    setSeniorId("");
  };

  // ========= Open modal with a specific UID =========
  const openRegisterModal = (uid = "") => {
    setForm({
      uid,
      name: "",
      age: "",
      barangay: "",
      status: "Unclaimed",
      current_balance: "",
      birthdate: "",
    });
    setNameWarning("");
    setBirthdateError("");
    setShowModal(true);
  };

  // ========= Save registration =========
  const handleRegister = async () => {
    try {
      const { uid, name, age, barangay, status, current_balance, birthdate } =
        form;

      if (birthdateError) {
        alert("Fix birthdate error before saving.");
        return;
      }

      if (
        !uid ||
        !name ||
        !age ||
        !barangay ||
        !status ||
        current_balance === "" ||
        !birthdate
      ) {
        alert("Please complete all fields.");
        return;
      }

      if (Number(age) < 60) {
        alert("Only senior citizens (60 years old and above) can be registered.");
        return;
      }

      setSaving(true);

      const db = getDatabase(app);
      const payload = {
        name,
        age: Number(age),
        birthdate,
        barangay,
        status,
        // store numeric balance
        current_balance: Number(current_balance),
      };

      await set(ref(db, `registered_uids/${uid}`), payload);

      // Remove from unregister_uid if exists (by key or by value)
      await remove(ref(db, `unregister_uid/${uid}`)).catch(() => {});
      const unregSnap = await get(ref(db, "unregister_uid"));
      if (unregSnap.exists()) {
        const data = unregSnap.val();
        const matchKey = Object.keys(data).find((k) => data[k] === uid);
        if (matchKey) {
          await remove(ref(db, `unregister_uid/${matchKey}`)).catch(() => {});
        }
      }

      // clear and close
      setForm({
        uid: "",
        name: "",
        age: "",
        barangay: "",
        status: "Unclaimed",
        current_balance: "",
        birthdate: "",
      });
      setNameWarning("");
      setBirthdateError("");
      setShowModal(false);
    } catch (err) {
      console.error("handleRegister error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ========= Registered Seniors: filtering + sorting =========
  const filteredSortedSeniors = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = registeredSeniors.filter((r) => {
      const matchText =
        (r.name || "").toLowerCase().includes(q) ||
        (r.uid || "").toLowerCase().includes(q) ||
        (r.barangay || "").toLowerCase().includes(q) ||
        String(r.age || "").includes(q) ||
        (r.birthdate || "").includes(q);
      const matchBrgy =
        barangay === "All Barangays" || (r.barangay || "") === barangay;
      return matchText && matchBrgy;
    });

    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];

      // special-case numeric sorting for current_balance when stored as number or numeric string
      if (sortKey === "current_balance") {
        const an = Number(av ?? 0);
        const bn = Number(bv ?? 0);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      }

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });

    return rows;
  }, [registeredSeniors, search, sortKey, sortDir, barangay]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Pension Management</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section */}
        <section className="w-full lg:w-1/3 bg-white rounded-xl shadow p-4 space-y-4">
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
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center py-6 border rounded-lg bg-gray-50">
            <FaIdCard className="text-blue-500 mx-auto text-4xl mb-2" />
            <p className="font-medium text-gray-800">
              Tap RFID card to verify eligibility
            </p>
            <p className="text-sm text-gray-500">
              Place senior citizen ID card on the reader
            </p>
            <div className="mt-3 text-sm text-blue-600">● Reader active and waiting</div>
            <button
              className="mt-2 flex items-center mx-auto text-sm text-gray-600 hover:text-blue-600"
              type="button"
              onClick={() => manualInputRef.current?.focus()}
            >
              <FaKeyboard className="mr-1" /> Manual ID entry
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              ref={manualInputRef}
              id="manual-uid"
              type="text"
              placeholder="Enter Senior Citizen UID"
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

          {/* Unregistered UID List with Register buttons */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-2">Unregistered UIDs</h2>
            {unregisteredUIDs.length > 0 ? (
              <ul className="text-sm space-y-2">
                {unregisteredUIDs.map(({ key, uid }) => (
                  <li
                    key={key}
                    className="flex items-center justify-between border rounded px-3 py-2"
                  >
                    <span className="font-mono text-red-600 break-all">{uid}</span>
                    <button
                      onClick={() => openRegisterModal(uid)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      type="button"
                    >
                      Register
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No unregistered UIDs found.</p>
            )}
          </div>
        </section>

        {/* Right Section */}
        <section className="w-full lg:w-2/3 bg-white rounded-xl shadow p-6">
          <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed rounded-lg">
            <img src="/no-card.png" alt="No card" className="w-20 h-20 mb-4 opacity-60" />
            <h2 className="text-xl font-semibold mb-2">No card detected</h2>
            <p className="text-gray-500 max-w-md">
              Scan a senior citizen RFID card to view eligibility status and process benefit claims
            </p>
          </div>

          {/* Registered Seniors table (desktop/tablet) */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold">Registered Seniors</h3>
              <input
                type="text"
                placeholder="Search by name / UID / barangay / age / birthdate"
                className="w-full md:w-72 px-3 py-2 border rounded"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Table for sm+ */}
            <div className="overflow-auto rounded-lg border hidden sm:block">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("uid")} type="button">UID</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("name")} type="button">Name</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("age")} type="button">Age</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("birthdate")} type="button">Birthdate</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("barangay")} type="button">Barangay</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("status")} type="button">Status</button>
                    </th>
                    <th className={headerCell}>
                      <button onClick={() => toggleSort("current_balance")} type="button">Current Balance</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedSeniors.length > 0 ? (
                    filteredSortedSeniors.map((r) => {
                      const duplicateCount = registeredSeniors.filter(
                        (s) =>
                          (s.name || "").toLowerCase().trim() ===
                          (r.name || "").toLowerCase().trim()
                      ).length;
                      const isDuplicate = duplicateCount > 1;

                      return (
                        <tr key={r.uid} className={`border-b ${isDuplicate ? "bg-orange-100" : ""}`}>
                          <td className={`${dataCell} break-all`}>{r.uid}</td>
                          <td className={`${dataCell} font-medium`}>{r.name}</td>
                          <td className={dataCell}>{r.age}</td>
                          <td className={dataCell}>{r.birthdate || "-"}</td>
                          <td className={dataCell}>{r.barangay}</td>
                          <td className={`${dataCell} ${statusColor[r.status] || ""}`}>
                            {statusIcon[r.status]} <span className="ml-1 align-middle">{r.status || "-"}</span>
                          </td>
                          <td className={dataCell}>{formatCurrency(r.current_balance)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                        No registered seniors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list for Registered Seniors */}
            <div className="sm:hidden mt-3 space-y-3">
              {filteredSortedSeniors.length > 0 ? (
                filteredSortedSeniors.map((r) => (
                  <div key={r.uid} className="border rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs font-mono break-all">{r.uid}</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Age: <span className="font-medium">{r.age}</span></div>
                      <div>Birthdate: <span className="font-medium">{r.birthdate || "-"}</span></div>
                      <div>Barangay: <span className="font-medium">{r.barangay}</span></div>
                      <div className={`${statusColor[r.status] || ""} mt-1`}>Status: {r.status}</div>
                      <div className="mt-1">Balance: <span className="font-medium">{formatCurrency(r.current_balance)}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 rounded border">No registered seniors found.</div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Click a column header to sort. Sorting: <b>{sortKey}</b> ({sortDir})
            </p>
          </div>
        </section>
      </div>

      {/* Recent Verifications Table */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Recent Verifications</h2>

        {/* Table for sm+ */}
        <div className="overflow-auto rounded-lg shadow hidden sm:block">
          <table className="min-w-full bg-white text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">UID</th>
                <th className="px-4 py-2">Barangay</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentVerifications.map((entry, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3 break-all">{entry.id}</td>
                  <td className="px-4 py-3">{entry.barangay}</td>
                  <td className="px-4 py-3">{entry.time}</td>
                  <td className={`px-4 py-3 font-medium ${statusColor[entry.status] || ""}`}>
                    {statusIcon[entry.status]} <span className="ml-1">{entry.status}</span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(entry.balance)}</td>
                  <td className="px-4 py-3">
                    <FaInfoCircle className="text-blue-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
              {recentVerifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No verifications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards for Recent Verifications */}
        <div className="sm:hidden mt-3 space-y-3">
          {recentVerifications.length > 0 ? (
            recentVerifications.map((entry, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium">{entry.name}</div>
                  <div className="text-xs font-mono break-all">{entry.id}</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div>Barangay: <span className="font-medium">{entry.barangay}</span></div>
                  <div>Time: <span className="font-medium">{entry.time}</span></div>
                  <div className={`${statusColor[entry.status] || ""} mt-1`}>Status: {entry.status}</div>
                  <div className="mt-1">Balance: <span className="font-medium">{formatCurrency(entry.balance)}</span></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4 rounded border">No verifications yet.</div>
          )}
        </div>
      </section>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white shadow-lg p-6 rounded-2xl w-[720px] max-w-full border border-gray-200 animate-slideDownBounceScale">
            <h2 className="text-lg font-bold mb-4">Register Senior</h2>

            {/* Grid layout: 2 columns (stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1 */}
              <div>
                {/* UID */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">UID</label>
                  <input
                    type="text"
                    value={form.uid}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed text-gray-600"
                  />
                </div>

                {/* Name */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const inputName = e.target.value;
                      const duplicate = registeredSeniors.some(
                        (senior) =>
                          (senior.name || "").toLowerCase().trim() ===
                          inputName.toLowerCase().trim()
                      );

                      if (duplicate) {
                        setNameWarning("⚠️ Another senior has this name. UID will still make the record unique.");
                      } else {
                        setNameWarning("");
                      }

                      setForm({ ...form, name: inputName });
                    }}
                    className="w-full border p-2 rounded"
                  />
                  {nameWarning && <p className="text-sm text-orange-500 mt-1">{nameWarning}</p>}
                </div>

                {/* Birthdate */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Birthdate</label>
                  <input
                    type="date"
                    min={minBirthdateISO}
                    max={maxBirthdateISO}
                    value={form.birthdate || ""}
                    onChange={(e) => {
                      const birthdate = e.target.value;
                      if (!birthdate) {
                        setBirthdateError("");
                        setForm({ ...form, birthdate: "", age: "" });
                        return;
                      }
                      const age = computeAge(birthdate);
                      if (age === null || isNaN(age)) {
                        setBirthdateError("Invalid birthdate.");
                        setForm({ ...form, birthdate: "", age: "" });
                        return;
                      }
                      if (age < 60) {
                        setBirthdateError("Only senior citizens (60 years old and above) can be registered.");
                        setForm({ ...form, birthdate: "", age: "" });
                      } else {
                        setBirthdateError("");
                        setForm({ ...form, birthdate, age });
                      }
                    }}
                    className={`w-full border p-2 rounded ${birthdateError ? "border-red-500" : ""}`}
                  />
                  {form.age && <p className="text-sm text-gray-600 mt-1">Age: {form.age}</p>}
                  {birthdateError && <p className="text-sm text-red-500 mt-1">{birthdateError}</p>}
                </div>
              </div>

              {/* Column 2 */}
              <div>
                {/* Barangay */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Barangay</label>
                  <select
                    value={form.barangay}
                    onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                    className="w-full border p-2 rounded bg-white"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((brgy) => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Unclaimed">Unclaimed</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Current Balance */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.current_balance}
                    onChange={(e) => setForm({ ...form, current_balance: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">Preview: {formatCurrency(form.current_balance)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegister}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Animation CSS */}
          <style>{`
            .animate-slideDownBounceScale {
              animation: slideDownBounceScale 0.5s ease-in-out;
            }
            @keyframes slideDownBounceScale {
              0% { opacity: 0; transform: translateY(-40px) scale(0.95); }
              60% { opacity: 1; transform: translateY(10px) scale(1.02); }
              80% { transform: translateY(-5px) scale(0.99); }
              100% { transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </main>
  );
};

export default Pension;
