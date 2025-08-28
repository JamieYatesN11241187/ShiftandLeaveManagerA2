const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions

// Define the schema for a Shift
const ShiftSchema = new mongoose.Schema({
  person: String,     // Name or identifier of the person assigned to the shift
  start: Date,        // Start date and time of the shift
  end: Date           // End date and time of the shift
});

// Export the Shift model based on the defined schema
module.exports = mongoose.model('Shift', ShiftSchema);
