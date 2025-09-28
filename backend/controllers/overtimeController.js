const OvertimeRequest = require('../models/OvertimeRequest');

// @desc    Create an overtime request
// @route   POST /api/overtime-requests
// @access  Private
const createOvertimeRequest = async (req, res) => {
    const { person, date, shiftTimings, hoursRequested, reason } = req.body;

    try {
        const overtimeRequest = new OvertimeRequest({
            person,
            date,
            shiftTimings,
            hoursRequested,
            reason,
        });

        const createdOvertimeRequest = await overtimeRequest.save();
        res.status(201).json(createdOvertimeRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all overtime requests
// @route   GET /api/overtime-requests
// @access  Private
const getOvertimeRequests = async (req, res) => {
    try {
        const overtimeRequests = await OvertimeRequest.find({});
        res.json(overtimeRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an overtime request
// @route   PUT /api/overtime-requests/:id
// @access  Private
const updateOvertimeRequest = async (req, res) => {
    const { status, comments } = req.body;

    try {
        const overtimeRequest = await OvertimeRequest.findById(req.params.id);

        if (overtimeRequest) {
            overtimeRequest.status = status || overtimeRequest.status;
            overtimeRequest.comments = comments || overtimeRequest.comments;

            const updatedOvertimeRequest = await overtimeRequest.save();
            res.json(updatedOvertimeRequest);
        } else {
            res.status(404).json({ message: 'Overtime request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an overtime request
// @route   DELETE /api/overtime-requests/:id
// @access  Private
const deleteOvertimeRequest = async (req, res) => {
    try {
        //const overtimeRequest = await OvertimeRequest.findById(req.params.id);
        const overtimeRequest = await OvertimeRequest.findByIdAndDelete(req.params.id);

        if (overtimeRequest) {
            // await OvertimeRequest.findByIdAndDelete(req.params.id);
            //res.json({ message: 'Overtime request removed' });
            return res.status(200).json({ message: 'Overtime request removed' });            
        } else {
            res.status(404).json({ message: 'Overtime request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    createOvertimeRequest,
    getOvertimeRequests,
    updateOvertimeRequest,
    deleteOvertimeRequest,
};
