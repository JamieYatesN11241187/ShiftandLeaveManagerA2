import { DayPilot, DayPilotCalendar, DayPilotNavigator } from "@daypilot/daypilot-lite-react";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

// Modal overlay styling
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

// Modal container styling
const modalStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
};

// Input field styling
const inputStyle = {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    marginBottom: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc'
};

// Label styling
const labelStyle = {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
};

// Button styling
const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

// Layout styles
const styles = {
    wrap: { display: "flex" },
    left: { marginRight: "10px" },
    main: { flexGrow: "1" }
};

const Calendar = () => {
    // Convert local datetime string to UTC ISO format
    const toUtcISOString = (localDateTimeString) => {
        const localDate = new Date(localDateTimeString);
        const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        return utcDate.toISOString();
    };

    const { user, setUser } = useAuth(); // Get user and updater from context
    const today = new Date();

    const [calendar, setCalendar] = useState(null); // Reference to calendar control
    const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]); // Selected start date
    const [formVisible, setFormVisible] = useState(false); // Show/hide creation modal
    const [formData, setFormData] = useState({ person: '', start: '', end: '' }); // New shift form state
    const [shifts, setShifts] = useState([]); // Array of shift events for calendar

    const [editModalVisible, setEditModalVisible] = useState(false); // Show/hide edit modal
    const [editFormData, setEditFormData] = useState({ id: '', person: '', start: '', end: '' }); // Edit shift form state
    const [swapRequests, setSwapRequests] = useState([]); // Shift swap requests for sidebar

    useEffect(() => {
        // Fetch user profile to prefill name and update role
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                setFormData(prev => ({ ...prev, person: response.data.name }));
                setUser(prev => ({ ...prev, role: response.data.role }));
            } catch (error) {
                alert('Failed to fetch profile. Please try again.');
            }
        };

        if (user && setUser) fetchProfile();
    }, [user, setUser]);


    // Calendar configuration
    const config = {
        viewType: "Week",
        durationBarVisible: false,
        timeRangeSelectedHandling: "Enabled",

        // Right-click context menu
        contextMenu: new DayPilot.Menu({
            items: (() => {
                if (user?.role === "manager") {
                    return [
                        {
                            text: "Delete",
                            onClick: async args => {
                                const confirmed = window.confirm("Are you sure you want to delete this shift?");
                                if (!confirmed) return;
                                await deleteShift(args.source.data.id);
                            },
                        },
                        { text: "-" },
                        {
                            text: "Edit...",
                            onClick: async args => {
                                await editShift(args.source);
                            }
                        }
                    ];
                } else if (user?.role === "worker") {
                    // unassigned shifts → allow pickup
                    return [
                        {
                            text: "Pick Up Shift",
                            onClick: async args => {
                                const confirmed = window.confirm("Do you want to pick up this shift?");
                                if (!confirmed) return;
                                await pickupShift(args.source.data.id);
                            }
                        },
                        {
                            text: "Drop Shift",
                            onClick: async args => {
                                const confirmed = window.confirm("Do you want to drop this shift?");
                                if (!confirmed) return;
                                await dropShift(args.source.data.id);
                            }
                        },
                        {
                            text: "Request Swap",
                            onClick: async args => {
                                if (user?.role !== "worker") return;

                                try {
                                    await axiosInstance.post(
                                        `/api/swaps/${args.source.data.id}`,
                                        {}, // no toUser needed
                                        { headers: { Authorization: `Bearer ${user.token}` } }
                                    );
                                    alert("Swap request sent.");
                                } catch (error) {
                                    alert(error.response?.data?.message || "Failed to request swap.");
                                }
                            }
                        }
                    ];

                } else {
                    return []; // no menu for other roles
                }
            })()
        })
    };

    // Populate form with existing shift data for editing
    const editShift = async (e) => {
        if (!user || user?.role !== "manager") {
            alert("You do not have permission to edit shifts.");
            return;
        }

        setEditFormData({
            id: e.data.id,
            person: e.data.text,
            start: e.data.start.slice(0, 16),
            end: e.data.end.slice(0, 16)
        });

        setEditModalVisible(true);
    };

    // Delete shift by ID
    const deleteShift = async (shiftId) => {
        if (!user || user?.role !== "manager") {
            alert("You do not have permission to delete shifts.");
            return;
        }

        try {
            await axiosInstance.delete(`/api/shifts/${shiftId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchShifts(); // Refresh shift list
        } catch (error) {
            console.error("Failed to delete shift:", error);
            alert('Failed to delete shift. Please try again.');
        }
    };

    const dropShift = async (shiftId) => {
        if (!user || user?.role !== "worker") {
            alert("Only workers can drop their own shifts.");
            return;
        }

        try {
            await axiosInstance.put(
                `/api/shifts/${shiftId}/drop`,
                {}, // no body needed
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            alert("Shift dropped successfully.");
            fetchShifts(); // Refresh calendar/shift list
        } catch (error) {
            console.error("Failed to drop shift:", error);

            if (error.response && error.response.data && error.response.data.message) {
                alert(error.response.data.message);
            } else {
                alert("Failed to drop shift. Please try again.");
            }
        }
    };

    const pickupShift = async (shiftId) => {
        if (user?.role !== "worker") {
            alert("Only workers can pick up shifts.");
            return;
        }

        try {
            await axiosInstance.put(
                `/api/shifts/${shiftId}/pickup`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            alert("Shift picked up successfully.");
            fetchShifts(); // refresh calendar
        } catch (error) {
            console.error("Failed to pick up shift:", error);
            alert(error.response?.data?.message || "Failed to pick up shift.");
        }
    };

    // Fetch all swap requests
    const fetchSwaps = async () => {
        try {
            const response = await axiosInstance.get('/api/swaps/me', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSwapRequests(response.data || []);
        } catch (error) {
            console.error("Failed to fetch swap requests:", error);
            setSwapRequests([]);
        }
    };

    // Approve/reject a swap
    const approveSwap = async (shiftId, swapId, action) => {
        try {
            const response = await axiosInstance.put(
                `/api/swaps/${shiftId}/approval`,
                { swapId, action },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const updatedShift = response.data.shift;

            setShifts(prev =>
                prev.map(s => (s.id === updatedShift._id ? {
                    id: updatedShift._id,
                    text: updatedShift.person || "Unassigned",
                    start: updatedShift.start,
                    end: updatedShift.end,
                    backColor: "#6aa84f"
                } : s))
            );

            fetchSwaps();
        } catch (error) {
            console.error(`Failed to ${action} swap:`, error);
        }
    };

    // Fetch all shifts from the backend and map to DayPilot format
    const fetchShifts = async () => {
        try {
            const response = await axiosInstance.get('/api/shifts');
            const data = response.data;

            if (!data || data.length === 0) {
                setShifts([]);
                return;
            }

            const mappedShifts = data.map(ev => ({
                id: ev._id,
                text: ev.person || "Unassigned",
                start: ev.start,
                end: ev.end,
                backColor: "#6aa84f"
            }));

            setShifts(mappedShifts);
        } catch (error) {
            console.error("Failed to fetch shifts:", error);
            setShifts([]);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchShifts();
            fetchSwaps();
        }
    }, [user?.token]);

    return (
        <div>
            {/* Edit Shift Modal */}
            {editModalVisible && (
                <div style={overlayStyle}>
                    <div style={{ ...modalStyle, width: '350px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Edit Shift</h3>

                        {/* Edit form fields */}
                        <label style={labelStyle}>Person:
                            <input
                                type="text"
                                value={editFormData.person}
                                onChange={(e) => setEditFormData({ ...editFormData, person: e.target.value })}
                                style={inputStyle}
                            />
                        </label>
                        <label style={labelStyle}>Start:
                            <input
                                type="datetime-local"
                                value={editFormData.start}
                                onChange={(e) => setEditFormData({ ...editFormData, start: e.target.value })}
                                style={inputStyle}
                            />
                        </label>
                        <label style={labelStyle}>End:
                            <input
                                type="datetime-local"
                                value={editFormData.end}
                                onChange={(e) => setEditFormData({ ...editFormData, end: e.target.value })}
                                style={inputStyle}
                            />
                        </label>

                        {/* Action buttons */}
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                style={buttonStyle}
                                onClick={async () => {
                                    if (!editFormData.person || !editFormData.start || !editFormData.end) {
                                        alert("Please fill in all fields.");
                                        return;
                                    }

                                    try {
                                        await axiosInstance.put(`/api/shifts/${editFormData.id}`, {
                                            person: editFormData.person,
                                            start: toUtcISOString(editFormData.start),
                                            end: toUtcISOString(editFormData.end),
                                        }, {
                                            headers: { Authorization: `Bearer ${user.token}` }
                                        });

                                        setEditModalVisible(false);
                                        fetchShifts();
                                    } catch (error) {
                                        alert("Failed to update shift.");
                                        console.error(error);
                                    }
                                }}
                            >
                                Update
                            </button>
                            <button
                                style={{ ...buttonStyle, marginLeft: '10px', backgroundColor: '#ccc' }}
                                onClick={() => setEditModalVisible(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Shift Modal */}
            {formVisible && user && user?.role === "manager" && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: '1rem' }}>Create Time</h3>

                        {/* Form fields */}
                        <label style={labelStyle}>Person:
                            <input
                                type="text"
                                value={formData.person}
                                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                                style={inputStyle}
                            />
                        </label>
                        <label style={labelStyle}>Start:
                            <input
                                type="datetime-local"
                                value={formData.start}
                                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                style={inputStyle}
                            />
                        </label>
                        <label style={labelStyle}>End:
                            <input
                                type="datetime-local"
                                value={formData.end}
                                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                style={inputStyle}
                            />
                        </label>

                        {/* Action buttons */}
                        <div style={{ marginTop: '1rem' }}>
                            <button style={buttonStyle} onClick={async () => {
                                if (!formData.person || !formData.start || !formData.end) {
                                    alert("Please fill in all fields.");
                                    return;
                                }
                                try {
                                    await axiosInstance.post('/api/shifts',
                                        {
                                            person: formData.person,
                                            start: toUtcISOString(formData.start),
                                            end: toUtcISOString(formData.end),
                                        },
                                        {
                                            headers: { Authorization: `Bearer ${user.token}` }
                                        }
                                    );

                                    setFormVisible(false);
                                    setFormData({ person: '', start: '', end: '' });
                                    fetchShifts();
                                } catch (error) {
                                    alert('Failed to create Shift. In Roster returns.');
                                    console.error(error);
                                }
                            }}>
                                Create
                            </button>
                            <button
                                style={{ ...buttonStyle, marginLeft: '10px', backgroundColor: '#ccc' }}
                                onClick={() => setFormVisible(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar UI Layout */}
            <div style={styles.wrap}>
                <div style={styles.left}>
                    {/* Date selector (week-based) */}
                    <DayPilotNavigator
                        selectMode={"Week"}
                        showMonths={1}
                        skipMonths={1}
                        selectionDay={startDate}
                        onTimeRangeSelected={args => {
                            setStartDate(args.day);
                        }}
                    />
                    {/* Show Create Shift button for managers */}
                    {user && user?.role === "manager" && (
                        <button
                            style={{ ...buttonStyle, marginBottom: "1rem" }}
                            onClick={() => setFormVisible(true)}
                        >
                            Create Shift
                        </button>
                    )}
                    {/* Swap requests list */}
                    <div>
                        <h4 style={{ marginTop: "1rem" }}>Swap Requests</h4>

                        {swapRequests.length === 0 ? (
                            <p style={{ color: "#9ca3af", margin: "0.5rem 0" }}>No pending swap requests.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}>
                                {swapRequests.map((req) => {
                                    const d = new Date(req.shift.start);
                                    const dateStr = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
                                    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

                                    return (
                                        <li
                                            key={req.swap._id}
                                            style={{
                                                background: "#fff",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "16px",
                                                padding: "14px 16px",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{req.swap.from}</div>
                                                    <div style={{ color: "#6b7280", fontSize: ".9rem" }}>
                                                        wants to swap shift on {dateStr} at {timeStr}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => approveSwap(req.shiftId, req.swap._id, "accept")}
                                                    aria-label={`Approve swap request from ${req.swap.from}`}
                                                    style={{
                                                        borderRadius: 9999,
                                                        padding: "8px 14px",
                                                        border: "1px solid transparent",
                                                        background: "#f97316", // orange
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "transform .04s ease, filter .2s ease",
                                                    }}
                                                    onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                                                    onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => approveSwap(req.shiftId, req.swap._id, "reject")}
                                                    aria-label={`Reject swap request from ${req.swap.from}`}
                                                    style={{
                                                        borderRadius: 9999,
                                                        padding: "8px 14px",
                                                        border: "1px solid transparent",
                                                        background: "#111827", // near-black
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "transform .04s ease, filter .2s ease",
                                                    }}
                                                    onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                                                    onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                </div>

                <div style={styles.main}>
                    {/* DayPilot weekly calendar with shift events */}
                    {shifts.length > 0 ? (
                        <DayPilotCalendar
                            {...config}
                            events={shifts}
                            startDate={startDate}
                            controlRef={setCalendar}
                        />
                    ) : (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                            No shifts to display.
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}

export default Calendar;
