// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { createParkingLayout,getAvailableParkingSlots } = require("../Controllers/parkingController");

router.post("/add-layout", createParkingLayout);
router.get("/available-slots", getAvailableParkingSlots);

module.exports = router;
