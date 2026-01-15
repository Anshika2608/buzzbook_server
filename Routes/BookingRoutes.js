const express = require("express");
const router = express.Router();
const { holdSeats ,confirmBooking,updateTempBooking,releaseTempBooking,updateSeats} = require("../Controllers/bookingController");
const {authenticate}  = require("../Middleware/Authenticate");


router.post("/hold-seats",authenticate, holdSeats);
router.put("/temp/update", authenticate, updateTempBooking);
router.post("/temp/release", authenticate, releaseTempBooking);
router.put("/updateSeats", authenticate,updateSeats);
router.post("/book-seats",authenticate, confirmBooking);

module.exports = router;
