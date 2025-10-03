// services/ShiftService.js
const Shift = require("../models/Shift");

class ShiftService {
  async createShift({ person, start, end }) {
    const shift = new Shift({ person, start, end });
    return await shift.save();
  }

  async updateShift(id, updates) {
    return await Shift.findByIdAndUpdate(id, updates, { new: true });
  }
}

module.exports = ShiftService;
