// services/ComplianceDecorator.js
const User = require("../models/User");

function hoursBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return ms / (1000 * 60 * 60);
}

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  const a = new Date(diff);
  return Math.abs(a.getUTCFullYear() - 1970);
}

class ComplianceDecorator {
  constructor(service) {
    this.service = service;
  }

  async createShift({ person, start, end }) {
    // duration rule
    if (hoursBetween(start, end) > 9) {
      const err = new Error("Shift exceeds maximum 9 hours.");
      err.code = "MAX_DURATION";
      throw err;
    }
    // minimum age rule
    const user = await User.findOne({ name: person }) || await User.findById(person);
    const age = ageFromDob(user?.dob);
    if (age !== null && age < 14) {
      const err = new Error("Worker does not meet minimum legal age.");
      err.code = "MIN_AGE";
      throw err;
    }
    return this.service.createShift({ person, start, end });
  }

  async updateShift(id, updates) {
    const { start, end, person } = updates;

    if (start && end) {
      if (hoursBetween(start, end) > 9) {
        const err = new Error("Shift exceeds maximum 9 hours.");
        err.code = "MAX_DURATION";
        throw err;
      }
    }

    if (person) {
      const user = await User.findOne({ name: person }) || await User.findById(person);
      const age = ageFromDob(user?.dob);
      if (age !== null && age < 14) {
        const err = new Error("Worker does not meet minimum legal age.");
        err.code = "MIN_AGE";
        throw err;
      }
    }

    return this.service.updateShift(id, updates);
  }
}

module.exports = ComplianceDecorator;
