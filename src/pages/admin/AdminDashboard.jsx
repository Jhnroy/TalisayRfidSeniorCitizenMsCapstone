import { FaUserPlus, FaMoneyBillWave, FaCheckCircle, FaFileAlt } from 'react-icons/fa';
import { FiUsers, FiCheck, FiClock } from 'react-icons/fi';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import { MdOutlineEventNote, MdOutlineVerifiedUser, MdOutlineCake } from 'react-icons/md';

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Total Senior Citizens</p>
            <h2 className="text-2xl font-bold">1,247</h2>
          </div>
          <FiUsers className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Active Recipients</p>
            <h2 className="text-2xl font-bold">1,089</h2>
          </div>
          <FiCheck className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Pending Applications</p>
            <h2 className="text-2xl font-bold">34</h2>
          </div>
          <FiClock className="text-orange-500 text-3xl" />
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600">Monthly Payout</p>
            <h2 className="text-2xl font-bold">₱2.1M</h2>
          </div>
          <HiOutlineCreditCard className="text-orange-500 text-3xl" />
        </div>
      </div>

      {/* Activities and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Recent Activities</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-gray-500 mt-1" />
              <div>
                <p>Maria Santos verified</p>
                <small className="text-gray-500">2 hours ago</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <FaUserPlus className="text-gray-500 mt-1" />
              <div>
                <p>New application from Juan Cruz</p>
                <small className="text-gray-500">4 hours ago</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineEventNote className="text-gray-500 mt-1" />
              <div>
                <p>Verification reminder sent</p>
                <small className="text-gray-500">6 hours ago</small>
              </div>
            </li>
          </ul>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Upcoming Schedule</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <HiOutlineCreditCard className="text-gray-500 mt-1" />
              <div>
                <p>Pension Payout</p>
                <small className="text-gray-500">March 15, 2025 - 9:00 AM</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineVerifiedUser className="text-gray-500 mt-1" />
              <div>
                <p>Verification Drive</p>
                <small className="text-gray-500">March 18, 2025 - 8:00 AM</small>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MdOutlineCake className="text-gray-500 mt-1" />
              <div>
                <p>Birthday Celebration</p>
                <small className="text-gray-500">March 20, 2025 - 2:00 PM</small>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-orange-50">
            <FaUserPlus className="text-orange-500" />
            <span>Add Senior Citizen</span>
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-green-50">
            <FaMoneyBillWave className="text-green-500" />
            <span>Process Payout</span>
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-green-50">
            <FaCheckCircle className="text-green-500" />
            <span>Verify Application</span>
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-blue-50">
            <FaFileAlt className="text-blue-500" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;