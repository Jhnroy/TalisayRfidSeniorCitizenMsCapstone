import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

const AddNewMembers = () => {
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

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    gender: "",
    contactNumber: "",
    seniorId: "",
    streetAddress: "",
    barangay: "",
    city: "Talisay",
    province: "Camarines Norte",
    emergencyName: "",
    emergencyNumber: "",
    emergencyRelation: "",
    profilePicture: null,
    birthCertificate: null,
    barangayCertificate: null,
  });

  const [preview, setPreview] = useState(null);
  const [consent, setConsent] = useState(false);

  // Handle text & select inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, [name]: file });

      if (name === "profilePicture") {
        setPreview(URL.createObjectURL(file));
      }
    }
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consent) {
      alert("You must agree to the Data Privacy Act before submitting.");
      return;
    }
    console.log(formData);
    alert("Form Submitted!");
  };

  // Reusable input style
  const inputClass =
    "w-full border border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-400";

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg p-6 md:p-10">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Senior Citizen Registration
        </h1>
        <p className="text-gray-500 mb-6">Register new senior citizen</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <label
              htmlFor="profileUpload"
              className="cursor-pointer w-32 h-32 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-200"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle className="w-full h-full text-gray-400" />
              )}
            </label>
            <input
              id="profileUpload"
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Upload profile picture (JPG, PNG – max 5MB)
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Personal Details
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name"
                  onChange={handleChange}
                  className={inputClass}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <input
                  type="date"
                  name="dob"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <select
                  name="gender"
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Contact Number"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  name="seniorId"
                  placeholder="Senior Citizen ID Number"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Address & Additional Info */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Address & Additional Information
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  name="streetAddress"
                  placeholder="Street Address"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />

                {/* Barangay Select */}
                <select
                  name="barangay"
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((brgy, index) => (
                    <option key={index} value={brgy}>
                      {brgy}
                    </option>
                  ))}
                </select>

                {/* Fixed City */}
                <input
                  type="text"
                  name="city"
                  value="Talisay"
                  readOnly
                  className={`${inputClass} bg-gray-100`}
                />

                {/* Fixed Province */}
                <input
                  type="text"
                  name="province"
                  value="Camarines Norte"
                  readOnly
                  className={`${inputClass} bg-gray-100`}
                />

                <input
                  type="text"
                  name="emergencyName"
                  placeholder="Emergency Contact Name"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  name="emergencyNumber"
                  placeholder="Emergency Contact Number"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  name="emergencyRelation"
                  placeholder="Relationship to Emergency Contact"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Required Documents
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
                <p>Upload Birth Certificate *</p>
                <input
                  type="file"
                  name="birthCertificate"
                  onChange={handleFileChange}
                  className="mt-2"
                  required
                />
              </div>
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
                <p>Upload Barangay Certificate *</p>
                <input
                  type="file"
                  name="barangayCertificate"
                  onChange={handleFileChange}
                  className="mt-2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Data Privacy */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 mt-1"
            />
            <p className="text-sm text-gray-600">
              I confirm that the senior citizen has given consent for their
              personal information to be collected and processed in accordance
              with the Data Privacy Act.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewMembers;
