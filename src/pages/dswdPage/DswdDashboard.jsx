import { useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";

const DSWDDashboard = () => {
  // 🔹 Static dummy data for frontend testing
  const [stats] = useState({
    totalApplications: 120,
    approved: 85,
    forReview: 25,
    rejected: 10,
    monthlyBudget: 500000,
    eligibleCount: 85,
  });

  const approvalRate =
    stats.totalApplications > 0
      ? ((stats.approved / stats.totalApplications) * 100).toFixed(1)
      : 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="text-blue-600 w-8 h-8" />
          <h2 className="font-bold text-xl text-gray-800">DSWD Dashboard</h2>
        </div>
        <nav className="space-y-4">
          <button className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-blue-100 transition">
            <FileText className="w-5 h-5 text-blue-600" />
            Applications
          </button>
          <button className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-blue-100 transition">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Approved
          </button>
          <button className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-blue-100 transition">
            <Clock className="w-5 h-5 text-orange-600" />
            Pending
          </button>
          <button className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-blue-100 transition">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Budget
          </button>
          <button className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-blue-100 transition">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Schedule
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-600 w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                DSWD Pensioner Validation Dashboard
              </h1>
              <p className="text-gray-600">
                Social Pension Eligibility Monitoring System
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <h2 className="text-3xl font-bold">{stats.totalApplications}</h2>
              </div>
              <FileText className="text-blue-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved Pensioners</p>
                <h2 className="text-3xl font-bold">{stats.approved}</h2>
                <p className="text-green-600 text-xs">{approvalRate}% Approval</p>
              </div>
              <CheckCircle className="text-green-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Validation</p>
                <h2 className="text-3xl font-bold">{stats.forReview}</h2>
              </div>
              <Clock className="text-orange-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Allocation</p>
                <h2 className="text-2xl font-bold">
                  ₱{stats.monthlyBudget.toLocaleString()}
                </h2>
                <p className="text-purple-600 text-xs">
                  {stats.eligibleCount} Beneficiaries
                </p>
              </div>
              <DollarSign className="text-purple-600 w-8 h-8" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DSWDDashboard;
