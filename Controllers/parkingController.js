const TheaterParkingLayout = require("../Models/parkingModel");
const generateParkingFloors = require("../Middleware/ParkingLayout");

// Create Parking Layout
const createParkingLayout = async (req, res) => {
  try {
    const { theater_id, floors } = req.body;

    if (!theater_id || !Array.isArray(floors) || floors.length === 0) {
      return res.status(400).json({ message: "theater_id and floors array are required." });
    }

    const existing = await TheaterParkingLayout.findOne({ theater_id });

    if (existing) {
      return res.status(409).json({
        message: "Parking layout for this theater already exists."
      });
    }

    const fullLayout = generateParkingFloors({ theater_id, floors });

    const saved = await TheaterParkingLayout.create(fullLayout);

    res.status(201).json({
      message: "Parking layout created successfully.",
      layout: saved
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create parking layout.",
      error: err.message
    });
  }
};

// Get Available Parking Slots
const getAvailableParkingSlots = async (req, res) => {
  try {
    const { theaterId, time } = req.query;

    if (!theaterId || !time) {
      return res.status(400).json({ message: "theaterId and time are required." });
    }

    const targetTime = new Date(time);

    const layout = await TheaterParkingLayout.findOne({ theater_id: theaterId });

    if (!layout) {
      return res.status(404).json({ message: "Parking layout not found." });
    }

    const availableBlocks = [];

    for (const floor of layout.floors) {
      for (const block of floor.blocks) {
        const currentBookings = block.bookings?.filter(booking =>
          new Date(booking.time).getTime() === targetTime.getTime()
        ) || [];

        const available_count = block.slots.length - currentBookings.length;

        if (available_count > 0) {
          availableBlocks.push({
            block_id: block.block_id,
            floor: floor.floor,
            vehicle_type: block.type,
            price: block.price,
            available_count
          });
        }
      }
    }

    res.status(200).json({
      message: "Available parking slots fetched successfully.",
      slots: availableBlocks
    });
  } catch (err) {
    console.error("Error fetching parking slots:", err);
    res.status(500).json({
      message: "Failed to fetch available parking slots.",
      error: err.message
    });
  }
};

module.exports = {
  createParkingLayout,
  getAvailableParkingSlots
};
