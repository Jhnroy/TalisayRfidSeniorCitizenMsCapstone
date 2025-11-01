import React, { useState, useEffect, useRef } from "react";
import { rtdb } from "../../router/Firebase";
import { ref, onValue } from "firebase/database";
import {
  FaFolder,
  FaFolderOpen,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function RfidClaimingInterface() {
  const [showModal, setShowModal] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);
  const [groupedScans, setGroupedScans] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [docToView, setDocToView] = useState(null);

  const lastScanRef = useRef("");
  const timerRef = useRef(null);

  useEffect(() => {
    const bindingsRef = ref(rtdb, "rfidBindings");

    const unsubscribe = onValue(bindingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const entries = Object.entries(data).map(([rfid, info]) => ({
        rfid,
        ...info,
      }));

      // Group entries by claim month
      const grouped = {};
      entries.forEach((entry) => {
        const claimDate = entry.claimDate
          ? new Date(entry.claimDate)
          : new Date();
        const monthYear = claimDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        if (!grouped[monthYear]) grouped[monthYear] = [];
        grouped[monthYear].push(entry);
      });
      setGroupedScans(grouped);

      // Handle latest scan
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) return;
      if (lastEntry.rfid === lastScanRef.current) return;
      lastScanRef.current = lastEntry.rfid;

      showBeneficiary(lastEntry);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleMonth = (month) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const showBeneficiary = (entry) => {
    setBeneficiary(entry);
    setShowModal(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowModal(false);
      setBeneficiary(null);
      lastScanRef.current = "";
    }, 5000);
  };

  const openDocumentModal = (url, title) => {
    setDocToView({ url, title });
    setShowDocModal(true);
  };

  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocToView(null);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          RFID Claiming Interface
        </h1>
        <p className="text-gray-600 mb-6 text-center max-w-xl">
          Scan the beneficiary RFID tag or click a record below to view their
          claim details.
        </p>

        {/* Grouped Beneficiaries */}
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[75vh]">
          {Object.keys(groupedScans).length === 0 ? (
            <p className="text-gray-500 text-center">
              No beneficiaries found.
            </p>
          ) : (
            Object.entries(groupedScans).map(([monthYear, items]) => (
              <div key={monthYear} className="mb-5">
                <div
                  className="flex items-center gap-2 cursor-pointer mb-3 transition-colors hover:text-blue-600"
                  onClick={() => toggleMonth(monthYear)}
                >
                  {expandedMonths[monthYear] ? (
                    <FaFolderOpen className="text-blue-500" />
                  ) : (
                    <FaFolder className="text-gray-500" />
                  )}
                  <h2 className="text-xl font-semibold">{monthYear}</h2>
                </div>

                {expandedMonths[monthYear] && (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.rfid}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition"
                        onClick={() => showBeneficiary(item)}
                      >
                        {/* Profile Picture */}
                        {item.profilePicture ? (
                          <img
                            src={item.profilePicture}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                            N/A
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            <strong>Senior ID:</strong> {item.seniorId}
                            {item.suffix ? `-${item.suffix}` : ""}
                          </p>
                          <p className="text-gray-600">
                            <strong>RFID:</strong> {item.rfid}
                          </p>
                          <p className="text-gray-700">
                            <strong>Name:</strong> {item.firstName}{" "}
                            {item.middleName} {item.lastName}
                            {item.suffix ? ` ${item.suffix}` : ""}
                          </p>
                          <p className="text-gray-600">
                            <strong>Age:</strong> {item.age} |{" "}
                            <strong>Barangay:</strong> {item.barangay}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Beneficiary Modal */}
      {showModal && beneficiary && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setBeneficiary(null);
            lastScanRef.current = "";
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Claim Verified
            </h2>

            {/* Profile */}
            {beneficiary.profilePicture ? (
              <img
                src={beneficiary.profilePicture}
                alt="Profile"
                className="mx-auto mb-4 w-28 h-28 object-cover rounded-full border"
              />
            ) : (
              <div className="mx-auto mb-4 w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium">
                N/A
              </div>
            )}

            <div className="text-left space-y-2 mb-4">
              <p>
                <strong>Senior ID:</strong> {beneficiary.seniorId}
                {beneficiary.suffix ? `-${beneficiary.suffix}` : ""}
              </p>
              <p>
                <strong>RFID:</strong> {beneficiary.rfid}
              </p>
              <p>
                <strong>Name:</strong> {beneficiary.firstName}{" "}
                {beneficiary.middleName} {beneficiary.lastName}
                {beneficiary.suffix ? ` ${beneficiary.suffix}` : ""}
              </p>
              <p>
                <strong>Age:</strong> {beneficiary.age}
              </p>
              <p>
                <strong>Barangay:</strong> {beneficiary.barangay}
              </p>
              <p>
                <strong>Gender:</strong> {beneficiary.gender}
              </p>
              <p>
                <strong>Contact:</strong> {beneficiary.contactNumber}
              </p>

              {/* Barangay Certificate */}
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  <strong>Valid I.D:</strong>{" "}
                  {beneficiary.barangayCertificate ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <FaCheckCircle /> Available
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <FaTimesCircle /> Not Uploaded
                    </span>
                  )}
                </p>
                {beneficiary.barangayCertificate && (
                  <button
                    onClick={() =>
                      openDocumentModal(
                        beneficiary.barangayCertificate,
                        "Valid I.D"
                      )
                    }
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    View
                  </button>
                )}
              </div>

              {/* Birth Certificate */}
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  <strong>Birth Certificate:</strong>{" "}
                  {beneficiary.birthCertificate ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <FaCheckCircle /> Available
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <FaTimesCircle /> Not Uploaded
                    </span>
                  )}
                </p>
                {beneficiary.birthCertificate && (
                  <button
                    onClick={() =>
                      openDocumentModal(
                        beneficiary.birthCertificate,
                        "Birth Certificate"
                      )
                    }
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    View
                  </button>
                )}
              </div>

              <p>
                <strong>Claim Date:</strong>{" "}
                {new Date(
                  beneficiary.claimDate || new Date()
                ).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setBeneficiary(null);
                lastScanRef.current = "";
                if (timerRef.current) clearTimeout(timerRef.current);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocModal && docToView && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={closeDocumentModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-3xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
              {docToView.title}
            </h3>

            {docToView.url.endsWith(".pdf") ? (
              <iframe
                src={docToView.url}
                title={docToView.title}
                className="w-full h-[70vh] border rounded-lg"
              ></iframe>
            ) : (
              <img
                src={docToView.url}
                alt={docToView.title}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}

            <button
              onClick={closeDocumentModal}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
