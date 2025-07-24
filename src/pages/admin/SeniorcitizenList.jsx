import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const SeniorcitizenList = () => {
    const [seniorCitizens, setSeniorCitizens] = useState([]);
    const [search, setSearch] = useState("");
    const [barangayFilter, setBarangayFilter] = useState("All");
    const [ageRangeFilter, setAgeRangeFilter] = useState("All");
    const [pensionStatusFilter, setPensionStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        // Sample static data (placeholder)
        const dummyData = [
            { id: "SC001", name: "Maria Santos", age: 68, barangay: "Poblacion", status: "Active" },
            { id: "SC002", name: "Juan Dela Cruz", age: 72, barangay: "Calintaan", status: "Pending" },
            { id: "SC003", name: "Rosa Garcia", age: 75, barangay: "Poblacion 3", status: "Suspended" },
        ];
        setSeniorCitizens(dummyData);
    }, []);

    const statusStyles = {
        Active: "bg-green-100 text-green-700",
        Pending: "bg-yellow-100 text-yellow-700",
        Suspended: "bg-red-100 text-red-700",
    };

    // Simple button component
    const CustomButton = ({ children, className = "", ...props }) => (
        <button
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${className}`}
            {...props}
        >
            {children}
        </button>
    );

    return (
        <main className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Senior Citizens</h1>
                <CustomButton>+ Add Senior Citizen</CustomButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    className="border p-2 rounded"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="border p-2 rounded" value={barangayFilter} onChange={(e) => setBarangayFilter(e.target.value)}>
                    <option>All Barangays</option>
                    <option>Poblacion</option>
                    <option>Calintaan</option>
                    <option>Poblacion 3</option>
                </select>
                <select className="border p-2 rounded" value={ageRangeFilter} onChange={(e) => setAgeRangeFilter(e.target.value)}>
                    <option>All Ages</option>
                    <option>60-69</option>
                    <option>70-79</option>
                    <option>80+</option>
                </select>
                <select className="border p-2 rounded" value={pensionStatusFilter} onChange={(e) => setPensionStatusFilter(e.target.value)}>
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Suspended</option>
                </select>
            </div>

            <div className="bg-white shadow rounded overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 font-medium">ID</th>
                            <th className="p-3 font-medium">Name</th>
                            <th className="p-3 font-medium">Age</th>
                            <th className="p-3 font-medium">Barangay</th>
                            <th className="p-3 font-medium">Pension Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seniorCitizens.map((sc) => (
                            <tr key={sc.id} className="border-t">
                                <td className="p-3">{sc.id}</td>
                                <td className="p-3 font-semibold">{sc.name}</td>
                                <td className="p-3">{sc.age}</td>
                                <td className="p-3">{sc.barangay}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[sc.status]}`}>
                                        {sc.status}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2 text-blue-600">
                                    <FaEye className="cursor-pointer" />
                                    <FaEdit className="cursor-pointer text-yellow-600" />
                                    <FaTrash className="cursor-pointer text-red-600" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">Showing 1 to 10 of 1,247 results</p>
                <div className="flex gap-1">
                    <button className="px-3 py-1 border rounded">{"<"}</button>
                    {[1, 2, 3].map((num) => (
                        <button
                            key={num}
                            className={`px-3 py-1 border rounded ${num === currentPage ? "bg-blue-500 text-white" : ""}`}
                        >
                            {num}
                        </button>
                    ))}
                    <span className="px-3 py-1">...</span>
                    <button className="px-3 py-1 border rounded">125</button>
                    <button className="px-3 py-1 border rounded">{">"}</button>
                </div>
            </div>
        </main>
    );
};

export default SeniorcitizenList;
