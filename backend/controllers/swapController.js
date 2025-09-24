const Shift = require("../models/Shift");

// POST /api/swaps/:id   (id = shiftId)
exports.requestSwap = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: "Shift not found" });

        if (shift.person === req.user.name) {
            return res.status(400).json({ message: "You cannot request a swap with yourself." });
        }

        // ensure array
        if (!Array.isArray(shift.swaps)) shift.swaps = [];

        // from = requester, to = current owner (auto-filled)
        const swap = { from: req.user.name, to: shift.person, status: "pending" };
        shift.swaps.push(swap);

        await shift.save();

        // return the last pushed swap (has _id)
        const created = shift.swaps[shift.swaps.length - 1];
        res.status(201).json({ message: "Swap request created", swap: created, shiftId: shift._id });
    } catch (err) {
        console.error("requestSwap error:", err);
        res.status(500).json({ message: "Failed to create swap", error: err.message });
    }
};

// GET /api/swaps/me
exports.getMySwaps = async (req, res) => {
    try {
        const shifts = await Shift.find({ "swaps.to": req.user.name });

        if (!shifts?.length) return res.json([]);

        const requests = [];
        for (const shift of shifts) {
            for (const s of shift.swaps) {
                if (s.to === req.user.name && s.status === "pending") {
                    requests.push({
                        shiftId: shift._id,
                        swap: { _id: s._id, from: s.from, to: s.to, status: s.status, createdAt: s.createdAt },
                        shift: { start: shift.start, end: shift.end, person: shift.person },
                    });
                }
            }
        }
        res.json(requests);
    } catch (err) {
        console.error("getMySwaps error:", err);
        res.status(500).json({ message: "Failed to fetch swaps", error: err.message });
    }
};

// PUT /api/swaps/:id/approval   (id = shiftId)  body: { swapId, action: "accept"|"reject" }
exports.approveSwap = async (req, res) => {
    try {
        const { swapId, action } = req.body;
        if (!swapId || !["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "swapId and valid action are required." });
        }

        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: "Shift not found" });

        const swap = shift.swaps.id(swapId);
        if (!swap) return res.status(404).json({ message: "Swap request not found" });

        // Only the target (current owner) can approve/reject
        if (swap.to !== req.user.name) {
            return res.status(403).json({ message: "You are not the target of this swap." });
        }
        if (swap.status !== "pending") {
            return res.status(409).json({ message: "This swap request is not pending." });
        }

        if (action === "accept") {
            // Assign the shift to the requester
            shift.person = swap.from;
            swap.status = "accepted";
        } else {
            swap.status = "rejected";
        }

        shift.markModified("swaps");

        await shift.save();

        // filter out all other pending swaps for this shift after acceptance
        if (action === "accept") {
            shift.swaps = shift.swaps.map(s => (s._id.equals(swap._id) ? s : { ...s, status: s.status === "pending" ? "rejected" : s.status }));
            shift.markModified("swaps");
            await shift.save();
        }

        res.json({ message: `Swap ${action}ed`, shift });
    } catch (err) {
        console.error("approveSwap error:", err);
        res.status(500).json({ message: "Failed to process swap", error: err.message });
    }
};
