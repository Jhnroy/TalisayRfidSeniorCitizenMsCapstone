import React from "react";

const Validation = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">DSWD Validation</h1>
        <p className="text-gray-500">External validation process management</p>
      </div>

      {/* Validation Process Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { step: 1, title: "Export List", desc: "Generate list of  registrants for DSWD review" },
          { step: 2, title: "DSWD Review", desc: "DSWD validates eligibility and returns results" },
          { step: 3, title: "Import Results", desc: "Upload validation results to update statuses" },
          { step: 4, title: "Forward to OSCA", desc: "Send validated results back to OSCA system" },
        ].map((item) => (
          <div
            key={item.step}
            className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center"
          >
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center mb-2">
              {item.step}
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">{item.title}</h2>
            <p className="text-gray-500 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Export List */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center text-center">
          <div className="mb-2 p-3 bg-orange-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4h16v-4M4 12l8 8 8-8M12 4v12" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Export List for DSWD</h3>
          <p className="text-gray-500 mb-2">Generate and download list of registrants for review</p>
          <p className="font-bold text-gray-900 mb-2">Registrants: 1,247</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Export List
          </button>
        </div>

        {/* Import Results */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center text-center">
          <div className="mb-2 p-3 bg-orange-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4h16v-4M4 12l8-8 8 8M12 4v16" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Import Validation Results</h3>
          <p className="text-gray-500 mb-2">Upload results returned by DSWD to update statuses</p>
          <p className="text-gray-400 text-sm mb-2">Last Import: 2024-01-15 14:30:22</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
            Import Results
          </button>
        </div>

        {/* Forward to OSCA */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center text-center">
          <div className="mb-2 p-3 bg-orange-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Forward to OSCA</h3>
          <p className="text-gray-500 mb-2">Send validated results back to OSCA for pension processing</p>
          <p className="text-gray-400 text-sm mb-2">Last Action: 2024-01-15 14:30:22</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Forward to OSCA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Validation;
