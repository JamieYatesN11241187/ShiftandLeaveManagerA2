const express = require('express');
const router = express.Router(); // Create a new router instance

const shiftController = require('../controllers/shiftController'); // Import the shift controller functions

// Route to get all shifts
router.get('/', shiftController.getShifts);

// Route to create a new shift
router.post('/', shiftController.createShift);

// Route to delete a shift by ID

router.delete('/:id', shiftController.deleteShift);

// Route to update a shift by ID
router.put('/:id', shiftController.updateShift);

module.exports = router; // Export the router to be used in the main app
