import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, get, set, update, remove, push } from "firebase/database";
import { FaIdCard, FaKeyboard, FaInfoCircle, FaEdit, FaTrash, FaUpload, FaDownload } from "react-icons/fa";
import {
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineCloseCircle,
} from "react-icons/ai";

/**
 * Pension.jsx (Full, 800+ lines)
 * - Pure React + Tailwind classes
 * - Firebase Realtime Database
 * - RFID verify flow + manual entry
 * - Register / Edit / Delete seniors
 * - Status + Balance handling
 * - Image upload (profile) to base64 (stored under registered_uids[uid].photoBase64)
 * - Sorting / Searching / Filters / Pagination
 * - Export CSV / Import CSV
 * - Recent Verifications log
 * - Audit Logs (writes to /audit_logs)
 * - Responsive table (sm+) + mobile cards
 * - Form validation (birthdate >= 60yo; required fields)
 * - Defensive code for missing/invalid values
 * - Keyboard UX + small animations
 * - No external libs aside from react-icons + firebase
 */

/* ====== Utilities ====== */
const nowIso = () => new Date().toISOString();

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

const parseNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// CSV helpers
const escapeCsv = (s) => {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCSV = (rows, headers) => {
  const head = headers.map(h => escapeCsv(h.label)).join(",");
  const body = rows
    .map(r => headers.map(h => escapeCsv(h.get(r))).join(","))
    .join("\n");
  return head + "\n" + body;
};

const fromCSV = (text) => {
  // Very small CSV parser (no external deps): supports quotes/double-quotes
  const rows = [];
  const lines = text.replace(/\r/g, "").split("\n");
  if (!lines.length) return rows;
  const header = splitCsvLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = splitCsvLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => { obj[h] = cols[idx] ?? ""; });
    rows.push(obj);
  }
  return rows;
};

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"'; i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

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

const payoutQuarters = [
  "Quarter 1 Payout 2023",
  "Quarter 2 Payout 2023",
  "Quarter 3 Payout 2023",
  "Quarter 4 Payout 2023",
  "Quarter 1 Payout 2024",
  "Quarter 2 Payout 2024",
  "Quarter 3 Payout 2024",
  "Quarter 4 Payout 2024",
];

// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyAO9TdAUkHNh7jk9U6NRKlCtMmM0pla-_0",

  authDomain: "rfidbasedseniormscapstone.firebaseapp.com",

  databaseURL: "https://rfidbasedseniormscapstone-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "rfidbasedseniormscapstone",

  storageBucket: "rfidbasedseniormscapstone.firebasestorage.app",

  messagingSenderId: "231424248323",

  appId: "1:231424248323:web:a609ea6237275d93eb9c36",

  measurementId: "G-NCE2MRD0WL"

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

// small debounce for search
const debounce = (fn, ms = 250) => {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// Local storage helpers for small prefs
const storage = {
  get(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

// Lightweight Modal
const Modal = ({ title, children, onClose, footer, widthClass = "w-[720px]" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white shadow-lg p-6 rounded-2xl ${widthClass} max-w-full border border-gray-200 animate-slideDownBounceScale`}>
      <div className="flex items-start justify-between gap-4">
        {title ? <h2 className="text-lg font-bold">{title}</h2> : <div />}
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
      </div>
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
    <style>{`
      .animate-slideDownBounceScale { animation: slideDownBounceScale 0.5s ease-in-out; }
      @keyframes slideDownBounceScale {
        0% { opacity: 0; transform: translateY(-40px) scale(0.95); }
        60% { opacity: 1; transform: translateY(10px) scale(1.02); }
        80% { transform: translateY(-5px) scale(0.99); }
        100% { transform: translateY(0) scale(1); }
      }
    `}</style>
  </div>
);

const PlaceholderAvatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .map(s => s[0].toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 grid place-items-center font-semibold">
      {initials || "?"}
    </div>
  );
};

const Photo = ({ base64, name }) => {
  if (base64) return (
    <img src={base64} alt={name || "profile"} className="w-10 h-10 rounded-full object-cover" />
  );
  return <PlaceholderAvatar name={name} />;
};

/* =========================
   Main Component
========================= */
const Pension = () => {
  // Filters
  const [quarter, setQuarter] = useState(payoutQuarters[1]);
  const [barangay, setBarangay] = useState(storage.get("pref:barangay", "All Barangays"));

  // Scanner + recent logs
  const [seniorId, setSeniorId] = useState("");
  const [recentVerifications, setRecentVerifications] = useState([]);

  // Unregistered + Registered
  const [unregisteredUIDs, setUnregisteredUIDs] = useState([]); // array of {key, uid}
  const [registeredSeniors, setRegisteredSeniors] = useState([]); // array of {uid, ...data}

  // Register/Edit modal + form
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    uid: "",
    name: "",
    age: "",
    barangay: "",
    status: "Unclaimed",
    current_balance: "",
    birthdate: "",
    photoBase64: "",
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Claim modal
  const [claimTarget, setClaimTarget] = useState(null);
  const [claimAmount, setClaimAmount] = useState("2000"); // default claim

  // Field warnings / errors
  const [nameWarning, setNameWarning] = useState(""); // orange warning (not blocking)
  const [birthdateError, setBirthdateError] = useState(""); // red error (blocking)
  const [saving, setSaving] = useState(false);

  // Search + Sort + Pagination
  const [search, _setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'
  const [pageSize, setPageSize] = useState(storage.get("pref:pageSize", 10));
  const [page, setPage] = useState(1);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const importInputRef = useRef(null);

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

  // persist small prefs
  useEffect(() => { storage.set("pref:barangay", barangay); }, [barangay]);
  useEffect(() => { storage.set("pref:pageSize", pageSize); }, [pageSize]);

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
        await writeAudit({
          action: "verify_registered",
          uid,
          name: data.name || "",
          barangay: data.barangay || "",
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
        await writeAudit({ action: "verify_unregistered", uid });
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
        await writeAudit({ action: "verify_unknown", uid });
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

  const writeAudit = async (payload) => {
    try {
      const db = getDatabase(app);
      const node = ref(db, "audit_logs");
      const id = push(node);
      await set(id, { ...payload, ts: nowIso() });
    } catch (e) {
      // non-fatal
      console.warn("audit log failed", e);
    }
  };

  // ========= Manual form submit (scanner text field) =========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seniorId.trim()) return;
    await verifyUID(seniorId.trim());
    setSeniorId("");
  };

  // ========= Open Register Modal =========
  const openRegisterModal = (uid = "") => {
    setIsEdit(false);
    setForm({
      uid,
      name: "",
      age: "",
      barangay: "",
      status: "Unclaimed",
      current_balance: "",
      birthdate: "",
      photoBase64: "",
    });
    setNameWarning("");
    setBirthdateError("");
    setShowModal(true);
  };

  // ========= Open Edit Modal =========
  const openEditModal = (row) => {
    setIsEdit(true);
    setForm({
      uid: row.uid || "",
      name: row.name || "",
      age: row.age || "",
      barangay: row.barangay || "",
      status: row.status || "Unclaimed",
      current_balance: row.current_balance ?? "",
      birthdate: row.birthdate || "",
      photoBase64: row.photoBase64 || "",
    });
    setNameWarning("");
    setBirthdateError("");
    setShowModal(true);
  };

  const closeModalReset = () => {
    setShowModal(false);
    setIsEdit(false);
    setForm({
      uid: "",
      name: "",
      age: "",
      barangay: "",
      status: "Unclaimed",
      current_balance: "",
      birthdate: "",
      photoBase64: "",
    });
    setNameWarning("");
    setBirthdateError("");
  };

  // ========= Save registration / update =========
  const handleSave = async () => {
    try {
      const { uid, name, age, barangay, status, current_balance, birthdate, photoBase64 } = form;

      if (birthdateError) {
        alert("Fix birthdate error before saving.");
        return;
      }

      if (!uid || !name || !barangay || !status || !birthdate) {
        alert("Please complete all required fields.");
        return;
      }

      const computedAge = computeAge(birthdate);
      if (computedAge === null || Number(computedAge) < 60) {
        alert("Only senior citizens (60 years old and above) can be registered.");
        return;
      }

      setSaving(true);

      const db = getDatabase(app);
      const payload = {
        name,
        age: Number(age || computedAge),
        birthdate,
        barangay,
        status,
        current_balance: Number(current_balance || 0),
        photoBase64: photoBase64 || "",
        updatedAt: nowIso(),
      };

      if (!isEdit) {
        payload.createdAt = nowIso();
      }

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

      await writeAudit({ action: isEdit ? "update_registered" : "create_registered", uid, name, barangay });

      closeModalReset();
    } catch (err) {
      console.error("handleSave error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ========= Delete senior =========
  // const confirmDelete = async () => {
  //   if (!deleteTarget) return;
  //   try {
  //     const db = getDatabase(app);
  //     await remove(ref(db, `registered_uids/${deleteTarget.uid}`));
  //     await writeAudit({ action: "delete_registered", uid: deleteTarget.uid, name: deleteTarget.name || "" });
  //     setDeleteTarget(null);
  //   } catch (e) {
  //     console.error(e);
  //     alert("Delete failed.");
  //   }
  // };

  // ========= Claim flow =========
  const openClaim = (row) => {
    setClaimTarget(row);
    setClaimAmount("2000");
  };
  const closeClaim = () => {
    setClaimTarget(null);
    setClaimAmount("2000");
  };
  const doClaim = async () => {
    if (!claimTarget) return;
    const amt = parseNumber(claimAmount, NaN);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Invalid claim amount.");
      return;
    }
    try {
      const db = getDatabase(app);
      const cur = parseNumber(claimTarget.current_balance, 0);
      const newBal = Math.max(0, cur - amt);
      await update(ref(db, `registered_uids/${claimTarget.uid}`), {
        current_balance: newBal,
        status: newBal > 0 ? "Active" : "Claimed",
        updatedAt: nowIso(),
      });
      await writeAudit({ action: "claim_payout", uid: claimTarget.uid, amount: amt, quarter });
      closeClaim();
    } catch (e) {
      console.error(e);
      alert("Claim failed.");
    }
  };

  // ========= Search (debounced) =========
  const setSearch = useMemo(() => debounce(_setSearch, 200), []);

  // ========= Registered Seniors: filtering + sorting + pagination =========
  const filteredSortedSeniors = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    let rows = registeredSeniors.filter((r) => {
      const matchText =
        (r.name || "").toLowerCase().includes(q) ||
        (r.uid || "").toLowerCase().includes(q) ||
        (r.barangay || "").toLowerCase().includes(q) ||
        String(r.age || "").includes(q) ||
        (r.birthdate || "").includes(q) ||
        (r.status || "").toLowerCase().includes(q);
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

  const totalPages = Math.max(1, Math.ceil(filteredSortedSeniors.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSortedSeniors.slice(start, start + pageSize);
  }, [filteredSortedSeniors, currentPage, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const statusPill = (status) => (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusColor[status] || "text-gray-600"}`}>
      {statusIcon[status]} {status || "-"}
    </span>
  );

  // Image upload -> base64
  const onPickImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      alert("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setForm((prev) => ({ ...prev, photoBase64: base64 }));
    };
    reader.onerror = () => alert("Failed to read file.");
    reader.readAsDataURL(f);
  };
  // Remove image
  const removeImage = () => {
    setForm((prev) => ({ ...prev, photoBase64: "" }));
  };

  // ===== Export CSV =====
  const exportCSV = () => {
    const headers = [
      { label: "uid", get: r => r.uid || "" },
      { label: "name", get: r => r.name || "" },
      { label: "age", get: r => r.age ?? "" },
      { label: "birthdate", get: r => r.birthdate || "" },
      { label: "barangay", get: r => r.barangay || "" },
      { label: "status", get: r => r.status || "" },
      { label: "current_balance", get: r => r.current_balance ?? "" },
      { label: "photoBase64", get: r => r.photoBase64 || "" },
      { label: "createdAt", get: r => r.createdAt || "" },
      { label: "updatedAt", get: r => r.updatedAt || "" },
    ];
    const csv = toCSV(registeredSeniors, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registered_seniors_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== Import CSV =====
  const handleImportFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const rows = fromCSV(text);
      if (!rows.length) {
        alert("No rows found in CSV.");
        return;
      }
      const db = getDatabase(app);
      let count = 0;
      for (const r of rows) {
        const uid = (r.uid || "").trim();
        if (!uid) continue;
        const birthdate = (r.birthdate || "").trim();
        const computedAge = birthdate ? computeAge(birthdate) : null;
        const payload = {
          name: r.name || "",
          age: Number(r.age || computedAge || 0),
          birthdate,
          barangay: r.barangay || "",
          status: r.status || "Unclaimed",
          current_balance: Number(r.current_balance || 0),
          photoBase64: r.photoBase64 || "",
          createdAt: r.createdAt || nowIso(),
          updatedAt: nowIso(),
        };
        await set(ref(db, `registered_uids/${uid}`), payload);
        count++;
      }
      await writeAudit({ action: "import_csv", count });
      alert(`Imported ${count} record(s).`);
      setShowImport(false);
      if (importInputRef.current) importInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Import failed. Please check your CSV.");
    }
  };

  const openImport = () => setShowImport(true);
  const closeImport = () => {
    setShowImport(false);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  // ===== UI =====
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
              {payoutQuarters.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Unregistered UIDs</h2>
              <button
                onClick={() => openRegisterModal("")}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                type="button"
                title="Manual register (blank UID)"
              >
                New
              </button>
            </div>
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
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              >
                <FaDownload /> Export CSV
              </button>
              <button
                type="button"
                onClick={openImport}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 text-sm"
              >
                <FaUpload /> Import CSV
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Rows</label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 border rounded text-sm"
              >
                {[5,10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input
                type="text"
                placeholder="Search by name / UID / barangay / status / age / birthdate"
                className="w-full md:w-72 px-3 py-2 border rounded"
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed rounded-lg mt-4">
            <img src="/no-card.png" alt="No card" className="w-20 h-20 mb-4 opacity-60" />
            <h2 className="text-xl font-semibold mb-2">No card detected</h2>
            <p className="text-gray-500 max-w-md">
              Scan a senior citizen RFID card to view eligibility status and process benefit claims
            </p>
          </div>

          {/* Registered Seniors table (desktop/tablet) */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Registered Seniors</h3>
              <div className="text-xs text-gray-500">
                Sorting: <b>{sortKey}</b> ({sortDir}) • Page {currentPage} / {totalPages}
              </div>
            </div>

            {/* Table for sm+ */}
            <div className="overflow-auto rounded-lg border hidden sm:block">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className={headerCell}>Photo</th>
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
                    <th className={headerCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length > 0 ? (
                    pageRows.map((r) => {
                      const duplicateCount = registeredSeniors.filter(
                        (s) =>
                          (s.name || "").toLowerCase().trim() ===
                          (r.name || "").toLowerCase().trim()
                      ).length;
                      const isDuplicate = duplicateCount > 1;

                      return (
                        <tr key={r.uid} className={`border-b ${isDuplicate ? "bg-orange-50" : ""}`}>
                          <td className={`${dataCell}`}>
                            <div className="flex items-center">
                              <Photo base64={r.photoBase64} name={r.name} />
                            </div>
                          </td>
                          <td className={`${dataCell} font-mono whitespace-nowrap`}>{r.uid}</td>
                          <td className={`${dataCell} font-medium`}>{r.name}</td>
                          <td className={dataCell}>{r.age}</td>
                          <td className={dataCell}>{r.birthdate || "-"}</td>
                          <td className={dataCell}>{r.barangay}</td>
                          <td className={`${dataCell}`}>{statusPill(r.status)}</td>
                          <td className={dataCell}>{formatCurrency(r.current_balance)}</td>
                          <td className={`${dataCell}`}>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                                title="Edit"
                                onClick={() => openEditModal(r)}
                              >
                                <FaEdit />
                              </button>

                              {/* <button
                                type="button"
                                className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                                title="Delete"
                                onClick={() => setDeleteTarget(r)}
                              >
                                <FaTrash />
                              </button> */}

                              <button
                                type="button"
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Claim payout"
                                onClick={() => openClaim(r)}
                              >
                                ₱
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={9}>
                        No registered seniors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list for Registered Seniors */}
            <div className="sm:hidden mt-3 space-y-3">
              {pageRows.length > 0 ? (
                pageRows.map((r) => (
                  <div key={r.uid} className="border rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <Photo base64={r.photoBase64} name={r.name} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">{r.name}</div>
                          <div className="text-xs font-mono break-all">{r.uid}</div>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {statusPill(r.status)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 gap-2">
                      <div>Age: <span className="font-medium">{r.age}</span></div>
                      <div>Birthdate: <span className="font-medium">{r.birthdate || "-"}</span></div>
                      <div>Barangay: <span className="font-medium">{r.barangay}</span></div>
                      <div>Balance: <span className="font-medium">{formatCurrency(r.current_balance)}</span></div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs"
                        onClick={() => openEditModal(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded bg-red-600 text-white text-xs"
                        onClick={() => setDeleteTarget(r)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs"
                        onClick={() => openClaim(r)}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 rounded border">No registered seniors found.</div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSortedSeniors.length)} of {filteredSortedSeniors.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                >
                  « First
                </button>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Prev
                </button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next ›
                </button>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last »
                </button>
              </div>
            </div>
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
                    <FaInfoCircle className="text-blue-600 cursor-pointer" title="Details (not implemented)" />
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
      {/* Register / Edit Modal */}
      {showModal && (
        <Modal
          title={isEdit ? "Edit Senior" : "Register Senior"}
          onClose={closeModalReset}
          widthClass="w-[840px]"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={closeModalReset}
                className="px-4 py-2 bg-gray-300 rounded"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : (isEdit ? "Update" : "Save")}
              </button>
            </div>
          }
        >
          {/* Grid layout: 3 columns on wide, stack on small */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1 */}
            <div>
              {/* UID */}
              <div className="mb-3">
                <label className="text-xs text-gray-600">UID</label>
                <input
                  type="text"
                  value={form.uid}
                  onChange={(e) => setForm({ ...form, uid: e.target.value.trim() })}
                  className={`w-full border p-2 rounded ${isEdit ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  readOnly={isEdit}
                />
                {!form.uid && <p className="text-xs text-amber-600 mt-1">Tip: You can paste a scanned UID here.</p>}
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
                        inputName.toLowerCase().trim() &&
                        (!isEdit || senior.uid !== form.uid)
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

              {/* Age (computed) */}
              <div className="mb-3">
                <label className="text-xs text-gray-600">Computed Age</label>
                <input
                  type="number"
                  value={form.age || ""}
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100 text-gray-700"
                />
              </div>
            </div>

            {/* Column 3 - Photo */}
            <div>
              <label className="text-xs text-gray-600">Profile Photo</label>
              <div className="mt-1 border rounded-lg p-3 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 grid place-items-center">
                  {form.photoBase64 ? (
                    <img
                      src={form.photoBase64}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No photo</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded bg-gray-800 text-white text-xs cursor-pointer hover:bg-black">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPickImage}
                    />
                  </label>
                  {form.photoBase64 && (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-red-600 text-white text-xs"
                      onClick={removeImage}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 text-center">
                  Stored as Base64 in Realtime DB. Prefer small images to keep data light.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal
          title="Delete Record"
          onClose={() => setDeleteTarget(null)}
          widthClass="w-[520px]"
          footer={
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={confirmDelete}>Delete</button>
            </div>
          }
        >
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <b>{deleteTarget.name}</b> (<span className="font-mono">{deleteTarget.uid}</span>)? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* Claim Modal */}
      {claimTarget && (
        <Modal
          title="Claim Payout"
          onClose={closeClaim}
          widthClass="w-[520px]"
          footer={
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={closeClaim}>Cancel</button>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={doClaim}>Confirm Claim</button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">{claimTarget.name}</div>
              <div className="text-xs text-gray-600 font-mono">{claimTarget.uid}</div>
              <div className="mt-1 text-xs text-gray-600">Barangay: <span className="font-medium text-gray-800">{claimTarget.barangay}</span></div>
              <div className="mt-1 text-xs text-gray-600">Current Balance: <span className="font-medium text-gray-800">{formatCurrency(claimTarget.current_balance)}</span></div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Claim Amount</label>
              <input
                type="number"
                step="0.01"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Quarter: {quarter}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal
          title="Import CSV"
          onClose={closeImport}
          widthClass="w-[620px]"
          footer={
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={closeImport}>Close</button>
            </div>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              CSV columns: <code className="bg-gray-100 px-1 rounded">uid,name,age,birthdate,barangay,status,current_balance,photoBase64,createdAt,updatedAt</code>
            </p>
            <input type="file" accept=".csv,text/csv" ref={importInputRef} onChange={handleImportFile} />
            <div className="text-xs text-gray-600">
              Tip: Leave <b>age</b> blank to auto-compute from <b>birthdate</b>.
            </div>
          </div>
        </Modal>
      )}

      {/* Footer / Small help */}
      <footer className="mt-10 text-xs text-gray-500 text-center">
        Press <span className="px-1 bg-gray-200 rounded">/</span> to focus search (browser), or click “Manual ID entry” to focus scanner input.
      </footer>
    </main>
  );
};

export default Pension;
