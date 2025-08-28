const express = require('express');
const router = express.Router(); // Create a new Express router instance

const leaveController = require('../controllers/leaveController'); // Import leave request controller
const { protect } = require('../middleware/authMiddleware'); // Import authentication middleware

// Route to create a leave request
// Protected: requires user to be authenticated
router.post('/', protect, leaveController.createLeaveRequest);

// Route to get all leave requests
// Public access in this implementation (no auth middleware)
router.get('/', leaveController.getLeaveRequests);

// Route to update a leave request by ID
// Protected: requires user to be authenticated
router.put('/:id', protect, leaveController.updateLeaveRequest);

// Route to delete a leave request by ID
// Protected: requires user to be authenticated
router.delete('/:id', protect, leaveController.deleteLeaveRequest);

module.exports = router; // Export the router for use in the main app
