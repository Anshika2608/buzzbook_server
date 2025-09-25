const express = require("express");
const router = express.Router();
const { holdSeats ,confirmBooking} = require("../Controllers/bookingController");
const authenticate  = require("../Middleware/Authenticate");


router.post("/hold-seats", holdSeats);
router.post("/book-seats", confirmBooking);

module.exports = router;
