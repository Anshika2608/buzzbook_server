// controllers/parkingAdminController.js
const ParkingBlock = require("../Models/ParkingModel");
const generateParkingBlocks = require("../Middleware/ParkingLayout");

const createParkingLayout = async (req, res) => {
    try {
        console.log("📥 Received parking layout data:", req.body);
        const { theater_id, floors } = req.body;

        if (!theater_id || !Array.isArray(floors) || floors.length === 0) {
            return res.status(400).json({ message: "theater_id and floors array are required." });
        }
        const existing = await ParkingBlock.findOne({ theater_id, floor: { $in: floors.map(f => f.floor) } });

        if (existing) {
            return res.status(409).json({
                message: "Parking layout for one or more floors already exists for this theater."
            });
        }
        let allBlocks = [];

        for (const floorConfig of floors) {
            const {
                floor,
                fourWheelerBlocks,
                twoWheelerBlocks,
                capacity_per_block,
                four_wheeler_price,
                two_wheeler_price
            } = floorConfig;

            // Skip if essential values are missing
            if (!floorConfig || (!fourWheelerBlocks && !twoWheelerBlocks) || !capacity_per_block) {
                continue;
            }

            const blocks = generateParkingBlocks({
                theater_id,
                floor,
                fourWheelerBlocks,
                twoWheelerBlocks,
                capacity_per_block,
                four_wheeler_price,
                two_wheeler_price
            });

            allBlocks = allBlocks.concat(blocks);
        }

        if (allBlocks.length === 0) {
            return res.status(400).json({ message: "No valid blocks generated from floors data." });
        }

        const saved = await ParkingBlock.insertMany(allBlocks);

        res.status(201).json({
            message: "Parking layout for all floors created successfully.",
            total_blocks: saved.length,
            blocks: saved
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create multi-floor parking layout.",
            error: error.message
        });
    }
};

module.exports = { createParkingLayout };
