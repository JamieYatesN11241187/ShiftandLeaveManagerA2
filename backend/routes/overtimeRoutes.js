const express = require('express');
const router = express.Router();
const {
    createOvertimeRequest,
    getOvertimeRequests,
    updateOvertimeRequest,
    deleteOvertimeRequest,
} = require('../controllers/overtimeController');
const { protect } = require('../middleware/authMiddleware');

router
    .route('/')
    .post(protect, createOvertimeRequest)
    .get(protect, getOvertimeRequests);

router
    .route('/:id')
    .put(protect, updateOvertimeRequest)
    .delete(protect, deleteOvertimeRequest);

module.exports = router;
