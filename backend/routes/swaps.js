const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const swapController = require("../controllers/swapController");

// Request a swap for a shift
router.post("/:id", protect, swapController.requestSwap);

// Get all swap requests for logged-in user
router.get("/me", protect, swapController.getMySwaps);

// Accept or reject a swap
router.put("/:id/approval", protect, swapController.approveSwap);

module.exports = router;
