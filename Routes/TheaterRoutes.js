const express=require("express");
const { getTheater, addTheater,getSeatLayout, getTheaterForMovie, bookSeat,deleteTheater } = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const router=express.Router();
router.get("/theater_list",getTheater);
router.post("/add_theater",generateSeatsMiddleware,addTheater);
router.get("/seat_layout/:name/:movie_title/:showtime",getSeatLayout)
router.get("/get_theater/:location/:title",getTheaterForMovie)
router.put("/seatBook",bookSeat);
router.delete("/delete_theater/:theater_id",deleteTheater)
module.exports=router;
