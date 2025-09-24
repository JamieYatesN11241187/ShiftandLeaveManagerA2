// models/Shift.js
const mongoose = require("mongoose");

const swapSchema = new mongoose.Schema({
  from: { type: String, required: true },     // requester
  to:   { type: String, required: true },     // current owner of the shift
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const shiftSchema = new mongoose.Schema({
  person: { type: String, required: true },
  start:  { type: Date, required: true },
  end:    { type: Date, required: true },
  swaps:  { type: [swapSchema], default: [] }   
});

module.exports = mongoose.model("Shift", shiftSchema);
