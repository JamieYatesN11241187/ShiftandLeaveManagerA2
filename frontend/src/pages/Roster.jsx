import { DayPilot, DayPilotCalendar, DayPilotNavigator } from "@daypilot/daypilot-lite-react";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import SwapIterator from "../utils/SwapIterator";
import {
    PickupShiftCommand,
    DropShiftCommand,
    RequestSwapCommand,
    ApproveSwapCommand
} from "../utils/Commands";

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
    const [users, setUsers] = useState([]); // Array of users for dropdown

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
                setUser(prev => ({ ...prev, role: response.data.role }));
            } catch (error) {
                alert('Failed to fetch profile. Please try again.');
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/users', {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                setUsers(response.data);
            } catch (error) {
                alert('Failed to fetch users. Please try again.');
            }
        };

        if (user && setUser) {
            fetchProfile();
            fetchUsers();
        }
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


    // Calling of Commands for shift operations
    const pickupShift = async (shiftId) => {
        try {
            const cmd = new PickupShiftCommand(shiftId, user);
            await cmd.execute();
            alert("Shift picked up successfully.");
            fetchShifts();
        } catch (error) {
            alert("Failed to pick up shift.");
        }
    };

    const dropShift = async (shiftId) => {
        try {
            const cmd = new DropShiftCommand(shiftId, user);
            await cmd.execute();
            alert("Shift dropped successfully.");
            fetchShifts();
        } catch (error) {
            alert("Failed to drop shift.");
        }
    };

    const requestSwap = async (shiftId) => {
        try {
            const cmd = new RequestSwapCommand(shiftId, user);
            await cmd.execute();
            alert("Swap request sent.");
        } catch (error) {
            alert("Failed to request swap.");
        }
    };

    const approveSwap = async (shiftId, swapId, action) => {
        try {
            const cmd = new ApproveSwapCommand(shiftId, swapId, action, user);
            await cmd.execute();
            alert(`Swap ${action}ed.`);
            fetchShifts();
            fetchSwaps();
        } catch (error) {
            alert(`Failed to ${action} swap.`);
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

       
// Place any additional functions (like fetchSwaps) here if needed, inside the Calendar component.

// A decorator to add display text + colors to shifts
function decorateShift(shift) {
    return {
        ...shift,
        text: shift.person === "unassigned" ? "[Available for pickup]" : shift.person,
        backColor: shift.person === "unassigned" ? "#ffcc00" : "#6aa84f"
    };
}


// Fetch all shifts from the backend and map to DayPilot format
const fetchShifts = async () => {
    try {
        const response = await axiosInstance.get('/api/shifts');
        const data = response.data;

        if (!data || data.length === 0) {
            setShifts([]);
            return;
        }
        const mappedShifts = data.map(ev =>
            decorateShift({
                id: ev._id,
                person: ev.person || "Unassigned",
                start: ev.start,
                end: ev.end
            })
        );

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
                            <select
                                value={formData.person}
                                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                                style={inputStyle}
                                required
                            >
                                <option value="" disabled>Select a person</option>
                                {users.map(user => (
                                    <option key={user._id} value={user.name}>{user.name}</option>
                                ))}
                            </select>
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
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {(() => {
                            const iter = new SwapIterator(swapRequests);
                            const items = [];
                            while (iter.hasNext()) {
                                const req = iter.next();
                                items.push(
                                    <li key={req.swap._id} style={{ marginBottom: "0.5rem" }}>
                                        {req.swap.from} wants to swap shift on{" "}
                                        {new Date(req.shift.start).toLocaleDateString()}
                                        <br />
                                        <button onClick={() => approveSwap(req.shiftId, req.swap._id, "accept")}>
                                            Accept
                                        </button>
                                        <button onClick={() => approveSwap(req.shiftId, req.swap._id, "reject")}>
                                            Reject
                                        </button>
                                    </li>
                                );
                            }
                            return items;
                        })()}
                    </ul>
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