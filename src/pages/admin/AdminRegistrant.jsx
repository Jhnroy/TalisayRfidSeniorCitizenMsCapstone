import React, { useState, useEffect } from "react";
import { ref, push, onValue } from "firebase/database";
import { rtdb } from "./adminJS/AdminRegistrant.js" //  Firebase RTDB



///  Helper to log audit & notifications
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

    // 🔔 Save notification (Success/Error only)
    const notifRef = ref(rtdb, `notifications/${barangay}`);
    await push(notifRef, {
      message,
      type: status === "SUCCESS" ? "success" : "error",
      timestamp: new Date().toISOString(),
      read: false,
    });
  } catch (error) {
    console.error("Failed to save audit log/notification:", error);
  }
};




const AdminRegistrant = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    seniorId: '',
    disability: '',
    houseNo: '',
    streetName: '',
    barangay: '',
    municipality: 'Talisay',
    province: 'Camarines Norte',
    emergencyName: '',
    emergencyContact: '',
    emergencyRelationship: '',
    birthCertificate: null,
    barangayCertificate: null,
    consent: false,
    profilePicture: null
  });

  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  //  Listen to notifications
  useEffect(() => {
    if (!formData.barangay) return;
    const notifRef = ref(rtdb, `notifications/${formData.barangay}`);
    onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));
      setNotifications(list.reverse()); // newest first
    });
  }, [formData.barangay]);

  // Convert File → Base64
  const convertToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  };


  // Function to compute age from birthday
  const computeAge = (birthdate) => {
    if (!birthdate) return "";
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Handle field changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files[0]) {
      convertToBase64(files[0], (base64) => {
        setFormData((prev) => ({
          ...prev,
          [name]: base64,
        }));

        if (name === "profilePicture") {
          setProfilePreview(base64);
        }
      });
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  //  Number-only handler for contact numbers (max 11 digits)
  const handleNumberInput = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // remove letters/symbols
    if (value.length <= 11) {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: value,
      }));
    }
  };

    // Handle submit → Save to Firebase RTDB
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const age = computeAge(formData.dateOfBirth);

    if (age < 60) {
      alert("Only senior citizens aged 60 and above can be registered.");
      await logAudit(formData.barangay, "REGISTER_SENIOR", "ERROR", "Age below 60");
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(formData.seniorId)) {
      alert("Senior Citizen ID must be exactly 4 digits.");
      await logAudit(formData.barangay, "REGISTER_SENIOR", "ERROR", "Invalid Senior ID format");
      setLoading(false);
      return;
    }

    const contactRegex = /^(09\d{9}|\+639\d{9})$/;
    if (!contactRegex.test(formData.contactNumber)) {
      alert("Please enter a valid Philippine contact number (09XXXXXXXXX or +639XXXXXXXXX).");
      await logAudit(formData.barangay, "REGISTER_SENIOR", "ERROR", "Invalid contact number format");
      setLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();

      await push(ref(rtdb, "senior_citizens"), {
        ...formData,
        age,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(
        formData.barangay,
        "REGISTER_SENIOR",
        "SUCCESS",
        `Senior ${formData.lastName}, ${formData.firstName} registered successfully`,
        "admin_001"
      );

      alert("Senior Citizen registration saved successfully!");

      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        contactNumber: "",
        seniorId: "",
        disability: "",
        houseNo: "",
        streetName: "",
        purok: "",
        barangay: "",
        municipality: "Talisay",
        province: "Camarines Norte",
        emergencyName: "",
        emergencyContact: "",
        emergencyRelationship: "",
        birthCertificate: null,
        barangayCertificate: null,
        consent: false,
        profilePicture: null,
      });

      setProfilePreview(null);
      document.querySelectorAll('input[type="file"]').forEach((input) => {
        input.value = "";
      });
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
      await logAudit(formData.barangay, "REGISTER_SENIOR", "ERROR", error.message || "Unknown error occurred");
    }

    setLoading(false);
  };





  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All entered data will be lost.")) {
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        contactNumber: "",
        seniorId: "",
        disability: "",
        houseNo: "",
        streetName: "",
        barangay: "",
        municipality: "Talisay",
        province: "Camarines Norte",
        emergencyName: "",
        emergencyContact: "",
        emergencyRelationship: "",
        birthCertificate: null,
        barangayCertificate: null,
        consent: false,
        profilePicture: null,
      });
      setProfilePreview(null);
      document.querySelectorAll('input[type="file"]').forEach((input) => {
        input.value = "";
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Profile Picture */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-200 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            {/* Profile Picture Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <label htmlFor="profilePicture" className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    onChange={handleChange}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            </div>

            {/* Title Section */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Senior Citizen Registration
              </h1>
              <p className="text-lg text-gray-600">Register new senior citizen</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            New Registration
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Personal Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Personal Details
            </h2>

            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="middleName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date of Birth <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Computed Age Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={computeAge(formData.dateOfBirth)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Contact & ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="09XXXXXXXXX"
                  value={formData.contactNumber}
                  onInput={handleNumberInput} // ✅ digits only, max 11
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be 11 digits (e.g., 09123456789).
                </p>
              </div>

              {/* Senior ID */}
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
                  placeholder="Enter 4-digit ID Number"
                  value={formData.seniorId}
                  onInput={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // ✅ Numbers only
                    if (value.length <= 4) {
                      setFormData((prev) => ({
                        ...prev,
                        seniorId: value,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be exactly 4 digits.
                </p>
              </div>
            </div>

            {/* Disability */}
            <div>
                <label htmlFor="disability" className="block text-sm font-medium text-gray-700 mb-1">Disability/Illness</label>
              <select id="disability" name="disability" value={formData.disability} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select</option>
              <option value="With Disability">With Disability</option>
              <option value="N/A">N/A</option>
              <option value="Others">Others</option>
              </select>
              {formData.disability === "Others" && (
              <input type="text" name="otherDisability" placeholder="Please specify" value={formData.otherDisability} onChange={handleChange} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              )}
              </div>
          </div>

          {/* Address & Additional Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Address & Additional Information
            </h2>

            {/* Street Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* House Number with Dropdown + Input */}
                <div className="flex gap-2">
                  {/* Dropdown */}
                  <select
                    name="houseNoOption"
                    value={formData.houseNo === "N/A" ? "N/A" : "Number"}
                    onChange={(e) => {
                      if (e.target.value === "N/A") {
                        setFormData((prev) => ({
                          ...prev,
                          houseNo: "N/A",
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          houseNo: "",
                        }));
                      }
                    }}
                    className="w-25 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Number">Number</option>
                    <option value="N/A">N/A</option>
                  </select>

                  {/* Input */}
                  {formData.houseNo !== "N/A" && (
                    <input
                      type="text"
                      name="houseNo"
                      placeholder="House No. (max 3 digits)"
                      value={formData.houseNo}
                      onInput={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // ✅ Numbers only
                        if (value.length <= 3) {
                          setFormData((prev) => ({
                            ...prev,
                            houseNo: value,
                          }));
                        }
                      }}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      required
                    />
                  )}
                </div>

                {/* Street Name */}
                {/* <input
                  type="text"
                  name="streetName"
                  placeholder="Street Name"
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                /> */}

                {/* Purok Dropdown */}
                <select
                name="purok"
                value={formData.purok} // ✅ tama na
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Purok</option>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    Purok {num}
                  </option>
                ))}
              </select>

              </div>
            </div>



            {/* Barangay & Municipality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="barangay"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Barangay <span className="text-red-500">*</span>
                </label>

                <select
                  id="barangay"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required>

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
                <label
                  htmlFor="municipality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Municipality/City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>

            {/* Province */}
            <div className="mb-6">
              <label
                htmlFor="province"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                readOnly
              />
            </div>

            {/* Emergency Contact */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Emergency Contact
              </h3>

              <div className="mb-4">
                <label
                  htmlFor="emergencyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="emergencyName"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="emergencyContact"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    placeholder="09XXXXXXXXX"
                    value={formData.emergencyContact}
                    onChange={(e) => {
                      // Allow only digits
                      const value = e.target.value.replace(/\D/g, "");
                      // Limit to 11 digits
                      if (value.length <= 11) {
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: value,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={11}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="emergencyRelationship"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="emergencyRelationship"
                    name="emergencyRelationship"
                    placeholder="Relationship of the Contact"
                    value={formData.emergencyRelationship}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Required Documents */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Required Documents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="birthCertificate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Upload Birth Certificate <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  PDF, JPG or PNG (Max 5MB)
                </p>
                <input
                  type="file"
                  id="birthCertificate"
                  name="birthCertificate"
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  accept=".pdf,.jpg,.png"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="barangayCertificate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Upload Valid I.D{' '}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  PDF, JPG or PNG (Max 5MB)
                </p>
                <input
                  type="file"
                  id="barangayCertificate"
                  name="barangayCertificate"
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  accept=".pdf,.jpg,.png"
                  required
                />
              </div>
            </div>
          </div>

          {/* Consent & Compliance */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Consent & Compliance
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-gray-700 mb-4">
                I confirm that the senior citizen has given consent for their
                personal information to be collected and processed in accordance
                with the <strong>Data Privacy Act</strong>. This includes the
                collection, storage, and processing of personal data for the
                purpose of senior citizen services and benefits.
              </p>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label
                  htmlFor="consent"
                  className="ml-2 block text-sm text-gray-700"
                >
                  I agree to the terms and conditions
                </label>
              </div>
            </div>
          </div>


          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
              Register Senior Citizen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegistrant;