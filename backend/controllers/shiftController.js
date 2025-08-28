const Shift = require('../models/Shift'); // Import the Shift model

// Create a new shift
exports.createShift = async (req, res) => {
  try {
    const { person, start, end } = req.body; // Destructure fields from request body

    // Create a new Shift instance with provided data
    const shift = new Shift({
      person,
      start,
      end,
    });

    await shift.save(); // Save the new shift to the database
    res.status(201).json(shift); // Return the created shift with 201 status
  } catch (error) {
    // Return error response in case of failure
    res.status(500).json({ message: 'Failed to create shift.', error: error.message });
  }
};

// Get all shifts
exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find(); // Fetch all shifts from the database
    res.json(shifts); // Return the array of shifts
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shifts', error: error.message });
  }
};

exports.updateShift = async (req, res) => {
  const { id } = req.params; // Extract shift ID from route parameters
  const { person, start, end } = req.body; // Extract updated data from request body

  try {
    const shift = await Shift.findById(id); // Find the shift by ID

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' }); // Return 404 if not found
    }

    // Update only provided fields
    shift.person = person || shift.person;
    shift.start = start || shift.start;
    shift.end = end || shift.end;

    const updatedShift = await shift.save(); // Save updated shift
    res.json(updatedShift); // Return the updated shift
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: 'Failed to update shift', error: error.message });
  }
};

// Delete a shift by ID
exports.deleteShift = async (req, res) => {
  const { id } = req.params; // Extract shift ID from route parameters

  try {
    const deleted = await Shift.findByIdAndDelete(id); // Attempt to delete the shift

    if (!deleted) {
      return res.status(404).json({ error: "Shift not found" }); // Return 404 if not found
    }

    res.status(200).json({ message: "Shift deleted successfully" }); // Confirm successful deletion
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete shift" });
  }
};
