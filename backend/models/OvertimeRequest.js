const mongoose = require('mongoose');

const overtimeRequestSchema = new mongoose.Schema({
    person: {
        type: String,
        required: true,
    },
    shiftTimings: {
        type: String,
        required: true,
    },
    hoursRequested: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    comments: {
        type: String,
    }
});

module.exports = mongoose.model('OvertimeRequest', overtimeRequestSchema);
