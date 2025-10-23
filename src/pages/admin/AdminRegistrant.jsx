// AdminRegistrant.jsx
import React, { useState, useEffect } from "react";
import { rtdb, auth } from "./adminJS/AdminRegistrant.js"; // Firebase RTDB + Auth
import TalisayLogo from "/src/assets/Talisay-Logo.png";
import { ref, push, set, get,onValue } from "firebase/database";

/**
 * AdminRegistrant - Senior Citizen Registration
 * - Saves to RTDB under "senior_citizens"
 * - Logs audit entries under "auditLogs/{barangay}"
 * - Pushes notifications under "notifications/{barangay}"
 * - Encodes uploaded files to base64 (small production note: for large files, use Storage)
 */

/* ----- Helper: Audit + Notification Logging ----- */

const logAudit = async (barangay, action, status, message, userId = "Unknown") => {
  try {
    const logRef = ref(rtdb, `auditLogs/${barangay}`);
    await push(logRef, {
      action,
      status,
      message,
      performedBy: userId,
      timestamp: new Date().toISOString(),
    });

    const notifRef = ref(rtdb, `notifications/${barangay}`);
    await push(notifRef, {
      message,
      type: status === "SUCCESS" ? "success" : "error",
      timestamp: new Date().toISOString(),
      read: false,
    });
  } catch (err) {
    console.error("Failed to save audit log/notification:", err);
  }
};

/* ----- Generate Auto-Increment Senior ID (Firebase Counter) ----- */
const generateYearlySeniorId = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const counterRef = ref(rtdb, `senior_id_counter/${year}`);

  try {
    const snapshot = await get(counterRef);
    let currentCount = snapshot.val() || 0;
    const newCount = currentCount + 1;
    await set(counterRef, newCount);
    return `${year}-${String(newCount).padStart(3, "0")}`;
  } catch (err) {
    console.error("Failed to generate Senior ID:", err);
    return `${year}-999`; // fallback
  }
};

/* ----- AdminRegistrant Component ----- */
const AdminRegistrant = () => {
  const initialForm = {
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    seniorId: "",
    disability: "",
    otherDisability: "",
    houseNo: "",
    houseNoOption: "Number",
    purok: "",
    streetName: "",
    barangay: "",
    municipality: "Talisay",
    province: "Camarines Norte",
    emergencyName: "",
    emergencyContact: "",
    emergencyRelationship: "",
    monthlyPension: "",
    pensionSource: "",
    monthlyIncome: "",
    occupation: "",
    birthCertificate: null,
    barangayCertificate: null,
    alienCertificate: null,
    passport: null,
    consent: false,
    profilePicture: null,
  };

  const [formData, setFormData] = useState(initialForm);
  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  /* ----- Listen for Auth Changes ----- */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  /* ----- Notifications Listener ----- */
  useEffect(() => {
    if (!formData.barangay) return setNotifications([]);
    const notifRef = ref(rtdb, `notifications/${formData.barangay}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setNotifications(list.reverse());
    });
    return () => unsubscribe();
  }, [formData.barangay]);

  /* ----- Helpers ----- */
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const computeAge = (birthdate) => {
    if (!birthdate) return "";
    const today = new Date();
    const b = new Date(birthdate);
    let age = today.getFullYear() - b.getFullYear();
    if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--;
    return age;
  };

  /* Handle input changes including file uploads */
  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file" && files[0]) {
      try {
        const base64 = await convertToBase64(files[0]);
        setFormData((prev) => ({ ...prev, [name]: base64 }));
        if (name === "profilePicture") setProfilePreview(base64);
      } catch (err) {
        console.error("File read error:", err);
      }
      return;
    }
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* Number-only input helper */
  const handleNumberInput = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  /* Auto-generate Senior ID */
  useEffect(() => {
    if (!formData.seniorId) {
      (async () => {
        const id = await generateYearlySeniorId();
        setFormData((prev) => ({ ...prev, seniorId: id }));
      })();
    }
  }, []);

  /* ----- Submit Handler ----- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const age = computeAge(formData.dateOfBirth);

    // Basic Validations
    if (!formData.firstName || !formData.lastName) { alert("Please fill out first and last name."); setLoading(false); return; }
    if (!formData.dateOfBirth) { alert("Please select date of birth."); setLoading(false); return; }
    if (age < 60) { 
      alert("Only senior citizens aged 60+ can be registered."); 
      await logAudit(formData.barangay || "unknown", "REGISTER_SENIOR", "ERROR", "Age below 60", currentUser?.uid); 
      setLoading(false); 
      return; 
    }

    let seniorId = formData.seniorId || await generateYearlySeniorId();
    const contactRegex = /^(09\d{9}|\+639\d{9})$/;
    if (!contactRegex.test(formData.contactNumber)) {
      alert("Please enter a valid Philippine contact number.");
      await logAudit(formData.barangay || "unknown", "REGISTER_SENIOR", "ERROR", "Invalid contact number format", currentUser?.uid);
      setLoading(false);
      return;
    }
    if (!formData.barangay) { alert("Please select a barangay."); setLoading(false); return; }
    if (!formData.consent) { alert("Consent is required."); setLoading(false); return; }

    // Push data
    try {
      const now = new Date().toISOString();
      const payload = { ...formData, seniorId, age, createdAt: now, updatedAt: now };
      await push(ref(rtdb, "senior_citizens"), payload);

      await logAudit(
        formData.barangay,
        "REGISTER_SENIOR",
        "SUCCESS",
        `Senior ${formData.lastName}, ${formData.firstName} registered successfully`,
        currentUser?.uid
      );

      alert("Senior Citizen registration saved successfully!");
      setFormData(initialForm);
      setProfilePreview(null);
      document.querySelectorAll('input[type="file"]').forEach((input) => (input.value = ""));
    } catch (err) {
      console.error(err);
      alert("Failed to save data.");
      await logAudit(formData.barangay || "unknown", "REGISTER_SENIOR", "ERROR", err.message || "Unknown error", currentUser?.uid);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Cancel registration? All data will be lost.")) {
      setFormData(initialForm);
      setProfilePreview(null);
      document.querySelectorAll('input[type="file"]').forEach((input) => (input.value = ""));
    }
  };
  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Title Section */}
      <div className="flex items-center justify-center mb-2 space-x-4">
        <img src={TalisayLogo} alt="Talisay Logo" className="w-20 h-20 object-contain" />
        <div className="text-center">
          <h1 className="text-lg text-gray-600 leading-tight">
            Republic of the Philippines <br />
            Province of Camarines Norte <br />
            Municipality of Talisay
          </h1>
          <p className="text-2xl font-bold text-gray-900 mt-1">OFFICE FOR SENIOR CITIZENS AFFAIR (OSCA)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header with Profile */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-200 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <label htmlFor="profilePicture" className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onChange={handleChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">New Registration</div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Personal Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Personal Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              </div>

              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input type="text" id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
              </div>
            </div>

            <div>
              <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-1">
                Suffix
              </label>
              <select
                id="suffix"
                name="suffix"
                value={formData.suffix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              >

                <option value="">Select Suffix</option>
                <option value="Jr.">Jr.</option>
                <option value="Sr.">Sr.</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="text" value={computeAge(formData.dateOfBirth)} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                <input type="text" id="contactNumber" name="contactNumber" placeholder="09XXXXXXXXX" value={formData.contactNumber} onInput={handleNumberInput} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                <p className="text-xs text-gray-500 mt-1">Must be 11 digits (e.g., 09123456789).</p>
              </div>

              <div>
                <label
                  htmlFor="seniorId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senior Citizen ID Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  id="seniorId"
                  name="seniorId"
                  value={formData.seniorId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated format: YY-### (e.g., 25-123)
                </p>
            </div>
              
            </div>

            <div>
              <label htmlFor="disability" className="block text-sm font-medium text-gray-700 mb-1">Disability/Illness</label>
              <select id="disability" name="disability" value={formData.disability} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Select</option>
                <option value="With Disability">With Disability</option>
                <option value="N/A">N/A</option>
                <option value="Others">Others</option>
              </select>
              {formData.disability === "Others" && (
                <input type="text" name="otherDisability" placeholder="Please specify" value={formData.otherDisability} onChange={handleChange} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              )}
            </div>
          </div>

          {/* Address & Additional Info */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Address & Additional Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-2">
                  <select name="houseNoOption" value={formData.houseNoOption} onChange={(e) => {
                    const v = e.target.value;
                    if (v === "N/A") setFormData(prev => ({ ...prev, houseNo: "N/A", houseNoOption: "N/A" }));
                    else setFormData(prev => ({ ...prev, houseNo: "", houseNoOption: "Number" }));
                  }} className="px-2 py-2 border border-gray-300 rounded-md">
                    <option value="Number">Number</option>
                    <option value="N/A">N/A</option>
                  </select>

                  {formData.houseNoOption !== "N/A" && (
                    <input type="text" name="houseNo" placeholder="House No. (max 3 digits)" value={formData.houseNo} onInput={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 3) setFormData(prev => ({ ...prev, houseNo: v }));
                    }} className="w-full px-2 py-2 border border-gray-300 rounded-md text-center" required />
                  )}
                </div>

                <select name="purok" value={formData.purok} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                  <option value="">Select Purok</option>
                  {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>Purok {n}</option>)}
                </select>

                <input type="text" name="streetName" placeholder="Street Name (optional)" value={formData.streetName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 mb-1">Barangay <span className="text-red-500">*</span></label>
                <select id="barangay" name="barangay" value={formData.barangay} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                  <option value="">Select Barangay</option>
                  <option value="Binanuun">Binanuun</option>
                  <option value="Caawigan">Caawigan</option>
                  <option value="Cahabaan">Cahabaan</option>
                  <option value="Calintaan">Calintaan</option>
                  <option value="Del Carmen">Del Carmen</option>
                  <option value="Gabon">Gabon</option>
                  <option value="Itomang">Itomang</option>
                  <option value="Poblacion">Poblacion</option>
                  <option value="San Francisco">San Francisco</option>
                  <option value="San Isidro">San Isidro</option>
                  <option value="San Jose">San Jose</option>
                  <option value="San Nicolas">San Nicolas</option>
                  <option value="Sta. Cruz">Sta. Cruz</option>
                  <option value="Sta. Elena">Sta. Elena</option>
                  <option value="Sto. Niño">Sto. Niño</option>
                </select>
              </div>

              <div>
                <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">Municipality/City <span className="text-red-500">*</span></label>
                <input type="text" id="municipality" name="municipality" value={formData.municipality} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Province <span className="text-red-500">*</span></label>
              <input type="text" id="province" name="province" value={formData.province} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
            </div>

            {/* Emergency Contact */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Emergency Contact</h3>

              <div className="mb-4">
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name <span className="text-red-500">*</span></label>
                <input type="text" id="emergencyName" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                  <input type="text" id="emergencyContact" name="emergencyContact" placeholder="09XXXXXXXXX" value={formData.emergencyContact} onInput={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 11) setFormData(prev => ({ ...prev, emergencyContact: v }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={11} required />
                </div>

                <div>
                  <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700 mb-1">Relationship <span className="text-red-500">*</span></label>
                  <input type="text" id="emergencyRelationship" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
              </div>
            </div>
          </div>

          {/* Pension & Occupation */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Pension and Occupation Details <span className="text-gray-500 text-sm">(if applicable)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Monthly Pension Amount (₱)</label>
                  <input
                    type="number"
                    name="monthlyPension"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.monthlyPension}
                    onChange={handleNumberInput} // numeric-only handler
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Pension Source (SSS, GSIS, ATBP)</label>
                  <input
                    type="text"
                    name="pensionSource"
                    placeholder="Enter pension source"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.pensionSource}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Monthly Income (₱)</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.monthlyIncome}
                    onChange={handleNumberInput} // numeric-only
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Current Occupation (if applicable)</label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Enter current occupation"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.occupation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

          {/* Required Documents */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Required Documents</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="birthCertificate" className="block text-sm font-medium text-gray-700 mb-1">Upload Birth Certificate <span className="text-red-500">*</span></label>
                <p className="text-sm text-gray-500 mb-2">PDF, JPG or PNG (Max 5MB)</p>
                <input type="file" id="birthCertificate" name="birthCertificate" accept=".pdf,.jpg,.png" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>

              <div>
                <label htmlFor="barangayCertificate" className="block text-sm font-medium text-gray-700 mb-1">Upload Valid I.D <span className="text-red-500">*</span></label>
                <p className="text-sm text-gray-500 mb-2">PDF, JPG or PNG (Max 5MB)</p>
                <input type="file" id="barangayCertificate" name="barangayCertificate" accept=".pdf,.jpg,.png" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            </div>

            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">For Foreign Nationals <span className="text-gray-500 text-sm">(Optional)</span></h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="alienCertificate" className="block text-sm font-medium text-gray-700 mb-1">Upload Additional Naturalization Paper</label>
                  <p className="text-sm text-gray-500 mb-2">PDF, JPG or PNG (Max 5MB)</p>
                  <input type="file" id="alienCertificate" name="alienCertificate" accept=".pdf,.jpg,.png" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>

                <div>
                  <label htmlFor="passport" className="block text-sm font-medium text-gray-700 mb-1">Upload Valid Passport</label>
                  <p className="text-sm text-gray-500 mb-2">PDF, JPG or PNG (Max 5MB)</p>
                  <input type="file" id="passport" name="passport" accept=".pdf,.jpg,.png" onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Consent & Compliance */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Consent & Compliance</h2>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-gray-700 mb-4">I confirm that the senior citizen has given consent for their personal information to be collected and processed in accordance with the <strong>Data Privacy Act</strong>.</p>

              <div className="flex items-center">
                <input type="checkbox" id="consent" name="consent" checked={formData.consent} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" required />
                <label htmlFor="consent" className="ml-2 block text-sm text-gray-700">I agree to the terms and conditions</label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={handleCancel} className="w-full sm:w-auto px-6 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Cancel</button>
            <button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">{loading ? "Saving..." : "Register Senior Citizen"}</button>
          </div>
        </form>

        {/* Notifications list (simple display) */}
        {notifications.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Notifications ({notifications.length})</h3>
            <ul className="space-y-2 max-h-48 overflow-auto">
              {notifications.map((n) => (
                <li key={n.id} className="text-sm">
                  <span className="font-medium">{n.type?.toUpperCase() || "INFO"}:</span> {n.message} <span className="text-xs text-gray-400">({new Date(n.timestamp).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrant;
