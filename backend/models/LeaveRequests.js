// models/Leave.js
const mongoose = require('mongoose');
const LeaveSchema = new mongoose.Schema({
  person: String,
  start: Date,
  end: Date,
  status: String, // e.g., 'approved', 'pending', 'rejected'
});
module.exports = mongoose.model('Leave', LeaveSchema);