// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { createParkingLayout } = require("../Controllers/parkingController");

router.post("/add-layout", createParkingLayout);

module.exports = router;
