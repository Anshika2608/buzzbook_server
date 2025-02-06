const express=require("express");
const { getTheater, addTheater,getSeatLayout } = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const router=express.Router();
router.get("/theater_list",getTheater);
router.post("/add_theater",generateSeatsMiddleware,addTheater);
router.get("/seat_layout/:name",getSeatLayout)
module.exports=router;
