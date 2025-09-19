import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";
const btn = "px-3 py-1 rounded text-white text-sm font-medium";
const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-500`;
const btnDanger = `${btn} bg-red-500 hover:bg-red-600`;
const btnSecondary = `${btn} bg-gray-300 text-gray-800 hover:bg-gray-400`;
const input = "w-full p-2 border rounded text-sm";
const card = "bg-white p-6 rounded shadow";
const formatShift = (shiftString) => {
    const [startStr, endStr] = shiftString.split(" - ");
    const start = new Date(startStr);
    const end = new Date(endStr);
    const date = start.toLocaleDateString("en-GB");
    const startTime = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${startTime} - ${endTime}`;
};

/**
 *Row component for a single overtime request.
 *Handles both employee and manager views:
 *Employee: can delete their own pending/approved requests
 *Manager: can approve/reject with optional comments
 */
const OvertimeRow = ({ req, user, onDelete, onStatusUpdate }) => {
    const [comment, setComment] = useState("");

    return (
        <tr className="text-center border-b">
            <td className="p-3">{req.person}</td>
            <td className="p-3">{formatShift(req.shiftTimings)}</td>
            <td className="p-3">{req.hoursRequested}</td>
            <td className="p-3">{req.reason}</td>
            <td className="p-3">
                <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                        req.status === "approved"
                            ? "bg-green-500 text-white"
                            : req.status === "pending"
                            ? "bg-orange-400 text-white"
                            : "bg-red-500 text-white"
                    }`}
                >
                    {req.status}
                </span>
            </td>

            {user.role !== "manager" && (
                <td className="p-3">
                    {(req.status === "approved" || req.status === "pending") && (
                        <button onClick={() => onDelete(req._id)} className={btnDanger}>
                            Delete
                        </button>
                    )}
                </td>
            )}

            {user.role === "manager" && (
                <td className="p-3 space-y-2">
                    {req.status === "pending" && (
                        <>
                            <div className="space-x-2">
                                <button
                                    onClick={() => onStatusUpdate(req._id, "approved", comment)}
                                    className={btnPrimary}
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => onStatusUpdate(req._id, "rejected", comment)}
                                    className={btnDanger}
                                >
                                    Reject
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className={input}
                            />
                        </>
                    )}
                </td>
            )}
        </tr>
    );
};

const formatShiftOption = (shift) => {
    const start = new Date(shift.start);
    const end = new Date(shift.end);
    const date = start.toLocaleDateString("en-GB");
    const startTime = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${startTime} - ${endTime}`;
};

/**
 new overtime request.
 Fields: shift, hours, reason
 */
const OvertimeForm = ({ formData, setFormData, shifts, onCancel, onSubmit }) => (
    <div className={`${card} max-w-md mx-auto`}>
        <h3 className="text-lg font-bold mb-4 text-blue-600">New Overtime</h3>
        <div className="space-y-3">
            <select
                value={formData.shiftTimings}
                onChange={(e) => setFormData({ ...formData, shiftTimings: e.target.value })}
                className={input}
            >
                <option value="">Select shift</option>
                {shifts.map((s) => (
                    <option key={s._id} value={`${s.start} - ${s.end}`}>
                        {formatShiftOption(s)}
                    </option>
                ))}
            </select>

            <input
                type="number"
                placeholder="Hours"
                value={formData.hoursRequested}
                onChange={(e) => setFormData({ ...formData, hoursRequested: e.target.value })}
                className={input}
            />

            <textarea
                placeholder="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={input}
            />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
            <button onClick={onCancel} className={btnSecondary}>Cancel</button>
            <button onClick={onSubmit} className={btnPrimary}>Submit</button>
        </div>
    </div>
);

/**
 * Main page component that:
 * - Fetches requests, shifts, and user profile
 * - Displays overtime requests in a table
 * - Allows employees to submit requests
 * - Allows managers to approve/reject
 */
const OvertimeRequests = () => {
    const { user } = useAuth(); //Get logged-in user from context
    const [requests, setRequests] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        date: "",
        shiftTimings: "",
        reason: "",
        hoursRequested: "",
        person: "",
        status: "pending",
    });
    useEffect(() => {
        if (!user?.token) return;
        const fetchData = async () => {
            try {
                //Load data
                const [reqRes, shiftRes, profileRes] = await Promise.all([
                    axiosInstance.get("/api/overtime-requests", { headers: { Authorization: `Bearer ${user.token}` } }),
                    axiosInstance.get("/api/shifts/user", { headers: { Authorization: `Bearer ${user.token}` } }),
                    axiosInstance.get("/api/auth/profile", { headers: { Authorization: `Bearer ${user.token}` } }),
                ]);
                setRequests(reqRes.data);
                setShifts(shiftRes.data);
                setFormData((f) => ({ ...f, person: profileRes.data.name }));
            } catch {
                console.error("Failed to load data");
            }
        };
        fetchData();
    }, [user]);

    //Employeenew request
    const handleCreateRequest = async () => {
        if (!formData.shiftTimings || !formData.reason || !formData.hoursRequested) {
            alert("Please fill in all fields.");
            return;
        }
        if (formData.hoursRequested > 4) {
            alert("Overtime cannot exceed 4 hours per day.");
            return;
        }
        try {
            await axiosInstance.post("/api/overtime-requests", formData, { headers: { Authorization: `Bearer ${user.token}` } });
            setFormVisible(false);
            setFormData((f) => ({ ...f, date: "", shiftTimings: "", reason: "", hoursRequested: "" }));
            const refreshed = await axiosInstance.get("/api/overtime-requests", { headers: { Authorization: `Bearer ${user.token}` } });
            setRequests(refreshed.data);
        } catch {
            alert("Failed to create overtime request.");
        }
    };

    //Manager updates request status
    const handleStatusUpdate = async (id, newStatus, comment) => {
        try {
            await axiosInstance.put(
                `/api/overtime-requests/${id}`,
                { status: newStatus, comments: comment },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            //Update local state so UI reflects the change immediately
            setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status: newStatus, comments: comment } : r)));
        } catch {
            alert("Failed to update status.");
        }
    };

    //Employee deletes a request
    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/api/overtime-requests/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setRequests((prev) => prev.filter((r) => r._id !== id));
        } catch {
            alert("Failed to delete request.");
        }
    };
    const formatDate = (d) => new Date(d).toLocaleDateString("en-GB");
    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Overtime Requests</h2>
                {user.role !== "manager" && (
                    <div className="mb-4 text-center">
                        <button onClick={() => setFormVisible(true)} className={btnPrimary}>New Request</button>
                    </div>
                )}
                <div className="bg-white shadow rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Shift</th>
                                <th className="p-3">Hours</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Status</th>
                                {user.role !== "manager" && <th className="p-3">Actions</th>}
                                {user.role === "manager" && <th className="p-3">Update</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-gray-500">
                                        No requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <OvertimeRow
                                        key={req._id}
                                        req={req}
                                        user={user}
                                        onDelete={handleDelete}
                                        onStatusUpdate={handleStatusUpdate}
                                        formatDate={formatDate}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {formVisible && user.role !== "manager" && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <OvertimeForm
                            formData={formData}
                            setFormData={setFormData}
                            shifts={shifts}
                            onCancel={() => setFormVisible(false)}
                            onSubmit={handleCreateRequest}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
export default OvertimeRequests;
