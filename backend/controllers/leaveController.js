const LeaveRequest = require('../models/LeaveRequests');

// Endpoint to create a new leave request
// Accessible by authenticated non-manager users
exports.createLeaveRequest = async (req, res) => {
    try {
        const person = req.user?.name;
        if (!person) {
            // If user is not authenticated
            return res.status(400).json({ message: 'User not authenticated' });
        }
        // Create a new leave request instance
        const leaveRequest = new LeaveRequest({
            person,
            start: req.body.start,
            end: req.body.end,
            status: 'pending' // Default status when a leave request is created
        });

        await leaveRequest.save(); // Save the new leave request to the database
        res.status(201).json(leaveRequest); // Return the newly created leave request
    } catch (error) {
        //console.error("Create error:", error);
        res.status(500).json({ message: 'Failed to create leave request.', error: error.message });
    }
};

// Get all leave requests
// Endpoint to retrieve all leave requests (no role restriction shown here)
exports.getLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.find(); // Fetch all leave requests from the database
        res.json(requests); // Return the list of leave requests
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
    }
};

// Update Leave Request
// Endpoint to update an existing leave request
// Managers can update status; non-managers can update their own start/end dates
exports.updateLeaveRequest = async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findById(req.params.id);// Find leave request by ID
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Request not found' });// Handle not found
        }

        if (req.user.role === 'manager') {
            // Managers can only update the status
            leaveRequest.status = req.body.status || leaveRequest.status;
        } else {
            // Non-managers can update their own request (but not status)
            if (leaveRequest.person !== req.user.name) {
                return res.status(403).json({ message: 'You can only update your own leave request.' });
            }
            // Allow updates to start and end dates
            leaveRequest.start = req.body.start || leaveRequest.start;
            leaveRequest.end = req.body.end || leaveRequest.end;
        }

        const updatedLeaveRequest = await leaveRequest.save();
        res.json(updatedLeaveRequest);
    } catch (error) {
       // console.error("Update error:", error);
        res.status(500).json({ message: 'Failed to update leave request', error: error.message });
    }
};


// Delete Leave Request (non-managers only, own requests only)
exports.deleteLeaveRequest = async (req, res) => {
    const { id } = req.params;

    // Make sure req.user is defined
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized. No user found." });
    }

    // Disallow managers from deleting
    if (req.user.role === 'manager') {
        return res.status(403).json({ error: "Managers are not allowed to delete leave requests." });
    }

    try {
        const deleted = await LeaveRequest.findByIdAndDelete(id); // Attempt to delete the request by ID
        if (!deleted) {
            return res.status(404).json({ error: "Leave request not found." }); // Handle not found
        }
        res.status(200).json({ message: "Leave request deleted successfully." }); // Confirm deletion
    } catch (error) {
        //console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete leave request." });
    }
};

