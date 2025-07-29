const express = require("express");
const router = express.Router();
const { holdSeats } = require("../Controllers/bookingController");


router.post("/hold-seats", holdSeats);

module.exports = router;
