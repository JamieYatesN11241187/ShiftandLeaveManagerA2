import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";
const btn = "px-3 py-1 rounded text-white text-sm font-medium";
const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-500`;
const btnDanger = `${btn} bg-red-500 hover:bg-red-600`;
const btnSecondary = `${btn} bg-gray-300 text-gray-800 hover:bg-gray-400`;
const input = "w-full p-2 border rounded text-sm";
const card = "bg-white p-6 rounded shadow";

//=== State Base ===
class LeaveRequestState {
    constructor(context) {
        this.context = context; // eference to LeaveRequest 
    }
    approve() {}
    reject() {}
    renderActions() {
        return null;
    }
}

// === Concrete States ===
class PendingState extends LeaveRequestState {
    renderActions() {
        return (
            <div className="space-x-2">
                <button onClick={() => this.approve()} className={btnPrimary}>
                    Approve
                </button>
                <button onClick={() => this.reject()} className={btnDanger}>
                    Reject
                </button>
            </div>
        );
    }
    approve() {
        this.context.transitionTo(new ApprovedState(this.context));
    }
    reject() {
        this.context.transitionTo(new RejectedState(this.context));
    }
}
class ApprovedState extends LeaveRequestState {
    renderActions() {
        return (
            <button onClick={() => this.reject()} className={btnDanger}>
                Reject
            </button>
        );
    }
    reject() {
        this.context.transitionTo(new RejectedState(this.context));
    }
}

class RejectedState extends LeaveRequestState {
    renderActions() {
        return (
            <button onClick={() => this.approve()} className={btnPrimary}>
                Approve
            </button>
        );
    }

    approve() {
        this.context.transitionTo(new ApprovedState(this.context));
    }
}

// === Context ===
class LeaveRequest {
    constructor(data, handleStatusUpdate) {
        this.id = data._id;
        this.person = data.person;
        this.start = data.start;
        this.end = data.end;
        this.status = data.status;
        this.handleStatusUpdate = handleStatusUpdate;

        switch (this.status) {
            case "approved":
                this.state = new ApprovedState(this);
                break;
            case "rejected":
                this.state = new RejectedState(this);
                break;
            default:
                this.state = new PendingState(this);
        }
    }
    transitionTo(state) {
        this.state = state;
        const newStatus = this.getStatus();
        this.status = newStatus; // sync local status
        this.handleStatusUpdate(this.id, newStatus);
    }
    getStatus() {
        if (this.state instanceof ApprovedState) return "approved";
        if (this.state instanceof RejectedState) return "rejected";
        return "pending";
    }

    renderActions() {
        return this.state.renderActions();
    }
}

// === Main Component ===
const LeaveRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        start: "",
        end: "",
        person: "",
        status: "pending",
    });

    useEffect(() => {
        if (!user?.token) return;

        const fetchData = async () => {
            try {
                const [reqRes, profileRes] = await Promise.all([
                    axiosInstance.get("/api/leave-requests", {
                        headers: { Authorization: `Bearer ${user.token}` },
                    }),
                    axiosInstance.get("/api/auth/profile", {
                        headers: { Authorization: `Bearer ${user.token}` },
                    }),
                ]);

                setRequests(reqRes.data);
                setFormData((f) => ({ ...f, person: profileRes.data.name }));
            } catch {
                console.error("Failed to load data");
            }
        };

        fetchData();
    }, [user]);

    const handleCreateRequest = async () => {
        if (!formData.start || !formData.end) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            await axiosInstance.post("/api/leave-requests", formData, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setFormVisible(false);
            setFormData((f) => ({ ...f, start: "", end: "" }));
            const refreshed = await axiosInstance.get("/api/leave-requests", {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setRequests(refreshed.data);
        } catch {
            alert("Failed to create leave request.");
        }
    };
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axiosInstance.put(
                `/api/leave-requests/${id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setRequests((prev) =>
                prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
            );
        } catch {
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/api/leave-requests/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setRequests((prev) => prev.filter((r) => r._id !== id));
        } catch {
            alert("Failed to delete request.");
        }
    };
    const formatDate = (d) => new Date(d).toLocaleDateString("en-GB");
    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
                    Leave Requests
                </h2>

                {user.role !== "manager" && (
                    <div className="mb-4 text-center">
                        <button
                            onClick={() => setFormVisible(true)}
                            className={btnPrimary}
                        >
                            New Request
                        </button>
                    </div>
                )}
                <div className="bg-white shadow rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Start Date</th>
                                <th className="p-3">End Date</th>
                                <th className="p-3">Status</th>
                                {user.role !== "manager" && <th className="p-3">Actions</th>}
                                {user.role === "manager" && <th className="p-3">Update</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-500">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => {
                                    const leaveRequest = new LeaveRequest(req, handleStatusUpdate);
                                    return (
                                        <tr key={leaveRequest.id} className="text-center border-b">
                                            <td className="p-3">{leaveRequest.person}</td>
                                            <td className="p-3">{formatDate(leaveRequest.start)}</td>
                                            <td className="p-3">{formatDate(leaveRequest.end)}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        leaveRequest.getStatus() === "approved"
                                                            ? "bg-green-500 text-white"
                                                            : leaveRequest.getStatus() === "pending"
                                                            ? "bg-orange-400 text-white"
                                                            : "bg-red-500 text-white"
                                                    }`}
                                                >
                                                    {leaveRequest.getStatus()}
                                                </span>
                                            </td>
                                            {user.role !== "manager" && (
                                                <td className="p-3">
                                                    {(leaveRequest.getStatus() === "approved" ||
                                                        leaveRequest.getStatus() === "pending") && (
                                                        <button
                                                            onClick={() => handleDelete(leaveRequest.id)}
                                                            className={btnDanger}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                            {user.role === "manager" && (
                                                <td className="p-3">{leaveRequest.renderActions()}</td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {formVisible && user.role !== "manager" && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <div className={`${card} max-w-md mx-auto`}>
                            <h3 className="text-lg font-bold mb-4 text-blue-600">
                                New Leave Request
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="date"
                                    value={formData.start}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start: e.target.value })
                                    }
                                    className={input}
                                />
                                <input
                                    type="date"
                                    value={formData.end}
                                    onChange={(e) =>
                                        setFormData({ ...formData, end: e.target.value })
                                    }
                                    className={input}
                                />
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <button
                                    onClick={() => setFormVisible(false)}
                                    className={btnSecondary}
                                >
                                    Cancel
                                </button>
                                <button onClick={handleCreateRequest} className={btnPrimary}>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default LeaveRequests;
