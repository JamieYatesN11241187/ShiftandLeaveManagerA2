import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Access authenticated user
import axiosInstance from '../axiosConfig'; // Axios instance with base config

const LeaveRequests = () => {
    const { user } = useAuth(); // Get authenticated user from context
    const [requests, setRequests] = useState([]); // Store list of leave requests
    const [formVisible, setFormVisible] = useState(false); // Toggle for modal form visibility
    const [formData, setFormData] = useState({ start: '', end: '', person: '', status: 'pending' }); // Form input state

    useEffect(() => {
        // Fetch all leave requests from the server
        const fetchRequests = async () => {
            try {
                const response = await axiosInstance.get('/api/leave-requests', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setRequests(response.data); // Populate state with response
            } catch (error) {
                setRequests([]); // Fallback in case of error
            }
        };

        // Fetch user profile to populate "person" field in form
        const fetchUserProfile = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setFormData(prev => ({
                    ...prev,
                    person: response.data.name
                }));
            } catch (error) {
                alert("Failed to fetch user profile");
            }
        };

        // Run both fetch functions if token is present
        if (user?.token) {
            fetchRequests();
            fetchUserProfile();
        }
    }, [user]);

    // Handle creation of a new leave request
    const handleCreateRequest = async () => {
        if (!formData.start || !formData.end) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            await axiosInstance.post(
                '/api/leave-requests',
                {
                    person: formData.person,
                    start: formData.start,
                    end: formData.end,
                    status: 'pending'
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            // Reset form and hide modal
            setFormVisible(false);
            setFormData({ start: '', end: '', person: formData.person, status: 'pending' });

            // Refresh requests after creation
            const response = await axiosInstance.get('/api/leave-requests', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Create error:", error);
            alert("Failed to create leave request.");
        }
    };

    // Handle updating leave request status (for managers)
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axiosInstance.put(
                `/api/leave-requests/${id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            // Update local state after success
            setRequests(prev =>
                prev.map(r => (r._id === id ? { ...r, status: newStatus } : r))
            );
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    // Handle deletion of a leave request (for non-managers)
    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/api/leave-requests/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Remove deleted request from state
            setRequests(prev => prev.filter(r => r._id !== id));
        } catch (error) {
            alert("Failed to delete request.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Leave Requests</h2>

            {/* Show create button only for non-managers */}
            {user.role !== 'manager' && (
                <div className="mb-4 text-center">
                    <button
                        onClick={() => setFormVisible(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Create Leave Request
                    </button>
                </div>
            )}

            {/* Table displaying all leave requests */}
            <table className="min-w-full bg-white shadow rounded">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Employee</th>
                        <th className="py-2 px-4 border-b">Dates</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        {user.role !== 'manager' && <th className="py-2 px-4 border-b">Actions</th>}
                        {user.role === 'manager' && <th className="py-2 px-4 border-b">Update Status</th>}
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-6 text-gray-500">No leave requests found.</td>
                        </tr>
                    ) : (
                        requests.map(req => (
                            <tr key={req._id}>
                                <td className="py-2 px-4 border-b">{req.person}</td>
                                <td className="py-2 px-4 border-b">{req.start} - {req.end}</td>
                                <td className="py-2 px-4 border-b">
                                    {/* Colored status badge */}
                                    <span className={
                                        req.status === 'approved'
                                            ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs'
                                            : req.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs'
                                                : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs'
                                    }>
                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                    </span>
                                </td>
                                {/* Delete action for non-managers */}
                                {user.role !== 'manager' && (
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            onClick={() => handleDelete(req._id)}
                                            className="text-red-500 hover:underline mr-2"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                )}
                                {/* Status update actions for managers */}
                                {user.role === 'manager' && (
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, 'approved')}
                                            className="text-green-600 hover:underline mr-2"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                            className="text-red-600 hover:underline"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal form for creating leave requests (non-managers only) */}
            {formVisible && user.role !== 'manager' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h3 className="text-lg font-bold mb-4">Create Leave Request</h3>
                        <label className="block mb-2">
                            Start Date:
                            <input
                                type="date"
                                value={formData.start}
                                onChange={e => setFormData({ ...formData, start: e.target.value })}
                                className="w-full p-2 border rounded mt-1"
                            />
                        </label>
                        <label className="block mb-2">
                            End Date:
                            <input
                                type="date"
                                value={formData.end}
                                onChange={e => setFormData({ ...formData, end: e.target.value })}
                                className="w-full p-2 border rounded mt-1"
                            />
                        </label>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleCreateRequest}
                                className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
                            >
                                Submit
                            </button>
                            <button
                                onClick={() => setFormVisible(false)}
                                className="bg-gray-300 text-black px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveRequests;
