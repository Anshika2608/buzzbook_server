const express=require("express");
const { getTheater, addTheater,getSeatLayout, getTheaterForMovie, bookSeat,deleteTheater } = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const authenticate=require("../Middleware/Authenticate")
const router=express.Router();
router.get("/theater_list",authenticate,getTheater);
router.post("/add_theater",authenticate,generateSeatsMiddleware,addTheater);
router.get("/seat_layout/:name/:movie_title/:showtime",getSeatLayout)
router.get("/get_theater",getTheaterForMovie)
router.put("/seatBook",bookSeat);
router.delete("/delete_theater/:theater_id",authenticate,deleteTheater)
module.exports=router;
