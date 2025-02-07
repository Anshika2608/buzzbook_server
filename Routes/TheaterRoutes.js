const express=require("express");
const { getTheater, addTheater,getSeatLayout, getTheaterForMovie } = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const router=express.Router();
router.get("/theater_list",getTheater);
router.post("/add_theater",generateSeatsMiddleware,addTheater);
router.get("/seat_layout/:name",getSeatLayout)
router.get("/get_theater/:location/:title",getTheaterForMovie)
module.exports=router;
