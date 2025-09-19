const express = require('express');
const router = express.Router();

const shiftController = require('../controllers/shiftController');
const { protect } = require('../middleware/authMiddleware');

// Route to get all shifts
router.get('/', shiftController.getShifts);

// Route to get shifts for the logged-in user
router.get('/user', protect, shiftController.getUserShifts);

// Route to create a new shift
router.post('/', shiftController.createShift);

// Route to delete a shift by ID
router.delete('/:id', shiftController.deleteShift);

// Route to update a shift by ID
router.put('/:id', shiftController.updateShift);

// Drop shift - only for the assigned person
router.put("/:id/drop", protect, shiftController.dropShift);

module.exports = router;
